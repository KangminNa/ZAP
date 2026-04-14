import type { FileMetaDto } from '@zap/shared';

export class FileSlot {
  constructor(
    public readonly index: number,
    public readonly name: string,
    public readonly size: number,
    public readonly mimeType: string,
  ) {
    Object.freeze(this);
  }

  static fromDto(index: number, dto: FileMetaDto): FileSlot {
    return new FileSlot(index, dto.name, dto.size, dto.mimeType);
  }

  /** 세션 네임스페이스 안에서의 파일 키. Session이 세션 ID와 결합함. */
  get localKey(): string {
    return `${this.index}_${this.name}`;
  }

  toDto(): FileMetaDto {
    return { name: this.name, size: this.size, mimeType: this.mimeType };
  }
}
