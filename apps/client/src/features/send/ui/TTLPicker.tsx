import { TTL_LABELS, type TTLLabel } from '@zap/shared';
import { useSendStore } from '../model/sendStore';

const LABELS: Record<TTLLabel, string> = {
  '10m': '10분',
  '1h': '1시간',
  '6h': '6시간',
};

export function TTLPicker() {
  const { ttl, setTtl } = useSendStore();

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-stone-500">만료 시간</p>
      <div className="flex gap-2">
        {TTL_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => setTtl(label)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              ttl === label
                ? 'bg-blue-500 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {LABELS[label]}
          </button>
        ))}
      </div>
    </div>
  );
}
