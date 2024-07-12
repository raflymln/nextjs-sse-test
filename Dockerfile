# Use Node.js 20 Alpine as the base image
FROM mirror.gcr.io/library/node:20-alpine AS base

# ----------------------
# Install dependencies
# ----------------------

FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# ----------------------
# Install dependencies
# ----------------------

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# The following line below disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable pnpm && pnpm build

# ----------------------
# Prepare the runtime environment
# ----------------------

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# The following line disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]