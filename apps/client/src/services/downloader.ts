export async function downloadFiles(
  presignedUrls: string[],
  fileNames: string[],
  onProgress?: (downloaded: number) => void,
): Promise<void> {
  for (let i = 0; i < presignedUrls.length; i++) {
    await downloadSingle(presignedUrls[i], fileNames[i]);
    onProgress?.(i + 1);
  }
}

function downloadSingle(url: string, fileName: string): Promise<void> {
  return new Promise((resolve) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      resolve();
    }, 100);
  });
}

export async function downloadAsBlob(
  url: string,
  fileName: string,
): Promise<void> {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  downloadSingle(blobUrl, fileName).then(() => URL.revokeObjectURL(blobUrl));
}
