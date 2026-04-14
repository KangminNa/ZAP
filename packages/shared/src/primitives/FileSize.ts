const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export const FileSize = {
  format(bytes: number, fractionDigits = 1): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < UNITS.length - 1) {
      size /= 1024;
      unit++;
    }
    const n = unit === 0 ? size.toFixed(0) : size.toFixed(fractionDigits);
    return `${n} ${UNITS[unit]}`;
  },

  sum(sizes: readonly number[]): number {
    let total = 0;
    for (const s of sizes) total += s;
    return total;
  },
};
