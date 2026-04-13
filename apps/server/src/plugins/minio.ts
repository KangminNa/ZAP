import fp from 'fastify-plugin';
import { Client as MinioClient } from 'minio';

declare module 'fastify' {
  interface FastifyInstance {
    minio: MinioClient;
    minioPublic: MinioClient;
    minioBucket: string;
  }
}

export const minioPlugin = fp(async (app) => {
  const accessKey = process.env.MINIO_ACCESS_KEY ?? 'zap_admin';
  const secretKey = process.env.MINIO_SECRET_KEY ?? 'zap_secret_change_me';
  const bucket = process.env.MINIO_BUCKET ?? 'zap-sessions';

  const internal = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey,
    secretKey,
  });

  const publicClient = new MinioClient({
    endPoint: process.env.MINIO_PUBLIC_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PUBLIC_PORT ?? 9000),
    useSSL: process.env.MINIO_PUBLIC_USE_SSL === 'true',
    accessKey,
    secretKey,
  });

  app.decorate('minio', internal);
  app.decorate('minioPublic', publicClient);
  app.decorate('minioBucket', bucket);
});
