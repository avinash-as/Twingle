# Deployment Guide

## Production Deployment with Docker

### Prerequisites
- Docker & Docker Compose installed
- Domain name (optional, for SSL)
- MongoDB Atlas account (recommended for production)

### 1. Configure Environment Variables

Create `server/.env` with production values:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/twingle
JWT_SECRET=your-super-secure-random-string-here
JWT_EXPIRE=7d
CLIENT_URL=https://yourdomain.com
```

### 2. Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. SSL with Nginx (Optional)

Create `nginx.prod.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://client:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://server:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://server:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Run certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/twingle |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | Token expiration | 7d |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |

## Health Checks

- Backend: `GET /api/health`
- Frontend: `GET /`

## Monitoring

```bash
# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f server
docker-compose logs -f client

# Check container status
docker-compose ps
```

## Backup MongoDB

```bash
# Create backup
docker exec twingle-mongodb mongodump --out /data/backup

# Restore backup
docker exec twingle-mongodb mongorestore /data/backup
```

## Scaling Considerations

1. **MongoDB**: Use replica sets in production
2. **Socket.IO**: Use Redis adapter for multi-instance
3. **Frontend**: Use CDN for static assets
4. **Load Balancer**: Nginx/HAProxy for multiple server instances

## Troubleshooting

### Container won't start
```bash
docker-compose logs server
docker-compose logs client
```

### MongoDB connection issues
- Check MONGODB_URI format
- Ensure network connectivity
- Verify credentials

### Socket.IO not working
- Check CORS origins
- Verify WebSocket proxy config
- Check firewall rules