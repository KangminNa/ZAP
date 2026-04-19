const BATCH_SIZE = 5;

export interface UploadResult {
  successCount: number;
  failedFiles: string[];
  totalBytes: number;
}

export interface UploadOptions {
  files: File[];
  presignedUrls: string[];
  onProgress: (uploaded: number) => void;
  signal?: AbortSignal;
}

export async function uploadFiles(
  opts: UploadOptions,
): Promise<UploadResult> {
  const { files, presignedUrls, onProgress, signal } = opts;
  let uploaded = 0;
  let totalBytes = 0;
  const failedFiles: string[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    if (signal?.aborted) {
      throw new DOMException('Upload cancelled', 'AbortError');
    }

    const batch = files.slice(i, i + BATCH_SIZE);
    const urls = presignedUrls.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((file, j) =>
        fetch(urls[j], {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          signal,
        }),
      ),
    );

    for (let k = 0; k < results.length; k++) {
      const r = results[k];
      if (r.status === 'fulfilled' && r.value.ok) {
        uploaded++;
        totalBytes += batch[k].size;
      } else {
        failedFiles.push(batch[k].name);
      }
    }

    onProgress(uploaded);
  }

  return { successCount: uploaded, failedFiles, totalBytes };
}

export function createUploadController(): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();
  return { signal: controller.signal, cancel: () => controller.abort() };
}
