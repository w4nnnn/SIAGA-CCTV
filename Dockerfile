ARG NODE_VERSION=22-alpine

# ============================================
# Stage 1: Dependencies Installation
# ============================================
FROM node:${NODE_VERSION} AS dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2: Application Build
# ============================================
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Dummy build-time environment variables required for module evaluation
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/siaga_cctv
ENV AUTH_SECRET=dummy_secret_during_next_build_process_32_chars_min!

RUN npm run build
RUN npm run build:seed

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/dist/seed.js ./seed.js
COPY --from=builder --chown=nextjs:nodejs /app/dist/seed-simulation.js ./seed-simulation.js
RUN mkdir -p ./src/db && chown -R nextjs:nodejs ./src
COPY --from=builder --chown=nextjs:nodejs /app/dist/seed.js ./src/db/seed.js
COPY --from=builder --chown=nextjs:nodejs /app/dist/seed-simulation.js ./src/db/seed-simulation.js

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
