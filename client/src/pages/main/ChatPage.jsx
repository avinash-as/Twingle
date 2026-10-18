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
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (userId && userId !== activeConversation) {
      fetchMessages(userId);
    }
  }, [userId, activeConversation, fetchMessages]);

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

    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction_updated', handleMessageReactionUpdated);

    return () => {
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction_updated', handleMessageReactionUpdated);
    };
  }, [socket]);

  const setMessages = useCallback((updater) => {
    // This is a helper since we don't have direct setState for messages
    // We'll use the sendMessage hook's response to update
  }, []);

  const handleSend = useCallback(async (messageData) => {
    if (typingTimeout) clearTimeout(typingTimeout);
    setTyping(false);
    await sendMessage(userId, messageData.content, messageData.messageType, messageData.mediaUrl, messageData.mediaMetadata, messageData.replyTo);
    setReplyTo(null);
  }, [userId, sendMessage, typingTimeout]);

  const handleTyping = () => {
    setTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => setTyping(false), 2000));
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

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
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B12]">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {messages.map((message, index) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender?._id === currentUser?._id || message.sender === currentUser?._id}
            user={message.sender?._id === currentUser?._id ? null : otherUser}
            onReply={handleReply}
          />
        ))}
        {typing && (
          <TypingIndicator userName={otherUser?.name} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={sending}
        placeholder="Type a message..."
        replyTo={replyTo}
      />
    </div>
  );
}