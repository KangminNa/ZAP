import { nanoid } from 'nanoid';
import { SessionId, TTL, NetworkPrefix, MAX_TOTAL_SIZE, type CreateSessionRequest } from '@zap/shared';
import { resolveIp } from '../services/network';
import { Session } from '../domain/Session';
import { FileSlot } from '../domain/FileSlot';
import type { SessionRepository } from '../ports/SessionRepository';
import type { ObjectStorage } from '../ports/ObjectStorage';
import type { Clock } from '../ports/Clock';

export interface CreateSessionDeps {
  sessionRepo: SessionRepository;
  objectStorage: ObjectStorage;
  clock: Clock;
}

export interface CreateSessionResult {
  session: Session;
  uploadUrls: string[];
}

const UPLOAD_URL_BUFFER_SECONDS = 600;

export async function createSession(
  deps: CreateSessionDeps,
  input: CreateSessionRequest,
  senderDeviceId: string,
  senderIp: string,
): Promise<CreateSessionResult> {
  const ttl = TTL.parse(input.ttl);
  const totalSize = input.files.reduce((s, f) => s + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error(`total size ${totalSize} exceeds limit ${MAX_TOTAL_SIZE}`);
  }
  const networkPrefix = NetworkPrefix.fromIp(resolveIp(senderIp));
  const id = SessionId.parse(`zap_${nanoid(16)}`);
  const files = input.files.map((f, i) => FileSlot.fromDto(i, f));

  const session = Session.create({
    id,
    senderDeviceId,
    targetDeviceId: input.targetDeviceId,
    networkPrefix,
    files,
    ttl,
    now: deps.clock.now(),
  });

  const uploadUrls = await deps.objectStorage.issueUploadUrls(
    session,
    ttl.seconds + UPLOAD_URL_BUFFER_SECONDS,
  );

  await deps.sessionRepo.save(session, ttl.seconds);

  return { session, uploadUrls };
}
