// Same-origin API client — nginx reverse-proxies /api/* to the waitlist service.
// Relative URLs only (no CORS).

/**
 * Submit an email to the waitlist.
 * @param {string} email
 * @returns {Promise<{status: 'created'|'already_registered'}>}
 * @throws on non-2xx (e.g. 400 invalid_email, 500) or network error.
 */
export async function submitWaitlist(email) {
  const res = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = new Error(`waitlist submit failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Read the public signup count.
 * @returns {Promise<number>}
 */
export async function getCount() {
  const res = await fetch('/api/waitlist/count');
  if (!res.ok) throw new Error(`count failed: ${res.status}`);
  const data = await res.json();
  return Number(data.count) || 0;
}

/**
 * Client-side email check mirroring the server regex (local@domain.tld).
 * @param {string} s
 * @returns {boolean}
 */
export function isEmail(s) {
  if (typeof s !== 'string') return false;
  const email = s.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Map the API response status to a UI state.
 * @param {{status?: string}} resp
 * @returns {'created'|'exists'}
 */
export function statusToState(resp) {
  return resp?.status === 'created' ? 'created' : 'exists';
}
