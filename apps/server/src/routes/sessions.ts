import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CreateSessionRequestSchema, SessionId } from '@zap/shared';
import { SessionNotFound } from '../domain/errors';
import { createSession } from '../use-cases/createSession';
import { cancelSession } from '../use-cases/cancelSession';
import { issueTransferToken } from '../services/auth';

const ProgressBodySchema = z.object({
  uploadedCount: z.number().int().nonnegative(),
});

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/sessions', async (req, reply) => {
    const body = CreateSessionRequestSchema.parse(req.body);

    const result = await createSession(
      {
        sessionRepo: app.sessionRepo,
        objectStorage: app.objectStorage,
        clock: app.clock,
      },
      body,
      req.deviceId,
      req.ip,
    );

    const transferToken = issueTransferToken(
      result.session.id,
      body.targetDeviceId,
      app.config.auth.secret,
    );

    return reply.sensitive().send({
      sessionId: result.session.id,
      presignedUrls: result.uploadUrls,
      expiresAt: result.session.expiresAt.toISOString(),
      transferToken,
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
        const transferToken = issueTransferToken(
          session.id,
          session.targetDeviceId,
          app.config.auth.secret,
        );
        await app.eventBus.publishToDevice(session.targetDeviceId, {
          event: 'transfer:ready',
          payload: {
            sessionId: session.id,
            sender: { id: session.senderDeviceId, name: '', type: 'unknown' },
            fileCount: session.files.length,
            totalSize: session.totalSize,
            expiresAt: session.expiresAt.toISOString(),
            transferToken,
          },
        } as never);
        app.log.info({ sessionId: id }, 'session ready, notified receiver');
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
