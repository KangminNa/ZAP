import type { NetworkPrefix, WsEvent } from '@zap/shared';
import type { EventBus } from '../ports/EventBus';
import type { Rooms } from '../ws/rooms';

export class WsEventBus implements EventBus {
  constructor(private readonly rooms: Rooms) {}

  async publishToDevice(deviceId: string, event: WsEvent): Promise<void> {
    this.rooms.sendTo(deviceId, event);
  }

  async publishToNetwork(
    prefix: NetworkPrefix,
    event: WsEvent,
  ): Promise<void> {
    this.rooms.broadcast(prefix.value, event);
  }
}
