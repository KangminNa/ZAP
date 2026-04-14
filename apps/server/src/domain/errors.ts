import { DomainErrorCode } from '@zap/shared';

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SessionNotFound extends DomainError {
  readonly code = DomainErrorCode.SESSION_NOT_FOUND;
  readonly statusCode = 404;
  constructor(sessionId: string) {
    super(`session not found: ${sessionId}`);
  }
}

export class SessionExpired extends DomainError {
  readonly code = DomainErrorCode.SESSION_EXPIRED;
  readonly statusCode = 410;
  constructor(sessionId: string) {
    super(`session expired: ${sessionId}`);
  }
}

export class SessionNotReady extends DomainError {
  readonly code = DomainErrorCode.SESSION_NOT_READY;
  readonly statusCode = 409;
  constructor(sessionId: string) {
    super(`session not ready: ${sessionId}`);
  }
}

export class SessionAlreadyAccepted extends DomainError {
  readonly code = DomainErrorCode.SESSION_ALREADY_ACCEPTED;
  readonly statusCode = 409;
  constructor(sessionId: string) {
    super(`session already accepted: ${sessionId}`);
  }
}

export class InvalidUploadCount extends DomainError {
  readonly code = DomainErrorCode.INVALID_UPLOAD_COUNT;
  readonly statusCode = 400;
}

export class InvalidTTL extends DomainError {
  readonly code = DomainErrorCode.INVALID_TTL;
  readonly statusCode = 400;
}

export function isDomainError(err: unknown): err is DomainError {
  return err instanceof DomainError;
}
