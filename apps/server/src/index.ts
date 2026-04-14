import Fastify from 'fastify';
import { Config } from './config';
import { securityPlugin } from './plugins/security';
import { valkeyPlugin } from './plugins/valkey';
import { minioPlugin } from './plugins/minio';
import { healthRoutes } from './routes/health';

const config = Config.load();

const app = Fastify({
  logger: config.isProduction
    ? { level: config.logLevel }
    : { level: config.logLevel, transport: { target: 'pino-pretty' } },
  trustProxy: config.trustProxy,
});

app.decorate('config', config);

await app.register(securityPlugin);
await app.register(valkeyPlugin);
await app.register(minioPlugin);
await app.register(healthRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
