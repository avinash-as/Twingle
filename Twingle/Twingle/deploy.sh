#!/bin/bash

set -e

echo "🚀 Deploying Twingle..."

# Check if .env files exist
if [ ! -f server/.env ]; then
    echo "❌ server/.env not found. Please copy server/.env.example to server/.env and configure it."
    exit 1
fi

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs server
    exit 1
fi

if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs client
    exit 1
fi

echo "🎉 Deployment complete!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5000"