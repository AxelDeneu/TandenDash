FROM node:20-alpine

# Install dependencies for better-sqlite3 and pnpm
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --dangerously-allow-all-builds

# Copy source code
COPY . .

RUN pnpm run postinstall

RUN pnpm run widgets:install

# Build the application
RUN pnpm run build

# Rebuild better-sqlite3 for Docker environment
RUN pnpm rebuild better-sqlite3

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]