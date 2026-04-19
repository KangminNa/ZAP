import { FileSize } from '@zap/shared';
import { ProgressBar } from '../../../shared/ui/ProgressBar';
import { useSendStore } from '../model/sendStore';

export function TransferProgress() {
  const { files, uploadedCount, startedAt, phase } = useSendStore();
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const percent = files.length === 0 ? 0 : Math.round((uploadedCount / files.length) * 100);

  const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0;
  const uploadedSize = files.slice(0, uploadedCount).reduce((s, f) => s + f.size, 0);
  const speed = elapsed > 0 ? uploadedSize / elapsed : 0;
  const remaining = speed > 0 ? Math.ceil((totalSize - uploadedSize) / speed) : 0;

  return (
    <div className="bg-white rounded-2xl p-6 space-y-4">
      <div className="text-center">
        <p className="text-sm text-stone-500">전송 중</p>
        <p className="text-5xl font-bold text-stone-800 mt-1">{percent}%</p>
        <p className="text-sm text-stone-400 mt-1">
          {uploadedCount} / {files.length}개 완료
        </p>
      </div>

      <ProgressBar percent={percent} />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-stone-50 rounded-lg p-2">
          <p className="text-sm font-medium text-stone-700">
            {FileSize.format(speed)}/s
          </p>
          <p className="text-xs text-stone-400">전송 속도</p>
        </div>
        <div className="bg-stone-50 rounded-lg p-2">
          <p className="text-sm font-medium text-stone-700">
            {FileSize.format(uploadedSize)} / {FileSize.format(totalSize)}
          </p>
          <p className="text-xs text-stone-400">전송량</p>
        </div>
        <div className="bg-stone-50 rounded-lg p-2">
          <p className="text-sm font-medium text-stone-700">
            {phase === 'done' ? '완료' : `약 ${remaining}초`}
          </p>
          <p className="text-xs text-stone-400">남은 시간</p>
        </div>
      </div>
    </div>
  );
}
