import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';

const NotificationsContext = createContext(null);

const STORAGE_KEY = 'twingle_notifications';

export function NotificationsProvider({ children }) {
  const { on, off } = useSocket();
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const persist = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch {}
  };

  const addNotification = useCallback((n) => {
    setNotifications((prev) => {
      const next = [{ id: Date.now() + Math.random(), read: false, createdAt: new Date().toISOString(), ...n }, ...prev].slice(0, 50);
      persist(next);
      return next;
    });
    // Browser notification when tab is hidden
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(n.title || 'Twingle', { body: n.body || '', icon: '/icons/icon-192x192.png' });
      } catch {}
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persist(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleConnectionRequest = (data) => {
      addNotification({
        type: 'connection_request',
        title: 'Connection request',
        body: `${data?.sender?.name || 'Someone'} sent you a connection request.`,
        avatar: data?.sender?.avatar,
        link: '/connections',
      });
    };
    const handleConnectionAccepted = (data) => {
      addNotification({
        type: 'connection_accepted',
        title: 'Connection accepted',
        body: `${data?.receiver?.name || 'Someone'} accepted your connection request.`,
        avatar: data?.receiver?.avatar,
        link: '/matches',
      });
    };
    const handleReceiveMessage = (data) => {
      addNotification({
        type: 'message',
        title: data?.sender?.name || 'New message',
        body: data?.content || 'Sent you a message',
        avatar: data?.sender?.avatar,
        link: `/chat/${data?.sender?._id || data?.sender?.id || ''}`,
      });
    };

    on('connection_request', handleConnectionRequest);
    on('connection_accepted', handleConnectionAccepted);
    on('receive_message', handleReceiveMessage);

    return () => {
      off('connection_request', handleConnectionRequest);
      off('connection_accepted', handleConnectionAccepted);
      off('receive_message', handleReceiveMessage);
    };
  }, [on, off, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}