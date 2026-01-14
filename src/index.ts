import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { apiRoutes } from './routes/api';
import { aiRoutes } from './routes/ai';
import { trackingRoutes } from './routes/tracking';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for development and production tracking
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:8787', '*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-InsightFlow-Key'],
}));

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.route('/api', apiRoutes);

// Mount AI routes
app.route('/api/ai', aiRoutes);

// Mount Tracking routes (data collection)
app.route('/api/track', trackingRoutes);

// Serve frontend for all other routes (SPA fallback)
app.get('*', async (c) => {
  // This will be handled by Cloudflare's asset serving
  return c.notFound();
});

// Scheduled handler for cron jobs
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  const baseUrl = 'http://localhost'; // Internal call

  // Run churn detection daily
  ctx.waitUntil(
    fetch(`${baseUrl}/api/track/cron/detect-churn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => console.error('Churn detection failed:', err))
  );

  // Run drop-off detection daily
  ctx.waitUntil(
    fetch(`${baseUrl}/api/track/cron/detect-dropoffs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => console.error('Drop-off detection failed:', err))
  );
}

export default {
  fetch: app.fetch,
  scheduled,
};
