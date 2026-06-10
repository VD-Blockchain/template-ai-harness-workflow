import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

// These tests exercise the HTTP layer WITHOUT a database — every case asserted
// here returns before any DB query runs (validation 400s, malformed JSON,
// security headers), so no Postgres connection is required.

let server;
let base;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
});

function postJson(obj) {
  return fetch(`${base}/api/waitlist`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(obj),
  });
}

function postRaw(raw) {
  return fetch(`${base}/api/waitlist`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw,
  });
}

// Bug #1 — type-confusion crash: object email must 400, process must survive.
test('object email {toString:string} → 400 invalid_email (no crash)', async () => {
  const r = await postJson({ email: { toString: 'a@b.com' } });
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: 'invalid_email' });
});

// Bug #2 — validation bypass: array email must NOT be accepted.
test('array email → 400 invalid_email (no row created)', async () => {
  const r = await postJson({ email: ['a@b.com'] });
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: 'invalid_email' });
});

test('number / null / missing email → 400 invalid_email', async () => {
  for (const email of [12345, null, undefined]) {
    const r = await postJson({ email });
    assert.equal(r.status, 400, `email=${String(email)}`);
  }
  const empty = await postJson({});
  assert.equal(empty.status, 400);
});

// Bug #3 — info disclosure: malformed JSON must 400 generic, no stack/paths.
test('malformed JSON → 400 generic, no stack trace or file paths leaked', async () => {
  const r = await postRaw('{"email": ');
  assert.equal(r.status, 400);
  const text = await r.text();
  assert.match(text, /"error"/);
  assert.doesNotMatch(text, /SyntaxError|at .+\.js:\d+|\/app\/|node_modules/);
  assert.deepEqual(JSON.parse(text), { error: 'bad_request' });
});

// Bug #4 — security headers present, framework version hidden.
test('responses carry security headers and no X-Powered-By', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.ok(r.headers.get('content-security-policy'));
  assert.equal(r.headers.get('x-powered-by'), null);
});

// Bug #1 — resilience: a barrage of hostile payloads cannot take the process
// down; /health still answers afterwards.
test('survives a barrage of malicious payloads', async () => {
  const payloads = [
    { email: { toString: 'x' } },
    { email: { valueOf: 'y' } },
    { email: [] },
    { email: {} },
    { email: 0 },
    { email: false },
    { email: null },
    {},
  ];
  for (let i = 0; i < 64; i++) {
    const r = await postJson(payloads[i % payloads.length]);
    assert.equal(r.status, 400);
  }
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
});
