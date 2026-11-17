import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from './SocketContext';

const ConnectionsContext = createContext(null);

export function ConnectionsProvider({ children }) {
  const { emit, on, off } = useSocket();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await api.get('/connections/pending');
      setPendingRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();

    const handleConnectionRequest = (data) => {
      console.log('Received connection request:', data);
      setPendingRequests((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        {
          connectionId: data.connectionId,
          sender: data.sender,
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    const handleConnectionAccepted = (data) => {
      setPendingRequests((prev) => (Array.isArray(prev) ? prev.filter((r) => r.connectionId !== data.connectionId) : []));
    };

    const handleConnectionRejected = (data) => {
      setPendingRequests((prev) => (Array.isArray(prev) ? prev.filter((r) => r.connectionId !== data.connectionId) : []));
    };

    on('connection_request', handleConnectionRequest);
    on('connection_accepted', handleConnectionAccepted);
    on('connection_rejected', handleConnectionRejected);

    const onFocus = () => fetchPendingRequests();
    window.addEventListener('focus', onFocus);

    return () => {
      off('connection_request', handleConnectionRequest);
      off('connection_accepted', handleConnectionAccepted);
      off('connection_rejected', handleConnectionRejected);
      window.removeEventListener('focus', onFocus);
    };
  }, [on, off, fetchPendingRequests]);

  const sendConnectionRequest = useCallback(async (receiverId) => {
    setLoading(true);
    try {
      const response = await api.post('/connections/connect', { receiverId });
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptConnection = useCallback(async (connectionId) => {
    setLoading(true);
    try {
      const response = await api.put(`/connections/accept/${connectionId}`);
      setPendingRequests((prev) => (Array.isArray(prev) ? prev.filter((r) => r.connectionId !== connectionId) : []));
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectConnection = useCallback(async (connectionId) => {
    setLoading(true);
    try {
      const response = await api.put(`/connections/reject/${connectionId}`);
      setPendingRequests((prev) => (Array.isArray(prev) ? prev.filter((r) => r.connectionId !== connectionId) : []));
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    pendingRequests,
    loading,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    fetchPendingRequests,
  };

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error('useConnections must be used within ConnectionsProvider');
  return ctx;
}
