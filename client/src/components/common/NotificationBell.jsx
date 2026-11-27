import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (!open) {
      markAllRead();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 rounded-full hover:bg-neutral-800/50">
        <Bell className="w-5 h-5 text-neutral-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto card z-20 animate-in">
            <div className="flex items-center justify-between p-3 border-b border-neutral-800">
              <span className="font-semibold text-white">Notifications</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-sm">No notifications yet</div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                    className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-neutral-800/40 ${n.read ? 'opacity-60' : ''}`}
                  >
                    <Avatar src={n.avatar} name={n.title} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-neutral-400 truncate">{n.body}</p>
                      <p className="text-[10px] text-neutral-600 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full mt-2" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}