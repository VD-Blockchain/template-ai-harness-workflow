import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail } from '../src/validate.js';

test('accepts well-formed emails', () => {
  for (const e of ['a@b.com', 'user.name@example.co', 'x+tag@sub.domain.io']) {
    assert.equal(isValidEmail(e), true, `expected valid: ${e}`);
  }
});

test('rejects malformed emails', () => {
  for (const e of ['abc', 'a@b', 'a@b.', '@b.com', 'a@@b.com', 'a b@c.com']) {
    assert.equal(isValidEmail(e), false, `expected invalid: ${e}`);
  }
});

test('rejects empty / whitespace / non-string', () => {
  for (const e of ['', '   ', null, undefined, 42, {}]) {
    assert.equal(isValidEmail(e), false, `expected invalid: ${String(e)}`);
  }
});

test('normalizes mixed case and surrounding whitespace', () => {
  assert.equal(isValidEmail('  USER@Example.COM  '), true);
});
