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
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0B0B12]/80 backdrop-blur-md border-b border-neutral-800/50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
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
                    <Avatar src={user?.avatar} name={user?.name} size="sm" status={user?.isOnline ? 'online' : 'offline'} />
                    <span className="hidden sm:block font-medium">{user?.name}</span>
                  </Button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 card z-20 animate-in">
                        <div className="p-2 border-b border-neutral-800">
                          <div className="flex items-center gap-3 px-2 py-2">
                            <Avatar src={user?.avatar} name={user?.name} size="md" status={user?.isOnline ? 'online' : 'offline'} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{user?.name}</p>
                              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mx-2 mb-2 justify-start gap-2" onClick={() => {}}>
                          <Settings className="w-4 h-4" />
                          Settings
                        </Button>
                        <Button variant="danger" size="sm" className="w-full mx-2 mb-2 justify-start gap-2" onClick={logout}>
                          <LogOut className="w-4 h-4" />
                          Logout
                        </Button>
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