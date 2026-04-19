import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    valkey: Redis;
    valkeyHealthy: boolean;
  }
}

export const valkeyPlugin = fp(async (app) => {
  const client = new Redis(app.config.valkey.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  let healthy = false;
  client.on('error', (err) => {
    healthy = false;
    app.log.error({ err }, 'valkey error');
  });
  client.on('connect', () => {
    healthy = true;
    app.log.info('valkey connected');
  });
  client.on('close', () => {
    healthy = false;
  });

  app.decorate('valkey', client);
  app.decorate('valkeyHealthy', {
    getter() { return healthy; },
  });

  app.addHook('onRequest', async (req, reply) => {
    const path = req.url.split('?')[0];
    if (path === '/health') return;
    if (!healthy) {
      reply.status(503).send({ error: 'service unavailable', statusCode: 503 });
    }
  });

  app.addHook('onClose', async () => {
    await client.quit();
  });
});
