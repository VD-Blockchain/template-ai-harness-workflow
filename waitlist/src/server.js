import express from 'express';
import { pool, init } from './db.js';
import { isValidEmail } from './validate.js';

const app = express();
app.use(express.json());

// Container healthcheck — not proxied by nginx.
app.get('/health', (_req, res) => res.json({ ok: true }));

// UC-1: submit a waitlist signup (email-only, deduplicated).
app.post('/api/waitlist', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  try {
    const r = await pool.query(
      'INSERT INTO waitlist(email) VALUES($1) ON CONFLICT(email) DO NOTHING RETURNING id',
      [email],
    );
    return res
      .status(r.rowCount ? 201 : 200)
      .json({ status: r.rowCount ? 'created' : 'already_registered' });
  } catch (err) {
    console.error('POST /api/waitlist failed:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// UC-2: public signup count (social proof).
app.get('/api/waitlist/count', async (_req, res) => {
  try {
    const r = await pool.query('SELECT count(*) FROM waitlist');
    return res.json({ count: Number(r.rows[0].count) });
  } catch (err) {
    console.error('GET /api/waitlist/count failed:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

const PORT = process.env.PORT || 8080;

init()
  .then(() => {
    app.listen(PORT, () => console.log(`waitlist listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('fatal: db init failed:', err.message);
    process.exit(1);
  });

export { app };
