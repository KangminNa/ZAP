import fp from 'fastify-plugin';
import { verifyDeviceToken, refreshDeviceToken } from '../services/auth';

declare module 'fastify' {
  interface FastifyRequest {
    deviceId: string;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest('deviceId', '');

  app.addHook('onRequest', async (req, reply) => {
    const path = req.url.split('?')[0];

    if (path === '/health' || path === '/api/auth/device' || path === '/ws') return;

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'missing device token', statusCode: 401 });
      return;
    }

    const token = header.slice(7);
    const result = verifyDeviceToken(
      token,
      app.config.auth.secret,
      app.config.auth.tokenTtlHours,
    );

    if (!result.valid) {
      reply.status(401).send({ error: 'invalid or expired device token', statusCode: 401 });
      return;
    }

    req.deviceId = result.deviceId;

    const age = Date.now() / 1000 - result.issuedAt;
    const halfLife = (app.config.auth.tokenTtlHours * 3600) / 2;
    if (age > halfLife) {
      const refreshed = refreshDeviceToken(result.deviceId, app.config.auth.secret);
      reply.header('X-Device-Token-Refresh', refreshed);
    }
  });
});
