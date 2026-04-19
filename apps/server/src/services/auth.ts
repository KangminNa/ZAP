import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function hmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

// ── Device Token ──────────────────────────────────────────────
// 형식: deviceId.issuedAt.signature

export function issueDeviceToken(secret: string): {
  deviceId: string;
  token: string;
} {
  const deviceId = `dev_${randomBytes(12).toString('base64url')}`;
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${deviceId}.${issuedAt}`;
  const sig = hmac(payload, secret);
  return { deviceId, token: `${payload}.${sig}` };
}

export function verifyDeviceToken(
  token: string,
  secret: string,
  ttlHours: number,
): { valid: true; deviceId: string; issuedAt: number } | { valid: false } {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };

  const [deviceId, issuedAtStr, sig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!deviceId || !issuedAt || isNaN(issuedAt)) return { valid: false };

  const expected = hmac(`${deviceId}.${issuedAtStr}`, secret);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { valid: false };
  }

  const age = Date.now() / 1000 - issuedAt;
  if (age > ttlHours * 3600) return { valid: false };

  return { valid: true, deviceId, issuedAt };
}

export function refreshDeviceToken(
  deviceId: string,
  secret: string,
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${deviceId}.${issuedAt}`;
  const sig = hmac(payload, secret);
  return `${payload}.${sig}`;
}

// ── WS Ticket ─────────────────────────────────────────────────
// Valkey에 저장되는 일회용 티켓. 30초 TTL.

export const WS_TICKET_TTL = 30;

export function generateWsTicket(): string {
  return `wst_${randomBytes(16).toString('base64url')}`;
}

// ── Transfer Token ────────────────────────────────────────────
// Stateless: HMAC(sessionId + targetDeviceId, secret)

export function issueTransferToken(
  sessionId: string,
  targetDeviceId: string,
  secret: string,
): string {
  return hmac(`${sessionId}:${targetDeviceId}`, secret);
}

export function verifyTransferToken(
  token: string,
  sessionId: string,
  callerDeviceId: string,
  secret: string,
): boolean {
  const expected = hmac(`${sessionId}:${callerDeviceId}`, secret);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
