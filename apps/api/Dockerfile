FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @careprobe/api
COPY apps/api apps/api
RUN pnpm --filter @careprobe/api build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production API_HOST=0.0.0.0 CAREPROBE_SANDBOX=docker-v1
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
USER 10001:10001
EXPOSE 3100
CMD ["node", "apps/api/dist/server.js"]
