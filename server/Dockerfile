FROM node:18-alpine

WORKDIR /app

# Copy package files (context is server/)
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy server source (context is server/)
COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]