import { NavLink } from 'react-router-dom';
import { Radar, MessageSquare, Users, User } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { path: '/scan', icon: Radar, label: 'Scan' },
    { path: '/chats', icon: MessageSquare, label: 'Chats' },
    { path: '/connections', icon: Users, label: 'Connections' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B12]/95 backdrop-blur-md border-t border-neutral-800/50 lg:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path !== '/chats'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive
                  ? 'text-primary-400'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}