const PATTERN = /^zap_[a-zA-Z0-9_-]{6,}$/;

export type SessionId = string & { readonly __brand: 'SessionId' };

export const SessionId = {
  prefix: 'zap_',
  pattern: PATTERN,
  is(value: unknown): value is SessionId {
    return typeof value === 'string' && PATTERN.test(value);
  },
  parse(raw: string): SessionId {
    if (!PATTERN.test(raw)) throw new Error(`[SessionId] invalid format: ${raw}`);
    return raw as SessionId;
  },
};
