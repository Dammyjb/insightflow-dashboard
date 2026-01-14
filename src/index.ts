import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { apiRoutes } from './routes/api';
import { aiRoutes } from './routes/ai';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for development
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:8787'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.route('/api', apiRoutes);

// Mount AI routes
app.route('/api/ai', aiRoutes);

// Serve frontend for all other routes (SPA fallback)
app.get('*', async (c) => {
  // This will be handled by Cloudflare's asset serving
  return c.notFound();
});

export default app;
