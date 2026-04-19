import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { Config } from './config';
import { securityPlugin } from './plugins/security';
import { authPlugin } from './plugins/auth';
import { valkeyPlugin } from './plugins/valkey';
import { minioPlugin } from './plugins/minio';
import { diPlugin } from './plugins/di';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { sessionRoutes } from './routes/sessions';
import { wsRoutes } from './ws/handler';

const config = Config.load();

const app = Fastify({
  logger: config.isProduction
    ? { level: config.logLevel }
    : { level: config.logLevel, transport: { target: 'pino-pretty' } },
  trustProxy: config.trustProxy,
});

app.decorate('config', config);

await app.register(securityPlugin);
await app.register(authPlugin);
await app.register(websocket);
await app.register(valkeyPlugin);
await app.register(minioPlugin);
await app.register(diPlugin);
await app.register(authRoutes);
await app.register(healthRoutes);
await app.register(sessionRoutes);
await app.register(wsRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
