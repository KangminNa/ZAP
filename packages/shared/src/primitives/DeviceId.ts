const PATTERN = /^dev_[a-zA-Z0-9_-]{6,}$/;

export type DeviceId = string & { readonly __brand: 'DeviceId' };

export const DeviceId = {
  prefix: 'dev_',
  pattern: PATTERN,
  is(value: unknown): value is DeviceId {
    return typeof value === 'string' && PATTERN.test(value);
  },
  parse(raw: string): DeviceId {
    if (!PATTERN.test(raw)) throw new Error(`[DeviceId] invalid format: ${raw}`);
    return raw as DeviceId;
  },
};
