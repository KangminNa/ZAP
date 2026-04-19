import { create } from 'zustand';
import { FileSize, type TTLLabel } from '@zap/shared';

type SendPhase = 'idle' | 'selecting' | 'uploading' | 'done';

interface SendState {
  phase: SendPhase;
  files: File[];
  ttl: TTLLabel;
  sessionId: string | null;
  presignedUrls: string[];
  uploadedCount: number;
  startedAt: number | null;

  setFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  setTtl: (ttl: TTLLabel) => void;
  startUpload: (sessionId: string, urls: string[]) => void;
  updateProgress: (count: number) => void;
  complete: () => void;
  reset: () => void;

  totalSize: () => number;
  totalSizeFormatted: () => string;
  percent: () => number;
}

export const useSendStore = create<SendState>((set, get) => ({
  phase: 'idle',
  files: [],
  ttl: '1h',
  sessionId: null,
  presignedUrls: [],
  uploadedCount: 0,
  startedAt: null,

  setFiles: (files) => set({ files, phase: files.length > 0 ? 'selecting' : 'idle' }),
  addFiles: (newFiles) => {
    const files = [...get().files, ...newFiles];
    set({ files, phase: 'selecting' });
  },
  removeFile: (index) => {
    const files = get().files.filter((_, i) => i !== index);
    set({ files, phase: files.length > 0 ? 'selecting' : 'idle' });
  },
  setTtl: (ttl) => set({ ttl }),
  startUpload: (sessionId, urls) =>
    set({ phase: 'uploading', sessionId, presignedUrls: urls, uploadedCount: 0, startedAt: Date.now() }),
  updateProgress: (count) => set({ uploadedCount: count }),
  complete: () => set({ phase: 'done' }),
  reset: () =>
    set({
      phase: 'idle',
      files: [],
      ttl: '1h',
      sessionId: null,
      presignedUrls: [],
      uploadedCount: 0,
      startedAt: null,
    }),

  totalSize: () => get().files.reduce((sum, f) => sum + f.size, 0),
  totalSizeFormatted: () => FileSize.format(get().totalSize()),
  percent: () => {
    const { files, uploadedCount } = get();
    return files.length === 0 ? 0 : Math.round((uploadedCount / files.length) * 100);
  },
}));
