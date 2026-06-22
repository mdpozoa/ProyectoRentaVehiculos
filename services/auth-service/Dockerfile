# ── STAGE 1: Build ──
FROM node:20-slim AS builder

RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# ── STAGE 2: Runner ──
FROM node:20-slim AS runner

RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/proto ./proto

USER node

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/server.js"]
