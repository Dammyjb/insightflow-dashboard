import { Hono } from 'hono';
import type {
  Env,
  TrackSessionStartRequest,
  TrackSessionStartResponse,
  TrackActivityRequest,
  TrackEventRequest,
  TrackSessionEndRequest,
  TrackFeedbackRequest,
} from '../types';

const tracking = new Hono<{ Bindings: Env }>();

// Helper to generate UUIDs
function generateId(): string {
  return crypto.randomUUID();
}

// Helper to detect device type from user agent
function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Helper to detect browser from user agent
function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
}

// ============================================
// SESSION TRACKING
// ============================================

// Start a new tracking session
tracking.post('/session/start', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<TrackSessionStartRequest>();

  const userAgent = body.userAgent || c.req.header('User-Agent') || '';
  const sessionId = generateId();
  const userId = body.userId || `anon_${generateId().slice(0, 8)}`;
  const deviceType = body.deviceType || detectDeviceType(userAgent);
  const browser = body.browser || detectBrowser(userAgent);
  const referrerSource = body.referrerSource || 'direct';

  try {
    await db.prepare(`
      INSERT INTO user_sessions (id, user_id, session_start, device_type, browser, referrer_source)
      VALUES (?, ?, datetime('now'), ?, ?, ?)
    `).bind(sessionId, userId, deviceType, browser, referrerSource).run();

    // Clear cache since we have new data
    await c.env.CACHE.delete('journey_metrics');

    const response: TrackSessionStartResponse = {
      sessionId,
      userId,
      startedAt: new Date().toISOString(),
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Session start error:', error);
    return c.json({ error: 'Failed to start session' }, 500);
  }
});

// End a tracking session
tracking.post('/session/end', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<TrackSessionEndRequest>();

  if (!body.sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  try {
    // Update session end time
    await db.prepare(`
      UPDATE user_sessions
      SET session_end = datetime('now')
      WHERE id = ? AND session_end IS NULL
    `).bind(body.sessionId).run();

    // Mark the last activity as potential drop-off if no conversion happened
    const lastActivity = await db.prepare(`
      SELECT id, page_path FROM user_activities
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).bind(body.sessionId).first();

    // Check if this session completed a conversion
    const session = await db.prepare(`
      SELECT user_id FROM user_sessions WHERE id = ?
    `).bind(body.sessionId).first();

    if (session && lastActivity) {
      const hasConversion = await db.prepare(`
        SELECT 1 FROM conversion_events
        WHERE user_id = ? AND event_type = 'purchase' AND completed = 1
      `).bind(session.user_id).first();

      // If no purchase, mark last activity as drop-off (unless it's confirmation page)
      if (!hasConversion && lastActivity.page_path !== '/confirmation') {
        await db.prepare(`
          UPDATE user_activities SET drop_off = 1 WHERE id = ?
        `).bind(lastActivity.id).run();
      }
    }

    // Clear cache
    await c.env.CACHE.delete('journey_metrics');

    return c.json({ success: true, sessionId: body.sessionId });
  } catch (error) {
    console.error('Session end error:', error);
    return c.json({ error: 'Failed to end session' }, 500);
  }
});

// ============================================
// ACTIVITY TRACKING
// ============================================

// Track a user activity (page view, action, event)
tracking.post('/activity', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<TrackActivityRequest>();

  if (!body.sessionId || !body.activityName || !body.pagePath) {
    return c.json({ error: 'sessionId, activityName, and pagePath are required' }, 400);
  }

  const activityId = generateId();
  const activityType = body.activityType || 'page_view';
  const durationSeconds = body.durationSeconds || 0;
  const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

  try {
    await db.prepare(`
      INSERT INTO user_activities (id, session_id, activity_name, activity_type, page_path, duration_seconds, timestamp, drop_off, metadata)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0, ?)
    `).bind(activityId, body.sessionId, body.activityName, activityType, body.pagePath, durationSeconds, metadata).run();

    // Clear cache
    await c.env.CACHE.delete('journey_metrics');

    return c.json({
      success: true,
      activityId,
      timestamp: new Date().toISOString()
    }, 201);
  } catch (error) {
    console.error('Activity tracking error:', error);
    return c.json({ error: 'Failed to track activity' }, 500);
  }
});

// Update activity duration (called when user leaves page)
tracking.patch('/activity/:activityId/duration', async (c) => {
  const db = c.env.DB;
  const activityId = c.req.param('activityId');
  const body = await c.req.json<{ durationSeconds: number }>();

  if (!body.durationSeconds) {
    return c.json({ error: 'durationSeconds is required' }, 400);
  }

  try {
    await db.prepare(`
      UPDATE user_activities SET duration_seconds = ? WHERE id = ?
    `).bind(body.durationSeconds, activityId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Duration update error:', error);
    return c.json({ error: 'Failed to update duration' }, 500);
  }
});

// ============================================
// CONVERSION EVENT TRACKING
// ============================================

// Track a conversion event
tracking.post('/event', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<TrackEventRequest>();

  if (!body.sessionId || !body.userId || !body.eventType) {
    return c.json({ error: 'sessionId, userId, and eventType are required' }, 400);
  }

  const eventId = generateId();
  const funnelStep = body.funnelStep || getFunnelStepForEvent(body.eventType);
  const completed = body.completed !== false;
  const revenue = body.revenue || null;
  const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

  try {
    await db.prepare(`
      INSERT INTO conversion_events (id, user_id, event_type, funnel_step, completed, timestamp, revenue, metadata)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).bind(eventId, body.userId, body.eventType, funnelStep, completed ? 1 : 0, revenue, metadata).run();

    // Update funnel counts
    await updateFunnelCounts(db, funnelStep, completed);

    // Clear cache
    await c.env.CACHE.delete('conversion_metrics');

    return c.json({
      success: true,
      eventId,
      funnelStep,
      timestamp: new Date().toISOString()
    }, 201);
  } catch (error) {
    console.error('Event tracking error:', error);
    return c.json({ error: 'Failed to track event' }, 500);
  }
});

