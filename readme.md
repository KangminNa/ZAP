# ZAP

설치 없이 브라우저만으로 같은 Wi-Fi의 기기에 파일을 즉시 전송하는 웹 서비스.

## 구조

```
ZAP/
├── apps/server     Fastify + TypeScript (REST + WebSocket)
├── apps/client     React + Vite + Tailwind (SPA)
├── packages/shared 공유 타입, DTO, 프로토콜
└── infra/          Docker Compose (MinIO + Valkey)
```

## 시작하기

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수
cp apps/server/.env.example apps/server/.env

# 3. 인프라 (MinIO + Valkey)
pnpm infra:up

# 4. 개발 서버 (server :3000 + client :5173)
pnpm dev
```

브라우저에서 `http://localhost:5173` 접속.
같은 Wi-Fi의 다른 기기는 `http://<내_IP>:5173` 접속.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 클라이언트 | React 18, TypeScript, Tailwind CSS, Zustand, Vite |
| 서버 | Node.js, Fastify, WebSocket, Zod |
| 스토리지 | MinIO (S3 호환, presigned URL 직접 업/다운로드) |
| 캐시 | Valkey (Redis 호환, 세션 TTL 관리) |
| 인프라 | Docker Compose |

## 전송 흐름

```
송신자 브라우저 ──POST /api/sessions──▶ 서버 ──presigned URLs──▶ 송신자
송신자 ──PUT (파일)──▶ MinIO (서버 무경유)
서버 ──WS transfer:ready──▶ 수신자 브라우저
수신자 ──저장하기──▶ 서버 ──presigned GET URLs──▶ 수신자
수신자 ──GET (파일)──▶ MinIO (서버 무경유)
```

서버는 파일을 중계하지 않음. 메타데이터와 알림만 담당.

## 보안

- HMAC 서명 Device Token (로그인 불필요, 서버가 기기 신원 보증)
- 일회용 WS Ticket (30초 TTL, Valkey 저장 후 사용 즉시 삭제)
- Transfer Token (지정 수신자만 수락 가능, stateless HMAC 검증)
- timingSafeEqual 적용 (타이밍 공격 방지)
- Rate limiting (60 req/min + WS 30 msg/10s)
- Helmet 보안 헤더, BREACH/CRIME 대응 압축 정책
- MinIO presigned-only (익명 접근 차단)

## 프로덕션 배포

```bash
# 1. 환경 변수 설정
cp .env.example .env
# AUTH_SECRET, MINIO_ROOT_PASSWORD, CORS_ORIGIN 등 수정

# 2. 빌드 + 기동
docker compose up -d --build

# 3. 확인
curl http://localhost/api/health
```

전체 스택(client + server + MinIO + Valkey)이 하나의 `docker compose`로 실행됩니다.

```
:80  nginx (SPA + /api /ws 리버스 프록시)
  └─ :3000  Fastify (내부, 외부 미노출)
  └─ :9000  MinIO (내부, presigned URL 경유)
  └─ :6379  Valkey (내부)
```

## 개발

```bash
pnpm install
cp apps/server/.env.example apps/server/.env
pnpm infra:up      # MinIO + Valkey (Docker)
pnpm dev           # server :3000 + client :5173 (Vite proxy)
```

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | server + client 동시 실행 |
| `pnpm dev:server` | 서버만 실행 |
| `pnpm dev:client` | 클라이언트만 실행 |
| `pnpm infra:up` | MinIO + Valkey 기동 |
| `pnpm infra:down` | MinIO + Valkey 종료 |
| `pnpm typecheck` | 전체 타입 체크 |

## 환경 변수

`.env.example` (프로덕션) / `apps/server/.env.example` (개발) 참조. 필수:

- `AUTH_SECRET` — HMAC 서명 키 (최소 32자, `openssl rand -hex 32`)
- `MINIO_ROOT_PASSWORD` — MinIO 관리자 비밀번호
- `CORS_ORIGIN` — 프론트엔드 도메인 (`https://your-domain.com`)

## 라이선스

Private
