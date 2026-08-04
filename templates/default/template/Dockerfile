# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
# `ness bundle` traces the production dependency graph and writes a
# self-contained directory, so the runtime stage needs no install step.
RUN npm run build && npx ness bundle node

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build --chown=node:node /app/build/standalone ./
USER node
EXPOSE 3000
# The server installs SIGTERM/SIGINT handlers, so it must receive them directly
# rather than through a shell.
CMD ["node", "server.mjs"]
