import { create } from 'zustand';
import type { DeviceDto } from '@zap/shared';

export interface IncomingTransfer {
  sessionId: string;
  sender: DeviceDto;
  fileCount: number;
  totalSize: number;
  expiresAt: string;
  transferToken?: string;
  status: 'pending' | 'accepted' | 'declined' | 'downloading' | 'done';
  presignedUrls?: string[];
}

interface ReceiveState {
  transfers: IncomingTransfer[];
  addTransfer: (t: Omit<IncomingTransfer, 'status'>) => void;
  acceptTransfer: (sessionId: string, urls: string[]) => void;
  declineTransfer: (sessionId: string) => void;
  markDone: (sessionId: string) => void;
  prune: () => void;
}

export const useReceiveStore = create<ReceiveState>((set) => ({
  transfers: [],

  addTransfer: (t) =>
    set((s) => ({
      transfers: [{ ...t, status: 'pending' }, ...s.transfers],
    })),

  acceptTransfer: (sessionId, urls) =>
    set((s) => ({
      transfers: s.transfers.map((t) =>
        t.sessionId === sessionId
          ? { ...t, status: 'downloading' as const, presignedUrls: urls }
          : t,
      ),
    })),

  declineTransfer: (sessionId) =>
    set((s) => ({
      transfers: s.transfers.map((t) =>
        t.sessionId === sessionId ? { ...t, status: 'declined' as const } : t,
      ),
    })),

  markDone: (sessionId) =>
    set((s) => ({
      transfers: s.transfers.map((t) =>
        t.sessionId === sessionId ? { ...t, status: 'done' as const } : t,
      ),
    })),

  prune: () =>
    set((s) => ({
      transfers: s.transfers.filter((t) => {
        if (t.status === 'done' || t.status === 'declined') return false;
        return new Date(t.expiresAt).getTime() > Date.now();
      }),
    })),
}));
