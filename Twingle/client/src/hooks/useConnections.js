import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export function useConnections() {
  const { emit, on, off } = useSocket();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await api.get('/connections/pending');
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();

    const handleConnectionRequest = (data) => {
      setPendingRequests((prev) => [
        ...prev,
        {
          connectionId: data.connectionId,
          sender: data.sender,
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    const handleConnectionAccepted = (data) => {
      setPendingRequests((prev) => prev.filter((r) => r.connectionId !== data.connectionId));
    };

    const handleConnectionRejected = (data) => {
      setPendingRequests((prev) => prev.filter((r) => r.connectionId !== data.connectionId));
    };

    on('connection_request', handleConnectionRequest);
    on('connection_accepted', handleConnectionAccepted);
    on('connection_rejected', handleConnectionRejected);

    return () => {
      off('connection_request', handleConnectionRequest);
      off('connection_accepted', handleConnectionAccepted);
      off('connection_rejected', handleConnectionRejected);
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
      fetchPendingRequests();
      return response.data;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingRequests]);

  const rejectConnection = useCallback(async (connectionId) => {
    setLoading(true);
    try {
      const response = await api.put(`/connections/reject/${connectionId}`);
      fetchPendingRequests();
      return response.data;
    } finally {
      setLoading(false);
    }
  }, [fetchPendingRequests]);

  return {
    pendingRequests,
    loading,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    fetchPendingRequests,
  };
}