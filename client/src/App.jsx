import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import ScanPage from './pages/main/ScanPage';
import ChatsPage from './pages/main/ChatsPage';
import ChatPage from './pages/main/ChatPage';
import ProfilePage from './pages/main/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { useState } from 'react';
import { Radar, MessageSquare, Users, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B12]">
      <Header onMenuClick={() => setMenuOpen(!menuOpen)} />
      <div className="flex-1 flex flex-col pt-16 pb-20 lg:pb-0">
        <Outlet />
      </div>
      <BottomNav />
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 right-4 w-56 card animate-in">
            <nav className="p-2 space-y-1">
              <NavLink to="/scan" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-neutral-300" onClick={() => setMenuOpen(false)}>
                <Radar className="w-5 h-5" />
                Scan
              </NavLink>
              <NavLink to="/chats" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-neutral-300" onClick={() => setMenuOpen(false)}>
                <MessageSquare className="w-5 h-5" />
                Chats
              </NavLink>
              <NavLink to="/connections" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-neutral-300" onClick={() => setMenuOpen(false)}>
                <Users className="w-5 h-5" />
                Connections
              </NavLink>
              <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-neutral-300" onClick={() => setMenuOpen(false)}>
                <User className="w-5 h-5" />
                Profile
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chat/:userId" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/connections" element={<div className="flex-1 flex items-center justify-center text-neutral-500">Connections page - Coming soon</div>} />
      </Route>

      <Route path="/" element={<Navigate to="/scan" replace />} />
      <Route path="*" element={<Navigate to="/scan" replace />} />
    </Routes>
  );
}

export default App;