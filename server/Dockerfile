FROM node:18-alpine

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./

# Copy workspace package files
COPY server/package*.json server/
COPY client/package*.json client/

# Install all dependencies (including workspaces)
RUN npm ci --workspaces --omit=dev

# Copy source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace=server"]