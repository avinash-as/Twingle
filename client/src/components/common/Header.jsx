import { Menu, X, Bell, MessageSquare, User, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function Header({ onMenuClick }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#08090A]/80 backdrop-blur-md border-b border-neutral-800/50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <img src="/icons/icon-192x192.png" alt="Twingle" className="w-8 h-8 rounded-xl object-contain" />
              <span className="font-bold text-xl gradient-text hidden sm:block">Twingle</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>

                <div className="relative">
                  <Button variant="ghost" size="sm" onClick={() => setShowProfileMenu(!showProfileMenu)} className="gap-2 px-3">
                    <Menu className="w-6 h-6" />
                  </Button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-60 card z-20 animate-in">
                        <div className="p-2 border-b border-neutral-800">
                          <div className="flex items-center gap-3 px-2 py-2">
                            <Avatar src={user?.avatar} name={user?.name} size="md" status={user?.isOnline ? 'online' : 'offline'} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{user?.name}</p>
                              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <nav className="p-2 space-y-1">
                          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-neutral-300" onClick={() => { setShowProfileMenu(false); window.location.href = '/profile'; }}>
                            <User className="w-5 h-5" /> Profile
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-neutral-300" onClick={() => { setShowProfileMenu(false); }}>
                            <Settings className="w-5 h-5" /> Settings
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800/50 text-red-400" onClick={() => { setShowProfileMenu(false); logout(); }}>
                            <LogOut className="w-5 h-5" /> Logout
                          </button>
                        </nav>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}