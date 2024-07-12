# --------------------------------------
# [Base Image]
# --------------------------------------

# base for build steps
FROM docker.io/hazmi35/node:20-dev AS dev

# Enable corepack
RUN corepack enable

# --------------------------------------
# [Step 1 - Install dependencies]
# --------------------------------------
FROM dev AS deps

# Copy package.json an lockfile
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# --------------------------------------
# [Steps 2 - Build]
# --------------------------------------
FROM dev AS build

COPY --from=deps /tmp/build/node_modules ./node_modules
COPY . .

# Create empty git repo (workaround for Vercel Trace Uploader)
# REF: https://github.com/vercel/next.js/blob/b9bd23baec14508400c502b3651f4cf2497e883b/packages/next/src/trace/trace-uploader.ts#L118)
RUN git config --global user.email "no@thankyou.com" && pnpm run git:init

# Build the app
RUN pnpm run build

# --------------------------------------
# [Step 3 - Final]
# --------------------------------------
FROM docker.io/hazmi35/node:20 AS final

# Copy the build files
COPY --from=build /tmp/build/docker-entrypoint.sh entrypoint.sh
COPY --from=build --chown=nextjs:nodejs /tmp/build/.next/standalone .
COPY --from=build --chown=nextjs:nodejs /tmp/build/.next/static ./.next/static

# Mark port 3000 as exposed
EXPOSE 3000
ENV PORT=3000

ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD ["node", "server.js"]
