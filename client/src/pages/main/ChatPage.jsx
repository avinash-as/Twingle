import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
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
  const { userId } = useParams();
  const navigate = useNavigate();
  const { messages, loading, sending, activeConversation, fetchMessages, sendMessage, markAsRead, clearActiveConversation } = useChat();
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

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

  const handleSend = useCallback(async (content) => {
    if (typingTimeout) clearTimeout(typingTimeout);
    setTyping(false);
    await sendMessage(userId, content);
  }, [userId, sendMessage, typingTimeout]);

  const handleTyping = () => {
    setTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => setTyping(false), 2000));
  };

  const otherUser = messages[0]?.sender === currentUser?._id ? messages[0]?.receiver : messages[0]?.sender;

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
        icon={Chat}
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
            isOwn={message.sender === currentUser._id}
            user={message.sender === currentUser._id ? null : otherUser}
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
      />
    </div>
  );
}