import type { WsEvent, WsEventName, WsEventPayload } from '@zap/shared';
import { getDeviceInfo } from './deviceId';
import { api } from './apiClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler<N extends WsEventName = any> = (payload: WsEventPayload<N>) => void;
type StatusListener = (status: 'connecting' | 'connected' | 'disconnected') => void;

function deriveWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}
const WS_URL = deriveWsUrl();
const MAX_BACKOFF = 30_000;

class WsClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Handler>>();
  private statusListeners = new Set<StatusListener>();
  private backoff = 1000;
  private shouldReconnect = false;
  private _status: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  get status() {
    return this._status;
  }

  private setStatus(s: typeof this._status) {
    this._status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private connecting = false;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.connecting) return;
    this.connecting = true;
    this.shouldReconnect = true;
    this.setStatus('connecting');

    try {
      if (this.ws) {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        try { this.ws.close(); } catch {}
        this.ws = null;
      }

      console.log('[ZAP] getting WS ticket...');
      const ticket = await api.getWsTicket();
      console.log('[ZAP] connecting WS to', WS_URL);
      const ws = new WebSocket(`${WS_URL}/ws?ticket=${ticket}`);
      this.ws = ws;

      ws.onopen = () => {
        this.backoff = 1000;
        this.connecting = false;
        this.setStatus('connected');
        const device = getDeviceInfo();
        console.log('[ZAP] WS connected, joining as', device.name, device.id);
        this.send({
          event: 'device:join',
          payload: { networkPrefix: '', device },
        } as WsEvent);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as WsEvent;
          console.log('[ZAP] WS ←', msg.event, msg.payload);
          const handlers = this.listeners.get(msg.event);
          if (handlers) {
            for (const fn of handlers) {
              (fn as Handler<typeof msg.event>)(msg.payload);
            }
          }
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        this.connecting = false;
        this.setStatus('disconnected');
        console.log('[ZAP] WS closed, reconnect:', this.shouldReconnect);
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.backoff);
          this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
        }
      };

      ws.onerror = (err) => {
        console.error('[ZAP] WS error', err);
        ws.close();
      };
    } catch (err) {
      this.connecting = false;
      console.error('[ZAP] WS connect failed', err);
      this.setStatus('disconnected');
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.backoff);
        this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.backoff = 1000;
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.setStatus('disconnected');
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
