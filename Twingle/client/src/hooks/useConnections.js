import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useConnections() {
  const { user, updateUser } = useAuth();
  const { emit, on, off } = useSocket();
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const response = await api.get('/users/connected');
      setConnections(response.data);
    } catch (error) {
      console.error('Fetch connections error:', error);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await api.get('/connections/pending');
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
    }
  }, []);

  const sendConnectionRequest = useCallback(async (receiverId) => {
    try {
      emit('send_connection_request', { receiverId });
    } catch (error) {
      console.error('Send connection request error:', error);
      throw error;
    }
  }, [emit]);

  const acceptConnection = useCallback(async (connectionId) => {
    try {
      emit('accept_connection', { connectionId });
      await api.put(`/connections/accept/${connectionId}`);
      fetchConnections();
      fetchPendingRequests();
    } catch (error) {
      console.error('Accept connection error:', error);
      throw error;
    }
  }, [emit, fetchConnections, fetchPendingRequests]);

  const rejectConnection = useCallback(async (connectionId) => {
    try {
      emit('reject_connection', { connectionId });
      await api.put(`/connections/reject/${connectionId}`);
      fetchPendingRequests();
    } catch (error) {
      console.error('Reject connection error:', error);
      throw error;
    }
  }, [emit, fetchPendingRequests]);

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();

    const handleConnectionRequest = (data) => {
      setPendingRequests((prev) => [...prev, data]);
    };

    const handleConnectionAccepted = (data) => {
      setConnections((prev) => [...prev, data.receiver]);
      setPendingRequests((prev) => prev.filter((c) => c.connectionId !== data.connectionId));
    };

    const handleConnectionRejected = (data) => {
      setPendingRequests((prev) => prev.filter((c) => c.connectionId !== data.connectionId));
    };

    on('connection_request', handleConnectionRequest);
    on('connection_accepted', handleConnectionAccepted);
    on('connection_rejected', handleConnectionRejected);

    return () => {
      off('connection_request', handleConnectionRequest);
      off('connection_accepted', handleConnectionAccepted);
      off('connection_rejected', handleConnectionRejected);
    };
  }, [fetchConnections, fetchPendingRequests, on, off]);

  useEffect(() => {
    setLoading(false);
  }, []);

  return {
    connections,
    pendingRequests,
    loading,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    refetchConnections: fetchConnections,
    refetchPending: fetchPendingRequests,
  };
}