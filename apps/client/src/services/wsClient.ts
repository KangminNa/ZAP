import type { WsEvent, WsEventName, WsEventPayload } from '@zap/shared';
import { getDeviceInfo } from './deviceId';
import { api } from './apiClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler<N extends WsEventName = any> = (payload: WsEventPayload<N>) => void;

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';
const MAX_BACKOFF = 30_000;

class WsClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Handler>>();
  private backoff = 1000;
  private shouldReconnect = false;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldReconnect = true;

    const ticket = await api.getWsTicket();
    const ws = new WebSocket(`${WS_URL}/ws?ticket=${ticket}`);
    this.ws = ws;

    ws.onopen = () => {
      this.backoff = 1000;
      const device = getDeviceInfo();
      this.send({
        event: 'device:join',
        payload: { networkPrefix: '', device },
      } as WsEvent);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsEvent;
        const handlers = this.listeners.get(msg.event);
        if (handlers) {
          for (const fn of handlers) {
            (fn as Handler<typeof msg.event>)(msg.payload);
          }
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.backoff);
        this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
      }
    };

    ws.onerror = () => ws.close();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  send(event: WsEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  on<N extends WsEventName>(event: N, handler: Handler<N>): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Handler);
  }

  off<N extends WsEventName>(event: N, handler: Handler<N>): void {
    this.listeners.get(event)?.delete(handler as Handler);
  }
}

export const wsClient = new WsClient();
