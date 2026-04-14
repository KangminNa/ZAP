export const DomainErrorCode = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_NOT_READY: 'SESSION_NOT_READY',
  SESSION_ALREADY_ACCEPTED: 'SESSION_ALREADY_ACCEPTED',
  INVALID_TTL: 'INVALID_TTL',
  INVALID_UPLOAD_COUNT: 'INVALID_UPLOAD_COUNT',
  UPLOAD_SIZE_EXCEEDED: 'UPLOAD_SIZE_EXCEEDED',
} as const;

export type DomainErrorCode = (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

export interface DomainErrorPayload {
  code: DomainErrorCode;
  message: string;
  statusCode: number;
}
