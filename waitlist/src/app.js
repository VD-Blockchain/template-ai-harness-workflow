import express from 'express';
import { pool } from './db.js';
import { isValidEmail } from './validate.js';

// Wrap an async route so a rejected promise (or a sync throw inside an async
// function) is forwarded to the error middleware instead of becoming an
// unhandled rejection that crashes the Node 24 process.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function createApp() {
  const app = express();

  // Do not advertise the framework.
  app.disable('x-powered-by');

  // Baseline security headers on every response (API is JSON-only).
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Bounded JSON body; malformed JSON / oversized bodies are caught by the
  // error middleware below (never crash, never leak a stack).
  app.use(express.json({ limit: '10kb' }));

  // Container healthcheck — not proxied by nginx.
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // UC-1: submit a waitlist signup (email-only, deduplicated).
  app.post(
    '/api/waitlist',
    asyncHandler(async (req, res) => {
      const raw = req.body?.email;
      // Strict type check BEFORE any coercion — a non-string email (object,
      // array, number, null, …) is rejected outright, so String()/.trim()
      // can never throw on hostile input.
      if (typeof raw !== 'string') {
        return res.status(400).json({ error: 'invalid_email' });
      }
      const email = raw.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'invalid_email' });
      }
      const r = await pool.query(
        'INSERT INTO waitlist(email) VALUES($1) ON CONFLICT(email) DO NOTHING RETURNING id',
        [email],
      );
      return res
        .status(r.rowCount ? 201 : 200)
        .json({ status: r.rowCount ? 'created' : 'already_registered' });
    }),
  );

  // UC-2: public signup count (social proof).
  app.get(
    '/api/waitlist/count',
    asyncHandler(async (_req, res) => {
      const r = await pool.query('SELECT count(*) FROM waitlist');
      return res.json({ count: Number(r.rows[0].count) });
    }),
  );

  // Centralized error handler — generic JSON only. No stack traces, file paths,
  // or framework versions are ever returned to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const isBadRequest =
      err?.type === 'entity.parse.failed' || // malformed JSON
      err?.type === 'entity.too.large' || // body over the 10kb limit
      err?.status === 400 ||
      err?.statusCode === 400;
    const status = isBadRequest ? 400 : err?.status || err?.statusCode || 500;
    if (status >= 500) console.error('unhandled error:', err?.message);
    res.status(status).json({ error: isBadRequest ? 'bad_request' : 'internal_error' });
  });

  return app;
}

export const app = createApp();
