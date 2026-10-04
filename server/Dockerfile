FROM node:18-alpine

WORKDIR /app

# Copy all source files first
COPY . .

# Install dependencies using workspaces
RUN npm ci --workspaces --omit=dev

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace=server"]