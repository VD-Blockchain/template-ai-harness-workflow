import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS waitlist (
    id         SERIAL PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Connect to Postgres (which may still be starting) with retries, then ensure
 * the waitlist table exists. Idempotent — safe to call on every boot.
 */
export async function init({ retries = 10, delayMs = 2000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      await pool.query(CREATE_TABLE);
      console.log('db: connected and table ready');
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`db: connect attempt ${attempt}/${retries} failed: ${err.message}`);
      await sleep(delayMs);
    }
  }
  throw new Error(`db: could not initialize after ${retries} attempts: ${lastErr?.message}`);
}
