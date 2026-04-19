import type { FastifyPluginAsync } from 'fastify';
import { NetworkPrefix, SessionId, type WsEvent } from '@zap/shared';
import { acceptTransfer } from '../use-cases/acceptTransfer';
import { cancelSession } from '../use-cases/cancelSession';
import { resolveIp } from '../services/network';
import { verifyTransferToken } from '../services/auth';

export const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/ws', { websocket: true }, async (socket, req) => {
    const ticket = (req.query as Record<string, string>).ticket;
    if (!ticket) {
      socket.send(JSON.stringify({ event: 'error', payload: { message: 'missing ticket' } }));
      socket.close();
      return;
    }

    const ticketKey = `ws-ticket:${ticket}`;
    const deviceId = await app.valkey.get(ticketKey);
    if (!deviceId) {
      socket.send(JSON.stringify({ event: 'error', payload: { message: 'invalid or expired ticket' } }));
      socket.close();
      return;
    }
    await app.valkey.del(ticketKey);

    const networkPrefix = NetworkPrefix.fromIp(resolveIp(req.ip)).value;

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
            app.rooms.join(
              networkPrefix,
              { ...payload.device, id: deviceId },
              socket as never,
            );
            const devices = app.rooms.getDevices(networkPrefix);
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
              socket.send(JSON.stringify({
                event: 'error',
                payload: { message: 'invalid transfer token' },
              }));
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
              payload: {
                sessionId,
                presignedUrls: result.presignedUrls,
              },
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
  });
};
