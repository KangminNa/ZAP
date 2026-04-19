import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { NetworkPrefix, SessionId, type WsEvent } from '@zap/shared';
import { acceptTransfer } from '../use-cases/acceptTransfer';
import { cancelSession } from '../use-cases/cancelSession';
import { resolveIp } from '../services/network';
import { verifyTransferToken } from '../services/auth';

declare module 'fastify' {
  interface FastifyRequest {
    wsDeviceId?: string;
  }
}

export const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/ws',
    {
      websocket: true,
      preValidation: async (req: FastifyRequest, reply) => {
        const ticket = (req.query as Record<string, string>).ticket;
        if (!ticket) {
          reply.code(401).send({ error: 'missing ticket' });
          return;
        }
        const ticketKey = `ws-ticket:${ticket}`;
        const deviceId = await app.valkey.get(ticketKey);
        if (!deviceId) {
          reply.code(401).send({ error: 'invalid or expired ticket' });
          return;
        }
        await app.valkey.del(ticketKey);
        req.wsDeviceId = deviceId;
      },
    },
    (socket, req) => {
      const deviceId = req.wsDeviceId!;
      const resolvedIp = resolveIp(req.ip);
      const networkPrefix = NetworkPrefix.fromIp(resolvedIp).value;
      req.log.info({ rawIp: req.ip, resolvedIp, networkPrefix, deviceId }, 'ws ready');

      socket.on('message', async (raw: Buffer) => {
        let parsed: WsEvent;
        try {
          parsed = JSON.parse(raw.toString());
        } catch {
          return;
        }

        try {
          const { event, payload } = parsed;

          switch (event) {
            case 'device:join': {
              const deviceInfo = { ...payload.device, id: deviceId };
              app.rooms.join(networkPrefix, deviceInfo, socket as never);
              const devices = app.rooms.getDevices(networkPrefix);
              req.log.info(
                { deviceId, deviceName: deviceInfo.name, networkPrefix, roomSize: devices.length },
                'device:join',
              );
              app.rooms.broadcast(networkPrefix, {
                event: 'device:list',
                payload: { devices },
              });
              break;
            }

            case 'transfer:accept': {
              const { sessionId } = payload;
              const transferToken = (payload as Record<string, string>).transferToken;
              const sid = SessionId.parse(sessionId);

              if (
                !transferToken ||
                !verifyTransferToken(transferToken, sessionId, deviceId, app.config.auth.secret)
              ) {
                socket.send(
                  JSON.stringify({
                    event: 'error',
                    payload: { message: 'invalid transfer token' },
                  }),
                );
                break;
              }

              const result = await acceptTransfer(
                {
                  sessionRepo: app.sessionRepo,
                  objectStorage: app.objectStorage,
                  clock: app.clock,
                },
                sid,
                deviceId,
              );
              app.rooms.sendTo(deviceId, {
                event: 'transfer:complete',
                payload: { sessionId, presignedUrls: result.presignedUrls },
              });
              break;
            }

            case 'transfer:decline': {
              const sid = SessionId.parse(payload.sessionId);
              await cancelSession(
                {
                  sessionRepo: app.sessionRepo,
                  objectStorage: app.objectStorage,
                },
                sid,
              );
              break;
            }

            default:
              break;
          }
        } catch (err) {
          req.log.error({ err }, 'ws message error');
          socket.send(
            JSON.stringify({
              event: 'error',
              payload: { message: (err as Error).message },
            }),
          );
        }
      });

      socket.on('close', () => {
        app.rooms.leave(deviceId);
        const devices = app.rooms.getDevices(networkPrefix);
        app.rooms.broadcast(networkPrefix, {
          event: 'device:list',
          payload: { devices },
        });
      });
    },
  );
};
