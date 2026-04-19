import type { FastifyPluginAsync } from 'fastify';
import { NetworkPrefix, SessionId, type WsEvent } from '@zap/shared';
import { acceptTransfer } from '../use-cases/acceptTransfer';
import { cancelSession } from '../use-cases/cancelSession';

export const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const networkPrefix = NetworkPrefix.fromIp(req.ip).value;
    let deviceId: string | null = null;

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
            deviceId = payload.device.id;
            app.rooms.join(
              networkPrefix,
              payload.device,
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
            if (!deviceId) break;
            const sid = SessionId.parse(payload.sessionId);
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
                sessionId: payload.sessionId,
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
      if (deviceId) {
        app.rooms.leave(deviceId);
        const devices = app.rooms.getDevices(networkPrefix);
        app.rooms.broadcast(networkPrefix, {
          event: 'device:list',
          payload: { devices },
        });
      }
    });
  });
};
