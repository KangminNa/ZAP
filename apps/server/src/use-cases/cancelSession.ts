import type { SessionId } from '@zap/shared';
import { SessionNotFound } from '../domain/errors';
import type { SessionRepository } from '../ports/SessionRepository';
import type { ObjectStorage } from '../ports/ObjectStorage';

export interface CancelSessionDeps {
  sessionRepo: SessionRepository;
  objectStorage: ObjectStorage;
}

export async function cancelSession(
  deps: CancelSessionDeps,
  sessionId: SessionId,
): Promise<void> {
  const session = await deps.sessionRepo.findById(sessionId);
  if (!session) throw new SessionNotFound(sessionId);

  await deps.objectStorage.deleteBySession(session);
  await deps.sessionRepo.delete(sessionId);
}
