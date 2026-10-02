import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, User, ScanSearch } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { path: '/', icon: Home, activeIcon: ScanSearch, label: 'Scan' },
    { path: '/chats', icon: MessageSquare, activeIcon: MessageSquare, label: 'Chats' },
    { path: '/profile', icon: User, activeIcon: User, label: 'Me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm border-t border-dark-200 dark:border-dark-700 safe-area-bottom">
      <div className="flex justify-around py-2">
        {navItems.map(({ path, icon: Icon, activeIcon: ActiveIcon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800'
              }`
            }
            aria-label={label}
          >
            {({ isActive }) => {
              const CurrentIcon = isActive ? ActiveIcon : Icon;
              return (
                <>
                  <span className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-dark-500'}>
                    <CurrentIcon className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-medium">{label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;