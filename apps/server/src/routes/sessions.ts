import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CreateSessionRequestSchema, SessionId } from '@zap/shared';
import { SessionNotFound } from '../domain/errors';
import { createSession } from '../use-cases/createSession';
import { cancelSession } from '../use-cases/cancelSession';

const ProgressBodySchema = z.object({
  uploadedCount: z.number().int().nonnegative(),
});

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/sessions', async (req, reply) => {
    const body = CreateSessionRequestSchema.parse(req.body);

    const deviceId = req.headers['x-device-id'];
    if (typeof deviceId !== 'string' || !deviceId) {
      return reply
        .status(400)
        .send({ error: 'X-Device-Id header required', statusCode: 400 });
    }

    const result = await createSession(
      {
        sessionRepo: app.sessionRepo,
        objectStorage: app.objectStorage,
        clock: app.clock,
      },
      body,
      deviceId,
      req.ip,
    );

    return reply.sensitive().send({
      sessionId: result.session.id,
      presignedUrls: result.uploadUrls,
      expiresAt: result.session.expiresAt.toISOString(),
    });
  });

  app.get<{ Params: { id: string } }>(
    '/api/sessions/:id',
    async (req, reply) => {
      const id = SessionId.parse(req.params.id);
      const session = await app.sessionRepo.findById(id);
      if (!session) throw new SessionNotFound(req.params.id);

      return reply.send({
        sessionId: session.id,
        status: session.status,
        fileCount: session.files.length,
        uploadedCount: session.uploadedCount,
        expiresAt: session.expiresAt.toISOString(),
      });
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/api/sessions/:id/progress',
    async (req, reply) => {
      const id = SessionId.parse(req.params.id);
      const { uploadedCount } = ProgressBodySchema.parse(req.body);

      const session = await app.sessionRepo.findById(id);
      if (!session) throw new SessionNotFound(req.params.id);

      const now = app.clock.now();
      session.markUploaded(uploadedCount, now);

      const remaining = session.ttl.remainingSeconds(session.createdAt, now);
      await app.sessionRepo.save(session, remaining);

      if (session.status === 'ready') {
        app.log.info({ sessionId: id }, 'session ready for transfer');
      }

      return reply.send({
        sessionId: session.id,
        status: session.status,
        uploadedCount: session.uploadedCount,
        fileCount: session.files.length,
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/sessions/:id',
    async (req, reply) => {
      const id = SessionId.parse(req.params.id);
      await cancelSession(
        { sessionRepo: app.sessionRepo, objectStorage: app.objectStorage },
        id,
      );
      return reply.status(204).send();
    },
  );
};