// Helper: Get default funnel step for event type
function getFunnelStepForEvent(eventType: string): number {
  const steps: Record<string, number> = {
    'page_view': 1,
    'signup': 2,
    'add_to_cart': 3,
    'checkout': 4,
    'purchase': 5,
  };
  return steps[eventType] || 1;
}

// Helper: Update funnel counts
async function updateFunnelCounts(db: D1Database, funnelStep: number, completed: boolean) {
  try {
    // Increment users_entered for this step
    await db.prepare(`
      UPDATE conversion_funnel
      SET users_entered = users_entered + 1,
          users_completed = users_completed + CASE WHEN ? = 1 THEN 1 ELSE 0 END,
          drop_off_count = drop_off_count + CASE WHEN ? = 0 THEN 1 ELSE 0 END,
          updated_at = datetime('now')
      WHERE step_order = ?
    `).bind(completed ? 1 : 0, completed ? 0 : 1, funnelStep).run();
  } catch (error) {
    console.error('Failed to update funnel counts:', error);
  }
}

// ============================================
// FEEDBACK TRACKING
// ============================================

// Track user feedback
tracking.post('/feedback', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<TrackFeedbackRequest>();

  if (!body.userId || !body.feedbackType) {
    return c.json({ error: 'userId and feedbackType are required' }, 400);
  }

  const feedbackId = generateId();

  try {
    await db.prepare(`
      INSERT INTO user_feedback (id, user_id, session_id, feedback_type, rating, comment, page_path, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      feedbackId,
      body.userId,
      body.sessionId || null,
      body.feedbackType,
      body.rating || null,
      body.comment || null,
      body.pagePath || null
    ).run();

    return c.json({
      success: true,
      feedbackId,
      timestamp: new Date().toISOString()
    }, 201);
  } catch (error) {
    console.error('Feedback tracking error:', error);
    return c.json({ error: 'Failed to track feedback' }, 500);
  }
});

// ============================================
// CHURN DETECTION (Called by Cron)
// ============================================

// Mark churned users (users who haven't returned in 30 days)
tracking.post('/cron/detect-churn', async (c) => {
  const db = c.env.DB;

  try {
    // Find users whose last session was more than 30 days ago and mark them as churned
    const result = await db.prepare(`
      UPDATE user_sessions
      SET is_churned = 1
      WHERE id IN (
        SELECT s1.id
        FROM user_sessions s1
        WHERE s1.is_churned = 0
        AND s1.session_end IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM user_sessions s2
          WHERE s2.user_id = s1.user_id
          AND s2.session_start > datetime('now', '-30 days')
        )
        AND s1.session_start = (
          SELECT MAX(s3.session_start)
          FROM user_sessions s3
          WHERE s3.user_id = s1.user_id
        )
      )
    `).run();

    // Clear cache
    await c.env.CACHE.delete('journey_metrics');

    return c.json({
      success: true,
      message: 'Churn detection completed',
      rowsAffected: result.meta?.changes || 0
    });
  } catch (error) {
    console.error('Churn detection error:', error);
    return c.json({ error: 'Failed to detect churn' }, 500);
  }
});

// ============================================
// DROP-OFF DETECTION (Called by Cron)
// ============================================

// Detect and mark drop-off points
tracking.post('/cron/detect-dropoffs', async (c) => {
  const db = c.env.DB;

  try {
    // Mark activities as drop-offs where:
    // 1. Session has ended
    // 2. This was the last activity in the session
    // 3. User didn't complete a purchase
    const result = await db.prepare(`
      UPDATE user_activities
      SET drop_off = 1
      WHERE id IN (
        SELECT a.id
        FROM user_activities a
        JOIN user_sessions s ON a.session_id = s.id
        WHERE s.session_end IS NOT NULL
        AND a.drop_off = 0
        AND a.page_path != '/confirmation'
        AND a.timestamp = (
          SELECT MAX(a2.timestamp)
          FROM user_activities a2
          WHERE a2.session_id = a.session_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM conversion_events ce
          WHERE ce.user_id = s.user_id
          AND ce.event_type = 'purchase'
          AND ce.completed = 1
          AND ce.timestamp >= s.session_start
          AND ce.timestamp <= COALESCE(s.session_end, datetime('now'))
        )
      )
    `).run();

    // Clear cache
    await c.env.CACHE.delete('journey_metrics');

    return c.json({
      success: true,
      message: 'Drop-off detection completed',
      rowsAffected: result.meta?.changes || 0
    });
  } catch (error) {
    console.error('Drop-off detection error:', error);
    return c.json({ error: 'Failed to detect drop-offs' }, 500);
  }
});

export { tracking as trackingRoutes };
