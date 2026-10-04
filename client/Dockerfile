FROM node:18-alpine

WORKDIR /app

# Copy all source files first
COPY . .

# Install all dependencies
RUN npm ci --workspaces

# Build client
RUN npm run build --workspace=client

EXPOSE 5173

CMD ["npm", "run", "preview", "--workspace=client", "--", "--host", "0.0.0.0", "--port", "5173"]