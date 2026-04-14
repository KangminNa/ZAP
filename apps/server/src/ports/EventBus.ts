import type { NetworkPrefix, WsEvent } from '@zap/shared';

export interface EventBus {
  publishToDevice(deviceId: string, event: WsEvent): Promise<void>;
  publishToNetwork(prefix: NetworkPrefix, event: WsEvent): Promise<void>;
}
