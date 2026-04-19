import type { DeviceDto, DeviceTypeDto } from '@zap/shared';

const TOKEN_KEY = 'zap_device_token';
const DEVICE_ID_KEY = 'zap_device_id';
const DEVICE_NAME_KEY = 'zap_device_name';
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

function detectType(): DeviceTypeDto {
  const ua = navigator.userAgent;
  if (/Macintosh/.test(ua)) return 'mac';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'unknown';
}

function defaultName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Macintosh/.test(ua)) return 'MacBook';
  if (/Android/.test(ua)) {
    const match = ua.match(/;\s*([^;)]+)\s*Build/);
    return match?.[1]?.trim() ?? 'Android';
  }
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown Device';
}

async function registerDevice(): Promise<void> {
  console.log('[ZAP] registering new device...');
  const res = await fetch(`${BASE_URL}/api/auth/device`, { method: 'POST' });
  if (!res.ok) throw new Error(`device registration failed: ${res.status}`);
  const { deviceId, token } = await res.json();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  console.log('[ZAP] device registered:', deviceId);
}

export async function ensureDeviceToken(): Promise<void> {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (!existing) {
    await registerDevice();
    return;
  }

  try {
    const parts = existing.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1]) {
      throw new Error('malformed token');
    }
    const issuedAt = Number(parts[1]);
    const ageHours = (Date.now() / 1000 - issuedAt) / 3600;
    if (ageHours > 12) {
      throw new Error('token too old');
    }
    console.log('[ZAP] existing token valid, age:', Math.round(ageHours * 10) / 10, 'h');
  } catch (e) {
    console.log('[ZAP] token invalid:', (e as Error).message, '— re-registering');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DEVICE_ID_KEY);
    await registerDevice();
  }
}

export function getDeviceToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setDeviceToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  const parts = token.split('.');
  if (parts[0]) localStorage.setItem(DEVICE_ID_KEY, parts[0]);
}

export function getDeviceId(): string {
  return localStorage.getItem(DEVICE_ID_KEY) ?? '';
}

export function getDeviceName(): string {
  return localStorage.getItem(DEVICE_NAME_KEY) || defaultName();
}

export function setDeviceName(name: string): void {
  localStorage.setItem(DEVICE_NAME_KEY, name.trim() || defaultName());
}

export function hasCustomName(): boolean {
  return !!localStorage.getItem(DEVICE_NAME_KEY);
}

export function getDeviceInfo(): DeviceDto {
  return {
    id: getDeviceId(),
    name: getDeviceName(),
    type: detectType(),
  };
}
