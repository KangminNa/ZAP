import type { SessionId } from '@zap/shared';
import { SessionNotFound } from '../domain/errors';
import type { SessionRepository } from '../ports/SessionRepository';
import type { ObjectStorage } from '../ports/ObjectStorage';
import type { Clock } from '../ports/Clock';

export interface AcceptTransferDeps {
  sessionRepo: SessionRepository;
  objectStorage: ObjectStorage;
  clock: Clock;
}

export async function acceptTransfer(
  deps: AcceptTransferDeps,
  sessionId: SessionId,
  receiverDeviceId: string,
): Promise<{ presignedUrls: string[] }> {
  const session = await deps.sessionRepo.findById(sessionId);
  if (!session) throw new SessionNotFound(sessionId);

  const now = deps.clock.now();
  session.acceptBy(receiverDeviceId, now);

  const remaining = session.ttl.remainingSeconds(session.createdAt, now);
  const presignedUrls = await deps.objectStorage.issueDownloadUrls(
    session,
    remaining,
  );

  await deps.sessionRepo.save(session, remaining);

  return { presignedUrls };
}
