FROM node:18-alpine

WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./

# Copy workspace package files
COPY server/package*.json server/
COPY client/package*.json client/

# Install all dependencies (including workspaces)
RUN npm ci --workspaces

# Copy source code
COPY . .

# Build client
RUN npm run build --workspace=client

EXPOSE 5173

CMD ["npm", "run", "preview", "--workspace=client", "--", "--host", "0.0.0.0", "--port", "5173"]