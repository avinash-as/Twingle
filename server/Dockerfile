FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy server source
COPY server/ .

EXPOSE 5000

CMD ["node", "src/index.js"]