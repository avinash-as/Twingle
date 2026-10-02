import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import BottomNav from './components/common/BottomNav';
import Header from './components/common/Header';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ScanPage from './pages/main/ScanPage';
import ChatsPage from './pages/main/ChatsPage';
import ChatPage from './pages/main/ChatPage';
import ProfilePage from './pages/main/ProfilePage';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes with layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<ScanPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/chats/:userId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        {/* Redirect root to scan */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="Twingle" />
      <main className="flex-1 overflow-auto pt-4 pb-24 px-4">
        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/chats/:userId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;