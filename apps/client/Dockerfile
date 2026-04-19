FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/client/package.json apps/client/
RUN pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY apps/client/ apps/client/
RUN pnpm --filter @zap/client build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
