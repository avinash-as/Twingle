import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export function useChat() {
  const { emit, on, off } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data);
      setActiveConversation(userId);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      setConversations((prev) => {
        const existing = prev.find((c) => c.user.id === message.sender._id || c.user.id === message.receiver._id);
        if (existing) {
          return prev.map((c) =>
            c.user.id === existing.user.id
              ? { ...c, lastMessage: message, unreadCount: c.unreadCount + 1 }
              : c
          );
        }
        return prev;
      });
    };

    const handleMessagesRead = (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === data.userId && m.receiver === activeConversation ? { ...m, isRead: true } : m
        )
      );
    };

    on('receive_message', handleReceiveMessage);
    on('messages_read', handleMessagesRead);

    return () => {
      off('receive_message', handleReceiveMessage);
      off('messages_read', handleMessagesRead);
    };
  }, [on, off, fetchConversations, activeConversation]);

  const sendMessage = useCallback(async (receiverId, content) => {
    setSending(true);
    try {
      const response = await api.post('/messages', { receiverId, content });
      return response.data;
    } finally {
      setSending(false);
    }
  }, []);

  const markAsRead = useCallback(async (userId) => {
    try {
      await api.put(`/messages/read/${userId}`);
      setMessages((prev) =>
        prev.map((m) => (m.sender === userId ? { ...m, isRead: true } : m))
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }, []);

  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    sending,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    setActiveConversation,
    clearActiveConversation,
  };
}