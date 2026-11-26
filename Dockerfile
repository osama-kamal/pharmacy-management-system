FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=5000
ENV PHARMACY_DATA_DIR=/data
WORKDIR /app
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server ./artifacts/api-server
COPY --from=build /app/artifacts/pharmacy-erp/dist ./artifacts/pharmacy-erp/dist
COPY --from=build /app/lib ./lib
VOLUME ["/data"]
EXPOSE 5000
CMD ["pnpm", "start"]
