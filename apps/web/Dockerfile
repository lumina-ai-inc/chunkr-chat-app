FROM node:20-alpine AS base

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat

# Install pnpm globally
RUN npm install -g pnpm@9.15.1

WORKDIR /app

# Copy root package files first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy only the web app directory that we're building
COPY apps/web/ ./apps/web/

# Install dependencies and turbo
RUN pnpm install --frozen-lockfile

# Prune the monorepo for the "web" workspace using pnpm
RUN pnpm turbo prune web --docker

FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.15.1
WORKDIR /app

# Copy pruned package.json and pnpm lockfile
COPY --from=builder /app/out/json/ .

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy pruned source code
COPY --from=builder /app/out/full/ .

# Build the project using Turbo
RUN pnpm turbo run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD ["node", "apps/web/server.js"]
