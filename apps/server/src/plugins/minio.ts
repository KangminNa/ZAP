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
  const { minio } = app.config;

  const internal = new MinioClient({
    endPoint: minio.endPoint,
    port: minio.port,
    useSSL: minio.useSSL,
    accessKey: minio.accessKey,
    secretKey: minio.secretKey,
  });

  const publicClient = new MinioClient({
    endPoint: minio.public.endPoint,
    port: minio.public.port,
    useSSL: minio.public.useSSL,
    accessKey: minio.accessKey,
    secretKey: minio.secretKey,
  });

  app.decorate('minio', internal);
  app.decorate('minioPublic', publicClient);
  app.decorate('minioBucket', minio.bucket);
});
