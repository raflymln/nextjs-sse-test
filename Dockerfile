# ---------------------------------
# Base Image
# ---------------------------------

# Use Node.js 20 Alpine as the base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Install git
RUN apk add --no-cache git

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Run git:init command
RUN git config --global user.email "no@thankyou.com" && \
    git config --global user.name "No Thank You" && \
    pnpm run git:init

# Build the app
RUN pnpm run build

# ---------------------------------
# Run The Image
# ---------------------------------

# Production image, copy all the files and run next
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port 3000
EXPOSE 3000
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]