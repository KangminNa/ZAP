import Fastify from 'fastify';
import cors from '@fastify/cors';
import { valkeyPlugin } from './plugins/valkey';
import { minioPlugin } from './plugins/minio';
import { healthRoutes } from './routes/health';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = Fastify({
  logger:
    process.env.NODE_ENV === 'production'
      ? true
      : { transport: { target: 'pino-pretty' } },
});

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
});

await app.register(valkeyPlugin);
await app.register(minioPlugin);
await app.register(healthRoutes);

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
