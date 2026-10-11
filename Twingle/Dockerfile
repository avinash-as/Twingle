# Build stage for client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source
COPY client/ .

# Build client
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci --omit=dev

# Copy server source
COPY server/ .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy server dependencies and source
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/src ./src
COPY --from=server-builder /app/server/package*.json ./

# Copy built client files
COPY --from=client-builder /app/client/dist ./client/dist

# Copy server package.json for scripts
COPY server/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/index.js"]