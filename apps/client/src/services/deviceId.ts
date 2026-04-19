import type { DeviceDto, DeviceTypeDto } from '@zap/shared';

const STORAGE_KEY = 'zap_device_id';

function generateId(): string {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(rand, (b) => b.toString(36)).join('');
  return `dev_${hex}`;
}

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

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getDeviceInfo(): DeviceDto {
  return {
    id: getDeviceId(),
    name: detectName(),
    type: detectType(),
  };
}
