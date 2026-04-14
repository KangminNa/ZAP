import fp from 'fastify-plugin';
import type { FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';

declare module 'fastify' {
  interface FastifyReply {
    /**
     * 비밀(presigned URL, 세션 토큰 등)을 담은 응답에 호출.
     * - Cache-Control: no-store — 중간 캐시/브라우저 저장 차단
     * - Content-Encoding: identity — 압축 우회 (BREACH/CRIME 완화)
     */
    sensitive(): FastifyReply;
  }
}

export const securityPlugin = fp(async (app) => {
  // ── CORS ───────────────────────────────────────────────────
  await app.register(cors, {
    origin: app.config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  });

  // ── 보안 헤더 (helmet) ──────────────────────────────────────
  // API 서버이므로 CSP는 프론트에서 설정. 여기선 기본값만 켬.
  // MinIO presigned URL을 다른 오리진에서 사용하므로 CORP는 cross-origin.
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: app.config.isProduction
      ? { maxAge: 15_552_000, includeSubDomains: true, preload: true }
      : false,
  });

  // ── 응답 압축 ───────────────────────────────────────────────
  // BREACH/CRIME 방어:
  //   - threshold 1KB: 작은 응답은 압축 안 함 (헤더 오버헤드·공격 표면 축소)
  //   - encodings: gzip/br만 (deflate 제외)
  //   - reply.sensitive() 호출 응답은 Content-Encoding: identity로 압축 우회
  await app.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ['br', 'gzip'],
  });

  // ── 민감 응답 마킹 헬퍼 ─────────────────────────────────────
  // 사용 예:
  //   return reply.sensitive().send({ sessionId, presignedUrls });
  app.decorateReply('sensitive', function (this: FastifyReply) {
    this.header('Cache-Control', 'no-store');
    this.header('Pragma', 'no-cache');
    this.header('Content-Encoding', 'identity');
    return this;
  });

  // ── 에러 핸들러 ──────────────────────────────────────────────
  // 프로덕션에선 스택/내부 메시지를 외부에 흘리지 않음.
  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, 'request error');
    const statusCode = err.statusCode ?? 500;
    const isClientError = statusCode >= 400 && statusCode < 500;
    const message =
      isClientError || !app.config.isProduction
        ? err.message
        : 'internal server error';
    reply.status(statusCode).send({ error: message, statusCode });
  });
});
