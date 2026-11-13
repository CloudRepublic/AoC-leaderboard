# syntax=docker/dockerfile:1
#
# Leaderboard screen + server on Google's distroless Node.js image:
#   build  builds the screen, bundles the server (express included) into one
#          file and assembles everything under /out
#   final  distroless nodejs (non-root, no shell) + /out as a single layer
#
# Run:
#   docker run -p 8080:8080 \
#     -e AOC_LEADERBOARD_ID=<id> \
#     -v aoc-cache:/app/data \
#     -v "$PWD/secrets/aoc.session:/run/secrets/aoc_session:ro" \
#     caesar-aoc-leaderboard

ARG NODE_VERSION=24
ARG DISTROLESS=gcr.io/distroless/nodejs24-debian13:nonroot

FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /src
ENV CI=true NX_DAEMON=false NX_NO_CLOUD=true
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx nx run-many -t build -p leaderboard leaderboard-server \
      --configuration=production --skip-nx-cache
# Everything the image adds, so it lands in one layer. Only the data folder is
# writable by the distroless `nonroot` user (65532).
RUN mkdir -p /out/app/data \
 && cp dist/apps/leaderboard-server/main.js /out/app/main.js \
 && cp -r dist/apps/leaderboard/browser /out/app/public \
 && chown 65532:65532 /out/app/data

FROM ${DISTROLESS}
COPY --from=build /out /
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    STATIC_DIR=/app/public \
    AOC_CACHE_FILE=/app/data/cache.json \
    AOC_SESSION_FILE=/run/secrets/aoc_session
# The cache keeps the last fetch time, which keeps the 15-minute AoC limit
# across container restarts: keep it on a volume.
VOLUME /app/data
EXPOSE 8080
# The distroless entrypoint is node itself.
CMD ["/app/main.js"]
