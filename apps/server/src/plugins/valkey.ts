import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    valkey: Redis;
  }
}

export const valkeyPlugin = fp(async (app) => {
  const client = new Redis(process.env.VALKEY_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  client.on('error', (err) => app.log.error({ err }, 'valkey error'));
  client.on('connect', () => app.log.info('valkey connected'));

  app.decorate('valkey', client);

  app.addHook('onClose', async () => {
    await client.quit();
  });
});
