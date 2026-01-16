import { Hono } from 'hono';
import type { Env, JourneyMetrics, ConversionMetrics, DropOffPoint, FunnelStep } from '../types';

const api = new Hono<{ Bindings: Env }>();

// Track request timing for Cloudflare metrics
const requestTimings: { endpoint: string; duration: number; timestamp: number; cacheHit: boolean }[] = [];

// Helper to record timing
function recordTiming(endpoint: string, duration: number, cacheHit: boolean) {
  requestTimings.push({
    endpoint,
    duration,
    timestamp: Date.now(),
    cacheHit,
  });
  // Keep only last 100 requests
  if (requestTimings.length > 100) {
    requestTimings.shift();
  }
}

// ============================================
// USER JOURNEY ENDPOINTS
// ============================================

// Get user journey metrics
api.get('/journey/metrics', async (c) => {
  const startTime = Date.now();
  const db = c.env.DB;
  const cache = c.env.CACHE;

  // Try cache first
  const cached = await cache.get('journey_metrics', 'json');
  if (cached) {
    recordTiming('/journey/metrics', Date.now() - startTime, true);
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

    recordTiming('/journey/metrics', Date.now() - startTime, false);
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
  const startTime = Date.now();
  const db = c.env.DB;
  const cache = c.env.CACHE;

  // Try cache first
  const cached = await cache.get('conversion_metrics', 'json');
  if (cached) {
    recordTiming('/conversion/metrics', Date.now() - startTime, true);
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

    recordTiming('/conversion/metrics', Date.now() - startTime, false);
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

// ============================================
// CLOUDFLARE METRICS ENDPOINTS
// ============================================

// Get Cloudflare Workers performance metrics
api.get('/cloudflare/metrics', async (c) => {
  // Calculate metrics from recent requests
  const recentTimings = requestTimings.filter(
    (t) => Date.now() - t.timestamp < 5 * 60 * 1000 // Last 5 minutes
  );

  const totalRequests = recentTimings.length;
  const cacheHits = recentTimings.filter((t) => t.cacheHit).length;
  const cacheMisses = totalRequests - cacheHits;
  const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;

  const avgLatency = totalRequests > 0
    ? Math.round(recentTimings.reduce((sum, t) => sum + t.duration, 0) / totalRequests)
    : 0;

  const p95Latency = totalRequests > 0
    ? calculatePercentile(recentTimings.map((t) => t.duration), 95)
    : 0;

  // Get latency by endpoint
  const endpointStats: Record<string, { count: number; avgLatency: number }> = {};
  for (const timing of recentTimings) {
    if (!endpointStats[timing.endpoint]) {
      endpointStats[timing.endpoint] = { count: 0, avgLatency: 0 };
    }
    const stat = endpointStats[timing.endpoint];
    stat.avgLatency = (stat.avgLatency * stat.count + timing.duration) / (stat.count + 1);
    stat.count++;
  }

  return c.json({
    performance: {
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      totalRequests,
      requestsPerMinute: Math.round(totalRequests / 5),
    },
    cache: {
      hits: cacheHits,
      misses: cacheMisses,
      hitRate: cacheHitRate,
      kvNamespace: 'CACHE',
      ttlSeconds: 300,
      cachedKeys: ['journey_metrics', 'conversion_metrics'],
    },
    endpoints: Object.entries(endpointStats).map(([endpoint, stats]) => ({
      endpoint,
      requestCount: stats.count,
      avgLatencyMs: Math.round(stats.avgLatency),
    })),
    worker: {
      name: 'insightflow-dashboard',
      region: 'edge', // Workers run at the edge closest to user
      runtime: 'Cloudflare Workers',
    },
  });
});

// Helper function to calculate percentile
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// ============================================
// SMART RECOMMENDATIONS ENDPOINTS
// ============================================

// Generate smart recommendations based on current metrics
api.get('/recommendations', async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  try {
    // Fetch current metrics (use cache if available)
    let journeyMetrics = await cache.get('journey_metrics', 'json') as JourneyMetrics | null;
    let conversionMetrics = await cache.get('conversion_metrics', 'json') as ConversionMetrics | null;

    // If not cached, fetch from DB
    if (!journeyMetrics) {
      const sessionsResult = await db.prepare(`
        SELECT
          COUNT(*) as total_sessions,
          SUM(CASE WHEN is_churned = 1 THEN 1 ELSE 0 END) as churned_sessions
        FROM user_sessions
      `).first();

      const dropOffs = await db.prepare(`
        SELECT page_path, COUNT(*) as drop_off_count
        FROM user_activities WHERE drop_off = 1
        GROUP BY page_path ORDER BY drop_off_count DESC LIMIT 5
      `).all();

      journeyMetrics = {
        totalSessions: (sessionsResult?.total_sessions as number) || 0,
        avgSessionDuration: 0,
        churnRate: sessionsResult?.total_sessions
          ? Math.round(((sessionsResult.churned_sessions as number) / (sessionsResult.total_sessions as number)) * 100)
          : 0,
        dropOffPoints: (dropOffs.results || []).map(row => ({
          page: row.page_path as string,
          dropOffCount: row.drop_off_count as number,
          dropOffRate: 0,
        })),
        activityBreakdown: [],
        timePerActivity: [],
      };
    }

    if (!conversionMetrics) {
      const bounceResult = await db.prepare(`
        SELECT
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN user_id IN (
            SELECT user_id FROM conversion_events GROUP BY user_id HAVING COUNT(*) = 1
          ) THEN user_id END) as bounced_users
        FROM conversion_events
      `).first();

      const conversionResult = await db.prepare(`
        SELECT
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN event_type = 'purchase' AND completed = 1 THEN user_id END) as converted
        FROM conversion_events
      `).first();

      const funnelSteps = await db.prepare(`
        SELECT step_name, step_order, users_entered, users_completed,
          ROUND((users_entered - users_completed) * 100.0 / NULLIF(users_entered, 0), 1) as drop_off_rate
        FROM conversion_funnel ORDER BY step_order
      `).all();

      const totalUsers = (bounceResult?.total_users as number) || 1;
      const bouncedUsers = (bounceResult?.bounced_users as number) || 0;
      const convertedUsers = (conversionResult?.converted as number) || 0;

      conversionMetrics = {
        bounceRate: Math.round((bouncedUsers / totalUsers) * 100),
        overallConversionRate: Math.round((convertedUsers / totalUsers) * 100),
        funnelSteps: (funnelSteps.results || []).map(row => ({
          step: row.step_name as string,
          stepOrder: row.step_order as number,
          entered: row.users_entered as number,
          completed: row.users_completed as number,
          dropOffRate: row.drop_off_rate as number,
        })),
        dailyConversions: [],
        revenueMetrics: { totalRevenue: 0, avgOrderValue: 0, conversionValue: 0 },
      };
    }

    // Generate smart recommendations based on thresholds
    const recommendations: {
      id: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      category: 'journey' | 'conversion' | 'engagement';
      title: string;
      description: string;
      metric: string;
      currentValue: number;
      targetValue: number;
      impact: string;
    }[] = [];

    // Churn Rate Recommendations
    if (journeyMetrics.churnRate > 25) {
      recommendations.push({
        id: 'churn-critical',
        priority: 'critical',
        category: 'journey',
        title: 'High Churn Rate Detected',
        description: 'Your churn rate exceeds 25%. Implement a re-engagement email campaign targeting users who haven\'t returned in 14 days. Consider adding exit-intent surveys to understand why users are leaving.',
        metric: 'Churn Rate',
        currentValue: journeyMetrics.churnRate,
        targetValue: 15,
        impact: 'Reducing churn by 10% could increase monthly active users by 15-20%',
      });
    } else if (journeyMetrics.churnRate > 15) {
      recommendations.push({
        id: 'churn-high',
        priority: 'high',
        category: 'journey',
        title: 'Elevated Churn Rate',
        description: 'Churn is above industry average. Analyze the user journey for friction points and consider implementing onboarding improvements or feature tutorials.',
        metric: 'Churn Rate',
        currentValue: journeyMetrics.churnRate,
        targetValue: 10,
        impact: 'Each 5% reduction in churn increases customer lifetime value by ~25%',
      });
    }

    // Bounce Rate Recommendations
    if (conversionMetrics.bounceRate > 40) {
      recommendations.push({
        id: 'bounce-critical',
        priority: 'critical',
        category: 'conversion',
        title: 'Critical Bounce Rate',
        description: 'Over 40% of visitors leave immediately. Check page load times (target <3s), ensure mobile responsiveness, and verify your landing page matches ad/search expectations.',
        metric: 'Bounce Rate',
        currentValue: conversionMetrics.bounceRate,
        targetValue: 25,
        impact: 'Reducing bounce rate by 15% could double your conversion rate',
      });
    } else if (conversionMetrics.bounceRate > 25) {
      recommendations.push({
        id: 'bounce-high',
        priority: 'high',
        category: 'conversion',
        title: 'High Bounce Rate',
        description: 'Consider A/B testing your landing page headline and CTA placement. Add social proof elements and ensure value proposition is clear above the fold.',
        metric: 'Bounce Rate',
        currentValue: conversionMetrics.bounceRate,
        targetValue: 20,
        impact: 'Lower bounce rates correlate with 2-3x higher conversion rates',
      });
    }

    // Conversion Rate Recommendations
    if (conversionMetrics.overallConversionRate < 2) {
      recommendations.push({
        id: 'conversion-critical',
        priority: 'critical',
        category: 'conversion',
        title: 'Low Conversion Rate',
        description: 'Conversion rate is below 2%. Review your checkout flow for friction, consider offering guest checkout, and add trust signals (security badges, reviews).',
        metric: 'Conversion Rate',
        currentValue: conversionMetrics.overallConversionRate,
        targetValue: 5,
        impact: 'Industry average is 2-5%. Reaching 5% would increase revenue by 150%+',
      });
    } else if (conversionMetrics.overallConversionRate < 5) {
      recommendations.push({
        id: 'conversion-medium',
        priority: 'medium',
        category: 'conversion',
        title: 'Conversion Optimization Opportunity',
        description: 'Test reducing form fields, adding progress indicators, and implementing cart abandonment emails to push conversion above 5%.',
        metric: 'Conversion Rate',
        currentValue: conversionMetrics.overallConversionRate,
        targetValue: 8,
        impact: 'Each 1% increase in conversion = significant revenue growth',
      });
    }

    // Funnel Drop-off Recommendations
    for (const step of conversionMetrics.funnelSteps) {
      if (step.dropOffRate > 35) {
        recommendations.push({
          id: `funnel-${step.stepOrder}`,
          priority: step.dropOffRate > 45 ? 'critical' : 'high',
          category: 'conversion',
          title: `Funnel Leak: ${step.step}`,
          description: `${step.dropOffRate}% of users drop off at "${step.step}". This is your biggest conversion opportunity. Simplify this step, reduce required fields, or add reassuring copy.`,
          metric: `${step.step} Drop-off`,
          currentValue: step.dropOffRate,
          targetValue: 20,
          impact: `Fixing this step alone could increase conversions by ${Math.round(step.dropOffRate * 0.3)}%`,
        });
        break; // Only show the worst funnel step
      }
    }

    // Drop-off Point Recommendations
    if (journeyMetrics.dropOffPoints.length > 0) {
      const worstDropOff = journeyMetrics.dropOffPoints[0];
      if (worstDropOff.dropOffCount > 5) {
        recommendations.push({
          id: 'dropoff-page',
          priority: 'high',
          category: 'journey',
          title: `High Drop-off on ${worstDropOff.page}`,
          description: `Users frequently leave from ${worstDropOff.page}. Review this page for UX issues, broken elements, or confusing navigation. Consider adding a help widget or live chat.`,
          metric: 'Page Drop-offs',
          currentValue: worstDropOff.dropOffCount,
          targetValue: Math.round(worstDropOff.dropOffCount * 0.5),
          impact: 'Reducing drop-offs here could improve overall session completion by 20%',
        });
      }
    }

    // Engagement Recommendation (always show at least one positive)
    if (recommendations.length === 0 || conversionMetrics.overallConversionRate >= 5) {
      recommendations.push({
        id: 'engagement-positive',
        priority: 'low',
        category: 'engagement',
        title: 'Strong Performance - Optimize Further',
        description: 'Your metrics are healthy! Focus on incremental improvements: test new CTAs, implement personalization, or expand successful user paths.',
        metric: 'Overall Health',
        currentValue: 100 - journeyMetrics.churnRate,
        targetValue: 95,
        impact: 'Fine-tuning can yield 5-10% additional improvements',
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return c.json({
      recommendations,
      summary: {
        criticalCount: recommendations.filter((r) => r.priority === 'critical').length,
        highCount: recommendations.filter((r) => r.priority === 'high').length,
        totalRecommendations: recommendations.length,
        healthScore: calculateHealthScore(journeyMetrics, conversionMetrics),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return c.json({ error: 'Failed to generate recommendations' }, 500);
  }
});

// Calculate overall health score (0-100)
function calculateHealthScore(journey: JourneyMetrics, conversion: ConversionMetrics): number {
  let score = 100;

  // Deduct for churn (max -30)
  score -= Math.min(30, journey.churnRate);

  // Deduct for bounce rate (max -25)
  score -= Math.min(25, conversion.bounceRate * 0.5);

  // Deduct for low conversion (max -25)
  if (conversion.overallConversionRate < 5) {
    score -= Math.min(25, (5 - conversion.overallConversionRate) * 5);
  }

  // Deduct for funnel issues (max -20)
  const avgFunnelDropOff = conversion.funnelSteps.reduce((sum, s) => sum + s.dropOffRate, 0) / (conversion.funnelSteps.length || 1);
  if (avgFunnelDropOff > 25) {
    score -= Math.min(20, (avgFunnelDropOff - 25) * 0.5);
  }

  return Math.max(0, Math.round(score));
}

export { api as apiRoutes };
