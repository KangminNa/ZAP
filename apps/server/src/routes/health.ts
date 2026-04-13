import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    const checks: Record<string, string> = { status: 'ok' };

    try {
      const pong = await app.valkey.ping();
      checks.valkey = pong === 'PONG' ? 'up' : 'down';
    } catch {
      checks.valkey = 'down';
    }

    try {
      const exists = await app.minio.bucketExists(app.minioBucket);
      checks.minio = exists ? 'up' : 'bucket-missing';
    } catch {
      checks.minio = 'down';
    }

    return checks;
  });
};
