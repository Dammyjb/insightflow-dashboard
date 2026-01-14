import { Hono } from 'hono';
import type { Env, JourneyMetrics, ConversionMetrics, DropOffPoint, FunnelStep } from '../types';

const api = new Hono<{ Bindings: Env }>();

// ============================================
// USER JOURNEY ENDPOINTS
// ============================================

// Get user journey metrics
api.get('/journey/metrics', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  // Try cache first
  const cached = await cache.get('journey_metrics', 'json');
  if (cached) {
    return c.json(cached);
  }

  try {
    // Total sessions and churn rate
    const sessionsResult = await db.prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(CASE WHEN is_churned = 1 THEN 1 ELSE 0 END) as churned_sessions,
        AVG(
          CASE
            WHEN session_end IS NOT NULL
            THEN (julianday(session_end) - julianday(session_start)) * 86400
            ELSE 300
          END
        ) as avg_duration
      FROM user_sessions
    `).first();

    // Drop-off points
    const dropOffs = await db.prepare(`
      SELECT
        page_path,
        COUNT(*) as drop_off_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_activities), 2) as drop_off_rate
      FROM user_activities
      WHERE drop_off = 1
      GROUP BY page_path
      ORDER BY drop_off_count DESC
      LIMIT 10
    `).all();

    // Activity breakdown
    const activityBreakdown = await db.prepare(`
      SELECT
        activity_name,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_activities), 2) as percentage
      FROM user_activities
      GROUP BY activity_name
      ORDER BY count DESC
    `).all();

    // Time per activity
    const timePerActivity = await db.prepare(`
      SELECT
        activity_name,
        ROUND(AVG(duration_seconds), 2) as avg_duration,
        SUM(duration_seconds) as total_time
      FROM user_activities
      GROUP BY activity_name
      ORDER BY avg_duration DESC
    `).all();

    const metrics: JourneyMetrics = {
      totalSessions: (sessionsResult?.total_sessions as number) || 0,
      avgSessionDuration: Math.round((sessionsResult?.avg_duration as number) || 0),
      churnRate: sessionsResult?.total_sessions
        ? Math.round(((sessionsResult.churned_sessions as number) / (sessionsResult.total_sessions as number)) * 100)
        : 0,
      dropOffPoints: (dropOffs.results || []).map(row => ({
        page: row.page_path as string,
        dropOffCount: row.drop_off_count as number,
        dropOffRate: row.drop_off_rate as number,
      })),
      activityBreakdown: (activityBreakdown.results || []).map(row => ({
        activity: row.activity_name as string,
        count: row.count as number,
        percentage: row.percentage as number,
      })),
      timePerActivity: (timePerActivity.results || []).map(row => ({
        activity: row.activity_name as string,
        avgDuration: row.avg_duration as number,
        totalTime: row.total_time as number,
      })),
    };

    // Cache for 5 minutes
    await cache.put('journey_metrics', JSON.stringify(metrics), { expirationTtl: 300 });

    return c.json(metrics);
  } catch (error) {
    console.error('Journey metrics error:', error);
    return c.json({ error: 'Failed to fetch journey metrics' }, 500);
  }
});

// Get user sessions timeline
api.get('/journey/sessions', async (c) => {
  const db = c.env.DB;

  try {
    const sessions = await db.prepare(`
      SELECT
        DATE(session_start) as date,
        COUNT(*) as sessions,
        SUM(CASE WHEN is_churned = 1 THEN 1 ELSE 0 END) as churned
      FROM user_sessions
      GROUP BY DATE(session_start)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    return c.json(sessions.results || []);
  } catch (error) {
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

// Get user flow data
api.get('/journey/flow', async (c) => {
  const db = c.env.DB;

  try {
    const flow = await db.prepare(`
      SELECT
        a1.page_path as from_page,
        a2.page_path as to_page,
        COUNT(*) as transitions
      FROM user_activities a1
      JOIN user_activities a2 ON a1.session_id = a2.session_id
        AND a2.timestamp > a1.timestamp
        AND NOT EXISTS (
          SELECT 1 FROM user_activities a3
          WHERE a3.session_id = a1.session_id
          AND a3.timestamp > a1.timestamp
          AND a3.timestamp < a2.timestamp
        )
      GROUP BY a1.page_path, a2.page_path
      ORDER BY transitions DESC
      LIMIT 20
    `).all();

    return c.json(flow.results || []);
  } catch (error) {
    return c.json({ error: 'Failed to fetch flow data' }, 500);
  }
});

// ============================================
// CONVERSION RATE ENDPOINTS
// ============================================

// Get conversion metrics
api.get('/conversion/metrics', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  // Try cache first
  const cached = await cache.get('conversion_metrics', 'json');
  if (cached) {
    return c.json(cached);
  }

  try {
    // Bounce rate calculation
    const bounceResult = await db.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE
          WHEN user_id IN (
            SELECT user_id FROM conversion_events GROUP BY user_id HAVING COUNT(*) = 1
          ) THEN user_id
        END) as bounced_users
      FROM conversion_events
    `).first();

    // Overall conversion rate (users who completed purchase)
    const conversionResult = await db.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN event_type = 'purchase' AND completed = 1 THEN user_id END) as converted_users
      FROM conversion_events
    `).first();

    // Funnel steps
    const funnelSteps = await db.prepare(`
      SELECT
        step_name,
        step_order,
        users_entered,
        users_completed,
        ROUND((users_entered - users_completed) * 100.0 / NULLIF(users_entered, 0), 2) as drop_off_rate
      FROM conversion_funnel
      ORDER BY step_order
    `).all();

    // Daily conversions
    const dailyConversions = await db.prepare(`
      SELECT
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'purchase' AND completed = 1 THEN user_id END) as conversions
      FROM conversion_events
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    // Revenue metrics
    const revenueResult = await db.prepare(`
      SELECT
        SUM(revenue) as total_revenue,
        AVG(revenue) as avg_order_value,
        COUNT(*) as total_purchases
      FROM conversion_events
      WHERE event_type = 'purchase' AND completed = 1 AND revenue IS NOT NULL
    `).first();

    const totalUsers = (bounceResult?.total_users as number) || 1;
    const bouncedUsers = (bounceResult?.bounced_users as number) || 0;
    const convertedUsers = (conversionResult?.converted_users as number) || 0;

    const metrics: ConversionMetrics = {
      bounceRate: Math.round((bouncedUsers / totalUsers) * 100),
      overallConversionRate: Math.round((convertedUsers / totalUsers) * 100),
      funnelSteps: (funnelSteps.results || []).map(row => ({
        step: row.step_name as string,
        stepOrder: row.step_order as number,
        entered: row.users_entered as number,
        completed: row.users_completed as number,
        dropOffRate: row.drop_off_rate as number,
      })),
      dailyConversions: (dailyConversions.results || []).map(row => ({
        date: row.date as string,
        visitors: row.visitors as number,
        conversions: row.conversions as number,
        rate: row.visitors ? Math.round((row.conversions as number) / (row.visitors as number) * 100) : 0,
      })),
      revenueMetrics: {
        totalRevenue: (revenueResult?.total_revenue as number) || 0,
        avgOrderValue: Math.round((revenueResult?.avg_order_value as number) || 0),
        conversionValue: (revenueResult?.total_revenue as number) || 0,
      },
    };

    // Cache for 5 minutes
    await cache.put('conversion_metrics', JSON.stringify(metrics), { expirationTtl: 300 });

    return c.json(metrics);
  } catch (error) {
    console.error('Conversion metrics error:', error);
    return c.json({ error: 'Failed to fetch conversion metrics' }, 500);
  }
});

// Get funnel visualization data
api.get('/conversion/funnel', async (c) => {
  const db = c.env.DB;

  try {
    const funnel = await db.prepare(`
      SELECT * FROM conversion_funnel ORDER BY step_order
    `).all();

    return c.json(funnel.results || []);
  } catch (error) {
    return c.json({ error: 'Failed to fetch funnel data' }, 500);
  }
});

// Clear cache endpoint (for testing)
api.post('/cache/clear', async (c) => {
  const cache = c.env.CACHE;

  await cache.delete('journey_metrics');
  await cache.delete('conversion_metrics');

  return c.json({ success: true, message: 'Cache cleared' });
});

export { api as apiRoutes };
