import type { DeviceDto } from '../dto/device';

export type WsEvent =
  | {
      event: 'device:join';
      payload: {
        networkPrefix: string;
        device: DeviceDto;
      };
    }
  | {
      event: 'device:list';
      payload: { devices: DeviceDto[] };
    }
  | {
      event: 'transfer:ready';
      payload: {
        sessionId: string;
        sender: DeviceDto;
        fileCount: number;
        totalSize: number;
        expiresAt: string;
      };
    }
  | {
      event: 'transfer:accept';
      payload: { sessionId: string };
    }
  | {
      event: 'transfer:decline';
      payload: { sessionId: string };
    }
  | {
      event: 'transfer:progress';
      payload: { sessionId: string; uploadedCount: number; percent: number };
    }
  | {
      event: 'transfer:complete';
      payload: { sessionId: string; presignedUrls: string[] };
    };

export type WsEventName = WsEvent['event'];

export type WsEventPayload<N extends WsEventName> = Extract<
  WsEvent,
  { event: N }
>['payload'];
