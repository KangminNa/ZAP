import type {
  CreateSessionResponse,
  GetSessionResponse,
  TTLLabel,
  DomainErrorCode,
} from '@zap/shared';
import { getDeviceToken, setDeviceToken, ensureDeviceToken } from './deviceId';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: DomainErrorCode | string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  _retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getDeviceToken()}`,
  };
  if (init?.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  const refreshed = res.headers.get('X-Device-Token-Refresh');
  if (refreshed) setDeviceToken(refreshed);

  if (res.status === 401 && !_retried) {
    await ensureDeviceToken();
    return request(path, init, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.code ?? 'UNKNOWN',
      body.message ?? body.error ?? res.statusText,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  createSession(
    files: File[],
    ttl: TTLLabel,
    targetDeviceId: string,
  ): Promise<CreateSessionResponse> {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        fileCount: files.length,
        ttl,
        targetDeviceId,
        files: files.map((f) => ({
          name: f.name,
          size: f.size,
          mimeType: f.type || 'application/octet-stream',
        })),
      }),
    });
  },

  getSession(sessionId: string): Promise<GetSessionResponse> {
    return request(`/api/sessions/${sessionId}`);
  },

  reportProgress(
    sessionId: string,
    uploadedCount: number,
  ): Promise<{ sessionId: string; status: string; uploadedCount: number; fileCount: number }> {
    return request(`/api/sessions/${sessionId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ uploadedCount }),
    });
  },

  cancelSession(sessionId: string): Promise<void> {
    return request(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  },

  async getWsTicket(): Promise<string> {
    const res = await request<{ ticket: string }>('/api/auth/ws-ticket', {
      method: 'POST',
    });
    return res.ticket;
  },
};
