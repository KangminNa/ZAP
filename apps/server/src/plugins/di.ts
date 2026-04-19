import fp from 'fastify-plugin';
import type { SessionRepository } from '../ports/SessionRepository';
import type { ObjectStorage } from '../ports/ObjectStorage';
import type { EventBus } from '../ports/EventBus';
import type { Clock } from '../ports/Clock';
import { ValkeySessionRepository } from '../adapters/ValkeySessionRepository';
import { MinioObjectStorage } from '../adapters/MinioObjectStorage';
import { SystemClock } from '../adapters/SystemClock';
import { WsEventBus } from '../adapters/WsEventBus';
import { Rooms } from '../ws/rooms';

declare module 'fastify' {
  interface FastifyInstance {
    sessionRepo: SessionRepository;
    objectStorage: ObjectStorage;
    eventBus: EventBus;
    clock: Clock;
    rooms: Rooms;
  }
}

export const diPlugin = fp(async (app) => {
  const rooms = new Rooms();

  app.decorate('rooms', rooms);
  app.decorate('clock', new SystemClock());
  app.decorate('sessionRepo', new ValkeySessionRepository(app.valkey));
  app.decorate(
    'objectStorage',
    new MinioObjectStorage(app.minio, app.minioPublic, app.minioBucket),
  );
  app.decorate('eventBus', new WsEventBus(rooms));
});
