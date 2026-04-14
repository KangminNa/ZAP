export const TTL_LABELS = ['10m', '1h', '6h'] as const;
export type TTLLabel = (typeof TTL_LABELS)[number];

const SECONDS_BY_LABEL: Record<TTLLabel, number> = {
  '10m': 600,
  '1h': 3600,
  '6h': 21_600,
};

export class TTL {
  private constructor(
    public readonly label: TTLLabel,
    public readonly seconds: number,
  ) {
    Object.freeze(this);
  }

  static parse(raw: string): TTL {
    if (!(TTL_LABELS as readonly string[]).includes(raw)) {
      throw new Error(`[TTL] invalid label: ${raw}`);
    }
    const label = raw as TTLLabel;
    return new TTL(label, SECONDS_BY_LABEL[label]);
  }

  static fromLabel(label: TTLLabel): TTL {
    return new TTL(label, SECONDS_BY_LABEL[label]);
  }

  expiresAt(createdAt: Date): Date {
    return new Date(createdAt.getTime() + this.seconds * 1000);
  }

  remainingSeconds(createdAt: Date, now: Date): number {
    const ms = this.expiresAt(createdAt).getTime() - now.getTime();
    return Math.max(0, Math.floor(ms / 1000));
  }

  isExpired(createdAt: Date, now: Date): boolean {
    return now.getTime() >= this.expiresAt(createdAt).getTime();
  }
}
