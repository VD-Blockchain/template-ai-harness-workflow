// Pure email validation — exported for unit tests and reused by the server.
// Requires local@domain.tld: a TLD (dot + 2+ chars) is mandatory, so `a@b` is rejected.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Returns true when `s` is a syntactically valid email address.
 * Trims surrounding whitespace and is case-insensitive (normalize separately when storing).
 * @param {unknown} s
 * @returns {boolean}
 */
export function isValidEmail(s) {
  if (typeof s !== 'string') return false;
  const email = s.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return false;
  return EMAIL_RE.test(email);
}
