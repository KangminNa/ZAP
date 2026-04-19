FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/
RUN pnpm --filter @zap/server build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/apps/server/dist/ apps/server/dist/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
