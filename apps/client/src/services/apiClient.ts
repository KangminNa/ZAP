import type {
  CreateSessionResponse,
  GetSessionResponse,
  TTLLabel,
  DomainErrorCode,
} from '@zap/shared';
import { getDeviceId } from './deviceId';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
      ...init?.headers,
    },
  });

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
  ): Promise<CreateSessionResponse> {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        fileCount: files.length,
        ttl,
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
};
