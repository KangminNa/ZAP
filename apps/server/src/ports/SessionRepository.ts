import type { NetworkPrefix, SessionId } from '@zap/shared';
import type { Session } from '../domain/Session';

export interface SessionRepository {
  save(session: Session, ttlSeconds: number): Promise<void>;
  findById(id: SessionId): Promise<Session | null>;
  delete(id: SessionId): Promise<void>;
  listByNetwork(prefix: NetworkPrefix): Promise<SessionId[]>;
}
