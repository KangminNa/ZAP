import { useEffect, useState, useCallback } from 'react';
import { DeviceList } from './features/discovery/ui/DeviceList';
import { DropZone } from './features/send/ui/DropZone';
import { TTLPicker } from './features/send/ui/TTLPicker';
import { TransferProgress } from './features/send/ui/TransferProgress';
import { ReceiverPanel } from './features/receive/ui/ReceiverCard';
import { useSendStore } from './features/send/model/sendStore';
import { useDiscoveryStore } from './features/discovery/model/discoveryStore';
import { useReceiveStore } from './features/receive/model/receiveStore';
import {
  wsClient,
  api,
  uploadFiles,
  createUploadController,
  ensureDeviceToken,
  getDeviceName,
  setDeviceName,
  hasCustomName,
} from './services';

type Tab = 'send' | 'receive';

function NameSetup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(getDeviceName());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeviceName(name);
    onDone();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">ZAP</h1>
          <p className="mt-2 text-stone-500 text-sm">상대방에게 보일 기기 이름을 설정하세요</p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 강민의 MacBook"
          maxLength={32}
          className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="submit"
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          시작하기
        </button>
      </form>
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-stone-300',
};
const STATUS_TEXT: Record<string, string> = {
  connected: '연결됨',
  connecting: '연결 중...',
  disconnected: '연결 안 됨',
};

function SendView() {
  const store = useSendStore();
  const selectedDeviceId = useDiscoveryStore((s) => s.selectedDeviceId);
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (store.files.length === 0 || !selectedDeviceId || sending) return;
    setSending(true);

    try {
      const res = await api.createSession(store.files, store.ttl, selectedDeviceId);
      store.startUpload(res.sessionId, res.presignedUrls);

      const controller = createUploadController();
      await uploadFiles({
        files: store.files,
        presignedUrls: res.presignedUrls,
        signal: controller.signal,
        onProgress: async (uploaded) => {
          store.updateProgress(uploaded);
          await api.reportProgress(res.sessionId, uploaded).catch(() => {});
        },
      });

      store.complete();
    } catch (err) {
      console.error('send failed', err);
    } finally {
      setSending(false);
    }
  }, [store, selectedDeviceId, sending]);

  if (store.phase === 'uploading' || store.phase === 'done') {
    return (
      <div className="space-y-4">
        <TransferProgress />
        {store.phase === 'done' && (
          <button
            onClick={store.reset}
            className="w-full py-3 rounded-xl bg-stone-200 text-stone-700 font-medium hover:bg-stone-300 transition-colors"
          >
            새 전송
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DropZone />
      <DeviceList />
      <TTLPicker />

      <button
        disabled={store.files.length === 0 || !selectedDeviceId || sending}
        onClick={handleSend}
        className="w-full py-4 rounded-xl font-medium text-white transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 disabled:cursor-not-allowed"
      >
        {sending ? '준비 중...' : '전송하기'}
      </button>

      <p className="text-center text-xs text-stone-400">
        같은 Wi-Fi에 연결된 기기를 자동으로 발견합니다
      </p>
    </div>
  );
}

function MainApp() {
  const [tab, setTab] = useState<Tab>('send');
  const setDevices = useDiscoveryStore((s) => s.setDevices);
  const addTransfer = useReceiveStore((s) => s.addTransfer);
  const [connStatus, setConnStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const unsub = wsClient.onStatus(setConnStatus);
    wsClient.on('device:list', (payload) => setDevices(payload.devices));
    wsClient.on('transfer:ready', (payload) => addTransfer(payload));
    ensureDeviceToken()
      .then(() => wsClient.connect())
      .catch((err) => console.error('[ZAP] connection failed:', err));
    return () => {
      unsub();
      wsClient.disconnect();
    };
  }, [setDevices, addTransfer]);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-600">ZAP</h1>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[connStatus]}`} />
              <span className="text-xs text-stone-400">{STATUS_TEXT[connStatus]}</span>
            </div>
          </div>
          <nav className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab('send')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'send'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              전송
            </button>
            <button
              onClick={() => setTab('receive')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'receive'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              수신
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {tab === 'send' ? <SendView /> : <ReceiverPanel />}

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              localStorage.clear();
              wsClient.disconnect();
              window.location.reload();
            }}
            className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
          >
            세션 초기화
          </button>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [nameSet, setNameSet] = useState(hasCustomName());

  if (!nameSet) {
    return <NameSetup onDone={() => setNameSet(true)} />;
  }

  return <MainApp />;
}
