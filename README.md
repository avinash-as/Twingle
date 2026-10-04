# Twingle - Nearby Person Discovery App

A full-stack nearby discovery app built with React, Node.js, Express, MongoDB, and Socket.IO.

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios
- Socket.IO Client
- Lucide React (icons)
- date-fns

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- bcryptjs
- Helmet, CORS, Rate Limiting

## Project Structure

```
twingle/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles
│   └── ...
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.IO handlers
│   │   └── utils/          # Utility functions
│   └── ...
└── package.json           # Root package.json (monorepo)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment:**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your configuration
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Run development servers:**
   ```bash
   npm run dev
   ```
   This starts both frontend (port 5173) and backend (port 5000).

### Production Build

```bash
npm run build
npm run start
```

## Features

### Core Flow
- ✅ User Registration & Login (JWT)
- ✅ Location-based nearby discovery
- ✅ Real-time radar scanner UI
- ✅ Connection requests (send/accept/reject)
- ✅ Real-time chat with Socket.IO
- ✅ Online/offline presence
- ✅ Discoverability toggle

### UI/UX
- ✅ Dark/Light mode
- ✅ Mobile-first responsive design
- ✅ Smooth animations
- ✅ Radar scanning animation
- ✅ Bottom navigation
- ✅ Profile management

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `POST /api/users/location` - Update user location
- `GET /api/users/nearby` - Get nearby users
- `GET /api/users/connected` - Get connected users
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/discoverable` - Toggle discoverability

### Connections
- `POST /api/connections/connect` - Send connection request
- `GET /api/connections/pending` - Get pending requests
- `PUT /api/connections/accept/:id` - Accept connection
- `PUT /api/connections/reject/:id` - Reject connection

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message
- `PUT /api/messages/read/:userId` - Mark as read

## Socket Events

### Client → Server
- `update_location` - Update user location
- `set_discoverable` - Toggle discoverability
- `send_connection_request` - Send connection request
- `accept_connection` - Accept connection
- `reject_connection` - Reject connection
- `send_message` - Send message
- `typing` - User typing
- `stop_typing` - User stopped typing
- `mark_as_read` - Mark messages as read

### Server → Client
- `user_online` - User came online
- `user_offline` - User went offline
- `connection_request` - New connection request
- `connection_accepted` - Connection accepted
- `connection_rejected` - Connection rejected
- `receive_message` - New message received
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `messages_read` - Messages marked as read

## Future Enhancements

- Voice/Video calls (WebRTC)
- Push notifications
- Bluetooth/Wi-Fi Direct discovery (native apps)
- File sharing
- QR code connections
- Background location updates
- Message reactions
- Group chats

## License

MIT