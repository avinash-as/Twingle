# Deploy Twingle to Render (Backend) + Vercel (Frontend)

## Prerequisites
- GitHub repository with the code
- MongoDB Atlas account (for production database)
- Render account
- Vercel account

---

## 1. MongoDB Atlas Setup

1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Whitelist all IPs (0.0.0.0/0) for Render access
4. Get the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/twingle`

---

## 2. Backend Deployment on Render

### Option A: Using render.yaml (Recommended)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render will detect `render.yaml` and configure:
   - Service name: `twingle-backend`
   - Build: `npm ci --prefix server && npm run build --prefix server`
   - Start: `npm start --prefix server`
6. Add environment variables in Render dashboard:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/twingle
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   CLIENT_URL=https://your-frontend.vercel.app
   ```

### Option B: Manual Setup

1. **New Web Service** → Connect GitHub repo
2. **Settings:**
   - Name: `twingle-backend`
   - Root Directory: `server`
   - Build Command: `npm ci`
   - Start Command: `npm start`
3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/twingle
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRE=7d
   CLIENT_URL=https://your-frontend.vercel.app
   ```

---

## 3. Frontend Deployment on Vercel

### Option A: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project** → Import GitHub repo
3. **Configure:**
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables:**
   ```
   VITE_API_URL=https://twingle-backend.onrender.com/api
   ```
5. **Deploy**

### Option B: Vercel CLI

```bash
cd client
npm i -g vercel
vercel
# Follow prompts, set root directory to client
vercel env add VITE_API_URL
# Enter: https://twingle-backend.onrender.com/api
vercel --prod
```

---

## 4. Update CORS After Deployment

After both deployments:

1. Get your Vercel URL: `https://your-app.vercel.app`
2. Update Render backend env var: `CLIENT_URL=https://your-app.vercel.app`
3. Redeploy backend on Render

---

## 5. Environment Variables Summary

### Render (Backend)
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | `secure-random-string` |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | `https://your-app.vercel.app` |

### Vercel (Frontend)
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://twingle-backend.onrender.com/api` |

---

## 6. Local Development with Production Backend

For local frontend testing against production backend:

```bash
# In client/.env.local
VITE_API_URL=https://twingle-backend.onrender.com/api
```

```bash
cd client
npm run dev
```

---

## 7. Socket.IO on Render

Render supports WebSockets on paid plans. For free tier:
- Socket.IO will fall back to polling
- Works but with higher latency

For production WebSocket support:
- Use Render **Standard** plan or higher
- Or use a dedicated WebSocket service (Pusher, Ably)

---

## 8. Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` in Render matches exactly (no trailing slash)
- Check Vercel URL format: `https://app-name.vercel.app`

### MongoDB Connection
- Verify IP whitelist includes 0.0.0.0/0
- Check connection string format

### Build Failures
- Check Node.js version compatibility (use 18+)
- Clear build cache on Render/Vercel

### Socket.IO Not Connecting
- Verify `VITE_API_URL` doesn't have `/api` suffix for socket
- Check Render plan supports WebSockets