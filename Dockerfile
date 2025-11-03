FROM node:24-alpine

WORKDIR /app

# Install security updates and build dependencies for RE2
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init g++ linux-headers make python3 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (needed for build and RE2 compilation)
RUN npm ci

# Copy source code and build
COPY src/ ./src/
RUN npm run build

# Remove dev dependencies and build tools to reduce image size
RUN npm prune --omit=dev && \
    npm cache clean --force && \
    apk del g++ linux-headers make && \
    rm -rf /tmp/* /root/.npm

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]