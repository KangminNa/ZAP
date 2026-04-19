import type { DeviceDto, DeviceTypeDto } from '@zap/shared';

const TOKEN_KEY = 'zap_device_token';
const DEVICE_ID_KEY = 'zap_device_id';
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function detectType(): DeviceTypeDto {
  const ua = navigator.userAgent;
  if (/Macintosh/.test(ua)) return 'mac';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'unknown';
}

function detectName(): string {
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

export async function ensureDeviceToken(): Promise<void> {
  if (localStorage.getItem(TOKEN_KEY)) return;

  const res = await fetch(`${BASE_URL}/api/auth/device`, { method: 'POST' });
  if (!res.ok) throw new Error('failed to register device');
  const { deviceId, token } = await res.json();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
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

export function getDeviceInfo(): DeviceDto {
  return {
    id: getDeviceId(),
    name: detectName(),
    type: detectType(),
  };
}
