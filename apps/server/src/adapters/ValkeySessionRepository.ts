import { SessionId, NetworkPrefix } from '@zap/shared';
import type Redis from 'ioredis';
import { Session } from '../domain/Session';
import type { SessionRepository } from '../ports/SessionRepository';

export class ValkeySessionRepository implements SessionRepository {
  constructor(private readonly redis: Redis) {}

  async save(session: Session, ttlSeconds: number): Promise<void> {
    const key = `session:${session.id}`;
    const snapshot = JSON.stringify(session.toSnapshot());
    const networkKey = `network:${session.networkPrefix.value}`;

    const pipeline = this.redis.pipeline();
    pipeline.setex(key, ttlSeconds, snapshot);
    pipeline.sadd(networkKey, session.id);
    pipeline.expire(networkKey, ttlSeconds);
    await pipeline.exec();
  }

  async findById(id: SessionId): Promise<Session | null> {
    const raw = await this.redis.get(`session:${id}`);
    if (!raw) return null;
    return Session.rehydrate(JSON.parse(raw));
  }

  async delete(id: SessionId): Promise<void> {
    const session = await this.findById(id);
    await this.redis.del(`session:${id}`);
    if (session) {
      await this.redis.srem(
        `network:${session.networkPrefix.value}`,
        id,
      );
    }
  }

  async listByNetwork(prefix: NetworkPrefix): Promise<SessionId[]> {
    const members = await this.redis.smembers(`network:${prefix.value}`);
    return members.filter(SessionId.is);
  }
}
