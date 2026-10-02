import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useChat(otherUserId) {
  const { user } = useAuth();
  const { emit, on, off } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!otherUserId) return;
    try {
      setLoading(true);
      const response = await api.get(`/messages/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim() || !otherUserId || sending) return;

      setSending(true);
      try {
        emit('send_message', { receiverId: otherUserId, message });
      } catch (error) {
        console.error('Send message error:', error);
      } finally {
        setSending(false);
      }
    },
    [otherUserId, sending, emit]
  );

  const handleTyping = useCallback(() => {
    emit('typing', { receiverId: otherUserId });
  }, [otherUserId, emit]);

  const handleStopTyping = useCallback(() => {
    emit('stop_typing', { receiverId: otherUserId });
  }, [otherUserId, emit]);

  const handleMarkAsRead = useCallback(() => {
    emit('mark_as_read', { senderId: otherUserId });
    api.put(`/messages/read/${otherUserId}`).catch(console.error);
  }, [otherUserId, emit]);

  useEffect(() => {
    fetchMessages();

    const handleReceiveMessage = (data) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
    };

    const handleUserTyping = (data) => {
      if (data.userId === otherUserId) {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.userId === otherUserId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleMessagesRead = (data) => {
      if (data.readerId === otherUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === otherUserId && m.receiver === user?._id ? { ...m, read: true } : m
          )
        );
      }
    };

    on('receive_message', handleReceiveMessage);
    on('user_typing', handleUserTyping);
    on('user_stop_typing', handleUserStopTyping);
    on('messages_read', handleMessagesRead);

    return () => {
      off('receive_message', handleReceiveMessage);
      off('user_typing', handleUserTyping);
      off('user_stop_typing', handleUserStopTyping);
      off('messages_read', handleMessagesRead);
    };
  }, [otherUserId, user, fetchMessages, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messages,
    loading,
    sending,
    typingUsers,
    sendMessage,
    handleTyping,
    handleStopTyping,
    handleMarkAsRead,
    messagesEndRef,
    refetch: fetchMessages,
  };
}