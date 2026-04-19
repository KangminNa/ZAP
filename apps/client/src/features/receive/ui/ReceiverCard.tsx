import { FileSize } from '@zap/shared';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import type { IncomingTransfer } from '../model/receiveStore';
import { useReceiveStore } from '../model/receiveStore';

function ExpiryTimer({ expiresAt }: { expiresAt: string }) {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const remaining = Math.max(0, Math.floor((exp - now) / 60_000));
  if (remaining <= 0) return <Badge variant="danger">만료됨</Badge>;
  return <Badge variant="warning">{remaining}분 남음</Badge>;
}

function TransferCard({ transfer }: { transfer: IncomingTransfer }) {
  const { acceptTransfer, declineTransfer } = useReceiveStore();
  const { sender, fileCount, totalSize, expiresAt, status, sessionId } = transfer;

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={sender.name} />
        <div className="flex-1">
          <p className="font-medium text-stone-800">{sender.name}에게서</p>
          <p className="text-xs text-stone-400">파일 {fileCount}개 · {FileSize.format(totalSize)}</p>
        </div>
        <ExpiryTimer expiresAt={expiresAt} />
      </div>

      {status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => acceptTransfer(sessionId, [])}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            저장하기
          </button>
          <button
            onClick={() => declineTransfer(sessionId)}
            className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200 transition-colors"
          >
            거절
          </button>
        </div>
      )}

      {status === 'downloading' && (
        <p className="text-center text-sm text-blue-500 font-medium">다운로드 중...</p>
      )}
      {status === 'done' && (
        <p className="text-center text-sm text-emerald-500 font-medium">저장 완료</p>
      )}
      {status === 'declined' && (
        <p className="text-center text-sm text-stone-400">거절됨</p>
      )}
    </div>
  );
}

export function ReceiverPanel() {
  const transfers = useReceiveStore((s) => s.transfers);

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-400 text-sm">수신 대기 중...</p>
        <p className="text-stone-300 text-xs mt-1">
          다른 기기에서 파일을 보내면 여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-500 px-1">수신 내역</h3>
      {transfers.map((t) => (
        <TransferCard key={t.sessionId} transfer={t} />
      ))}
    </div>
  );
}
