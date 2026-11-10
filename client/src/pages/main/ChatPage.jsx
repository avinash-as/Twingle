import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, CheckCheck, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ChatPage() {
  const { user: currentUser } = useAuth();
  const { socket, emit } = useSocket();
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    messages,
    loading,
    sending,
    activeConversation,
    fetchMessages,
    sendMessage,
    markAsRead,
    clearActiveConversation,
  } = useChat();
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userId && userId !== activeConversation) {
      fetchMessages(userId);
    }
  }, [userId, activeConversation, fetchMessages]);

  // Adjust layout for mobile virtual keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewportHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeConversation) {
      markAsRead(activeConversation);
    }
    return () => clearActiveConversation();
  }, [activeConversation, markAsRead, clearActiveConversation]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleMessageEdited = (message) => {
      setMessages((prev) => prev.map((m) =>
        m._id === message._id ? message : m
      ));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
      ));
    };

    const handleMessageReactionUpdated = ({ messageId, reactions, userId, emoji, action }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      ));
    };

    const handleUserTyping = (data) => {
      if (data.userId === userId) setOtherTyping(true);
    };
    const handleUserStopTyping = (data) => {
      if (data.userId === userId) setOtherTyping(false);
    };

    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction_updated', handleMessageReactionUpdated);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction_updated', handleMessageReactionUpdated);
  socket.off('user_typing', handleUserTyping);
  socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket]);

  const setMessages = useCallback((updater) => {
    // This is a helper since we don't have direct setState for messages
    // We'll use the sendMessage hook's response to update
  }, []);

  const handleSend = useCallback(async (messageData) => {
    if (typingTimeout) clearTimeout(typingTimeout);
    setTyping(false);
    emit('stop_typing', { receiverId: userId });
    await sendMessage(userId, messageData.content, messageData.messageType, messageData.mediaUrl, messageData.mediaMetadata, messageData.replyTo);
    setReplyTo(null);
  }, [userId, sendMessage, typingTimeout, emit]);

  const handleTyping = () => {
    setTyping(true);
    emit('typing', { receiverId: userId });
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      setTyping(false);
      emit('stop_typing', { receiverId: userId });
    }, 2000));
  };

  const handleStopTyping = () => {
    setTyping(false);
    if (typingTimeout) clearTimeout(typingTimeout);
    emit('stop_typing', { receiverId: userId });
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const otherUser = messages[0]?.sender?._id === currentUser?._id ? messages[0]?.receiver : messages[0]?.sender;

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0B12]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!otherUser && messages.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Start a conversation"
        description="Send a message to break the ice"
        action={<Button variant="primary" size="sm" onClick={() => navigate('/scan')}>Find People Nearby</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col bg-[#0B0B12]" style={{ height: viewportHeight || '100%' }}>
      <header className="flex items-center gap-3 px-4 py-3 bg-[#0B0B12]/95 backdrop-blur-md border-b border-neutral-800/50 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar src={otherUser?.avatar} name={otherUser?.name} size="md" status={otherUser?.isOnline ? 'online' : 'offline'} />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white truncate">{otherUser?.name}</h2>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            {otherUser?.isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                Last seen {formatDistanceToNow(new Date(otherUser?.lastSeen), { addSuffix: true })}
              </>
            )}
          </p>
        </div>
        <button className="p-2 rounded-xl bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      <div className="px-4 py-2 border-b border-neutral-800/50">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 text-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {filteredMessages.map((message, index) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender?._id === currentUser?._id || message.sender === currentUser?._id}
            user={message.sender?._id === currentUser?._id ? null : otherUser}
            onReply={handleReply}
          />
        ))}
        {otherTyping && (
          <TypingIndicator userName={otherUser?.name} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={sending}
        placeholder="Type a message..."
        replyTo={replyTo}
        onTyping={handleTyping}
      />
    </div>
  );
}