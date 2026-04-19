import {
  NetworkPrefix,
  SessionId,
  TTL,
  type SessionStatusDto,
} from '@zap/shared';
import { FileSlot } from './FileSlot';
import {
  InvalidUploadCount,
  SessionAlreadyAccepted,
  SessionExpired,
  SessionNotReady,
} from './errors';

export type SessionStatus = SessionStatusDto;

export interface SessionSnapshot {
  id: string;
  senderDeviceId: string;
  networkPrefix: string;
  files: Array<{ index: number; name: string; size: number; mimeType: string }>;
  ttlLabel: string;
  createdAt: string;
  status: SessionStatus;
  uploadedCount: number;
  targetDeviceId: string;
  receiverDeviceId: string | null;
}

export class Session {
  private constructor(
    public readonly id: SessionId,
    public readonly senderDeviceId: string,
    public readonly networkPrefix: NetworkPrefix,
    public readonly files: readonly FileSlot[],
    public readonly ttl: TTL,
    public readonly createdAt: Date,
    public readonly targetDeviceId: string,
    private _status: SessionStatus,
    private _uploadedCount: number,
    private _receiverDeviceId: string | null,
  ) {}

  /**
   * 새 세션 생성. ID는 외부(유스케이스)에서 생성해 주입 — 도메인은 순수 유지.
   */
  static create(input: {
    id: SessionId;
    senderDeviceId: string;
    targetDeviceId: string;
    networkPrefix: NetworkPrefix;
    files: FileSlot[];
    ttl: TTL;
    now: Date;
  }): Session {
    if (input.files.length === 0) {
      throw new InvalidUploadCount('session requires at least one file');
    }
    return new Session(
      input.id,
      input.senderDeviceId,
      input.networkPrefix,
      [...input.files],
      input.ttl,
      input.now,
      input.targetDeviceId,
      'uploading',
      0,
      null,
    );
  }

  /** 영속 저장소(Valkey 등)에서 복원. */
  static rehydrate(s: SessionSnapshot): Session {
    return new Session(
      SessionId.parse(s.id),
      s.senderDeviceId,
      NetworkPrefix.fromValue(s.networkPrefix),
      s.files.map((f) => new FileSlot(f.index, f.name, f.size, f.mimeType)),
      TTL.parse(s.ttlLabel),
      new Date(s.createdAt),
      s.targetDeviceId,
      s.status,
      s.uploadedCount,
      s.receiverDeviceId,
    );
  }

  get status(): SessionStatus {
    return this._status;
  }
  get uploadedCount(): number {
    return this._uploadedCount;
  }
  get receiverDeviceId(): string | null {
    return this._receiverDeviceId;
  }
  get expiresAt(): Date {
    return this.ttl.expiresAt(this.createdAt);
  }
  get totalSize(): number {
    let sum = 0;
    for (const f of this.files) sum += f.size;
    return sum;
  }

  isExpired(now: Date): boolean {
    return this.ttl.isExpired(this.createdAt, now);
  }

  storageKeyFor(file: FileSlot): string {
    return `${this.id}/${file.localKey}`;
  }

  markUploaded(count: number, now: Date): void {
    if (this.isExpired(now)) throw new SessionExpired(this.id);
    if (count < 0 || count > this.files.length) {
      throw new InvalidUploadCount(
        `uploaded=${count}, total=${this.files.length}`,
      );
    }
    this._uploadedCount = count;
    if (count === this.files.length) this._status = 'ready';
  }

  acceptBy(receiverDeviceId: string, now: Date): void {
    if (this.isExpired(now)) throw new SessionExpired(this.id);
    if (this._status !== 'ready') throw new SessionNotReady(this.id);
    if (this._receiverDeviceId) throw new SessionAlreadyAccepted(this.id);
    this._receiverDeviceId = receiverDeviceId;
  }

  markExpired(): void {
    this._status = 'expired';
  }

  toSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      senderDeviceId: this.senderDeviceId,
      networkPrefix: this.networkPrefix.value,
      files: this.files.map((f) => ({
        index: f.index,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
      })),
      ttlLabel: this.ttl.label,
      createdAt: this.createdAt.toISOString(),
      status: this._status,
      uploadedCount: this._uploadedCount,
      targetDeviceId: this.targetDeviceId,
      receiverDeviceId: this._receiverDeviceId,
    };
  }
}
