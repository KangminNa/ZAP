import { useState } from 'react';
import { DeviceList } from './features/discovery/ui/DeviceList';
import { DropZone } from './features/send/ui/DropZone';
import { TTLPicker } from './features/send/ui/TTLPicker';
import { TransferProgress } from './features/send/ui/TransferProgress';
import { ReceiverPanel } from './features/receive/ui/ReceiverCard';
import { useSendStore } from './features/send/model/sendStore';
import { useDiscoveryStore } from './features/discovery/model/discoveryStore';

type Tab = 'send' | 'receive';

function SendView() {
  const { phase, files } = useSendStore();
  const selectedDeviceId = useDiscoveryStore((s) => s.selectedDeviceId);

  if (phase === 'uploading' || phase === 'done') {
    return <TransferProgress />;
  }

  return (
    <div className="space-y-5">
      <DropZone />
      <DeviceList />
      <TTLPicker />

      <button
        disabled={files.length === 0 || !selectedDeviceId}
        className="w-full py-4 rounded-xl font-medium text-white transition-colors bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 disabled:cursor-not-allowed"
      >
        전송하기
      </button>

      <p className="text-center text-xs text-stone-400">
        같은 Wi-Fi에 연결된 기기를 자동으로 발견합니다
      </p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('send');

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">ZAP</h1>
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
      </main>
    </div>
  );
}
