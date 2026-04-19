import type { FastifyPluginAsync } from 'fastify';
import {
  issueDeviceToken,
  generateWsTicket,
  WS_TICKET_TTL,
} from '../services/auth';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/auth/device', async (_req, reply) => {
    const { deviceId, token } = issueDeviceToken(app.config.auth.secret);
    return reply.sensitive().send({ deviceId, token });
  });

  app.post('/api/auth/ws-ticket', async (req, reply) => {
    const ticket = generateWsTicket();
    await app.valkey.setex(
      `ws-ticket:${ticket}`,
      WS_TICKET_TTL,
      req.deviceId,
    );
    return reply.sensitive().send({ ticket });
  });
};
