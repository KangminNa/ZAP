import { useCallback, useRef, useState } from 'react';
import { FileSize } from '@zap/shared';
import { useSendStore } from '../model/sendStore';

export function DropZone() {
  const { files, addFiles, removeFile } = useSendStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) addFiles(dropped);
    },
    [addFiles],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      if (selected.length > 0) addFiles(selected);
      e.target.value = '';
    },
    [addFiles],
  );

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
      >
        <div className="text-3xl mb-2">&#8593;</div>
        <p className="text-stone-600 font-medium">파일을 드래그하거나 탭하여 선택</p>
        <p className="text-stone-400 text-sm mt-1">사진, 영상, 문서 등 최대 10GB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleSelect}
        />
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl p-3 space-y-1">
          <p className="text-xs text-stone-400 px-1">
            {files.length}개 파일 · {FileSize.format(totalSize)}
          </p>
          {files.slice(0, 5).map((f, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-stone-50">
              <span className="text-sm text-stone-700 truncate flex-1">{f.name}</span>
              <span className="text-xs text-stone-400 mx-2">{FileSize.format(f.size)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="text-stone-400 hover:text-rose-500 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          {files.length > 5 && (
            <p className="text-xs text-stone-400 px-2">외 {files.length - 5}개</p>
          )}
        </div>
      )}
    </div>
  );
}
