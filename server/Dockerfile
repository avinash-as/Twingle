FROM node:18-alpine

WORKDIR /app

# Copy package files (context is server/)
COPY package*.json ./

# Install production dependencies (use install instead of ci for flexibility)
RUN npm install --omit=dev

# Copy server source (context is server/)
COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]