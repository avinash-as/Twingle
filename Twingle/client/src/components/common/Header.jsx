import { Menu, X, Sun, Moon, LogOut, User } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const Header = ({ title, showBack = false, onBack, actions }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  
  const isDark = useMemo(() => document.documentElement.classList.contains('dark'), []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
    setShowMenu(false);
  }, [logout, navigate]);

  const handleDarkModeToggle = useCallback(() => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  }, []);

  const handleCloseMenu = useCallback(() => setShowMenu(false), []);

  const menuContent = useMemo(() => (
    <>
      <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-dark-900 dark:text-dark-100 truncate">{user?.name}</p>
            <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      <NavLink
        to="/profile"
        onClick={handleCloseMenu}
        className="flex items-center gap-3 px-4 py-3 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700"
      >
        <User className="w-5 h-5" />
        Profile
      </NavLink>
      <button
        onClick={() => { handleCloseMenu(); handleDarkModeToggle(); }}
        className="flex items-center gap-3 w-full px-4 py-3 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 text-left"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </>
  ), [user, isDark, handleCloseMenu, handleDarkModeToggle, handleLogout]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Back"
            >
              <X className="w-5 h-5 text-dark-600 dark:text-dark-400" />
            </button>
          )}
          <h1 className="text-xl font-bold text-dark-900 dark:text-dark-100">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Menu"
            >
              {showMenu ? <X className="w-5 h-5 text-dark-600" /> : <Menu className="w-5 h-5 text-dark-600" />}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={handleCloseMenu} />
                <div className="fixed top-14 right-4 z-50 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 py-2 animate-in">
                  {menuContent}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;