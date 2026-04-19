import type { WebSocket } from 'ws';
import type { DeviceDto } from '@zap/shared';

interface ConnectedDevice {
  ws: WebSocket;
  device: DeviceDto;
  networkPrefix: string;
}

export class Rooms {
  private readonly byNetwork = new Map<string, Map<string, ConnectedDevice>>();
  private readonly deviceNetwork = new Map<string, string>();

  join(networkPrefix: string, device: DeviceDto, ws: WebSocket): void {
    let room = this.byNetwork.get(networkPrefix);
    if (!room) {
      room = new Map();
      this.byNetwork.set(networkPrefix, room);
    }
    room.set(device.id, { ws, device, networkPrefix });
    this.deviceNetwork.set(device.id, networkPrefix);
  }

  leave(deviceId: string): void {
    const prefix = this.deviceNetwork.get(deviceId);
    if (!prefix) return;
    const room = this.byNetwork.get(prefix);
    if (room) {
      room.delete(deviceId);
      if (room.size === 0) this.byNetwork.delete(prefix);
    }
    this.deviceNetwork.delete(deviceId);
  }

  getDevices(networkPrefix: string): DeviceDto[] {
    const room = this.byNetwork.get(networkPrefix);
    if (!room) return [];
    return Array.from(room.values()).map((c) => c.device);
  }

  broadcast(networkPrefix: string, data: unknown, excludeId?: string): void {
    const room = this.byNetwork.get(networkPrefix);
    if (!room) return;
    const json = JSON.stringify(data);
    for (const [id, conn] of room) {
      if (id !== excludeId && conn.ws.readyState === 1) {
        conn.ws.send(json);
      }
    }
  }

  sendTo(deviceId: string, data: unknown): boolean {
    const prefix = this.deviceNetwork.get(deviceId);
    if (!prefix) return false;
    const conn = this.byNetwork.get(prefix)?.get(deviceId);
    if (!conn || conn.ws.readyState !== 1) return false;
    conn.ws.send(JSON.stringify(data));
    return true;
  }
}
