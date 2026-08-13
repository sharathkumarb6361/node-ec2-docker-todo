# Production Dockerfile for Node.js Application
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose server port
EXPOSE 3000

# Container health check instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run non-root user for security best practices
USER node

# Start the application
CMD ["node", "server.js"]
