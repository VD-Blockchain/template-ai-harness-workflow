import { describe, it, expect, vi, afterEach } from 'vitest';
import { isEmail, statusToState, submitWaitlist, getCount } from './api.js';

describe('isEmail (client validation)', () => {
  it('accepts well-formed emails', () => {
    for (const e of ['a@b.com', 'user.name@example.co', '  USER@Example.COM  ']) {
      expect(isEmail(e)).toBe(true);
    }
  });
  it('rejects malformed / empty', () => {
    for (const e of ['abc', 'a@b', '', '   ', null, undefined]) {
      expect(isEmail(e)).toBe(false);
    }
  });
});

describe('statusToState (status → UI state)', () => {
  it('maps created → created', () => {
    expect(statusToState({ status: 'created' })).toBe('created');
  });
  it('maps already_registered → exists', () => {
    expect(statusToState({ status: 'already_registered' })).toBe('exists');
  });
  it('defaults unknown → exists', () => {
    expect(statusToState({})).toBe('exists');
  });
});

describe('api calls (mocked fetch)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('submitWaitlist returns parsed json on 2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ status: 'created' }),
    }));
    expect(await submitWaitlist('a@b.com')).toEqual({ status: 'created' });
  });

  it('submitWaitlist throws on non-2xx (e.g. 400)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'invalid_email' }),
    }));
    await expect(submitWaitlist('abc')).rejects.toThrow();
  });

  it('getCount returns a number', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 7 }),
    }));
    expect(await getCount()).toBe(7);
  });
});
