export type TTL = '10m' | '1h' | '6h';

export type SessionStatus = 'uploading' | 'ready' | 'expired';

export interface FileMeta {
  name: string;
  size: number;
  mimeType: string;
}

export interface Session {
  sessionId: string;
  status: SessionStatus;
  fileCount: number;
  uploadedCount: number;
  expiresAt: string;
}

export interface CreateSessionBody {
  fileCount: number;
  ttl: TTL;
  files: FileMeta[];
}

export interface CreateSessionResponse {
  sessionId: string;
  presignedUrls: string[];
  expiresAt: string;
}

export type DeviceType = 'mac' | 'ios' | 'android' | 'windows' | 'linux' | 'unknown';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
}

export type WsEvent =
  | { event: 'device:join'; payload: { networkPrefix: string } }
  | { event: 'device:list'; payload: { devices: Device[] } }
  | {
      event: 'transfer:ready';
      payload: {
        sessionId: string;
        sender: Device;
        fileCount: number;
        totalSize: number;
        expiresAt: string;
      };
    }
  | { event: 'transfer:accept'; payload: { sessionId: string } }
  | { event: 'transfer:decline'; payload: { sessionId: string } }
  | {
      event: 'transfer:progress';
      payload: { sessionId: string; uploadedCount: number; percent: number };
    }
  | {
      event: 'transfer:complete';
      payload: { sessionId: string; presignedUrls: string[] };
    };
