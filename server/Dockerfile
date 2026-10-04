FROM node:18-alpine

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./

# Copy server package.json
COPY server/package*.json ./server/

# Install all dependencies (including workspaces)
RUN npm ci --workspaces --omit=dev

# Copy source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace=server"]