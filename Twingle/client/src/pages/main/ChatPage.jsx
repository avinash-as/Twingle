import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Mic, Smile, MoreVertical, Check, CheckCheck, UserCheck, WifiOff, Image, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/common/Header';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ChatPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    messages,
    loading,
    sending,
    typingUsers,
    sendMessage,
    handleTyping,
    handleStopTyping,
    handleMarkAsRead,
    messagesEndRef,
    refetch,
  } = useChat(userId);

  const [showMenu, setShowMenu] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    handleMarkAsRead();
  }, [messages, handleMarkAsRead]);

  const otherUser = messages.length > 0 
    ? messages.find(m => m.sender._id !== user?._id)?.sender 
    : null;

  const handleSend = (message) => {
    sendMessage(message);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!otherUser && !userId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-dark-500">Chat not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Header
        title={otherUser?.name || 'Chat'}
        showBack
        onBack={() => navigate('/chats')}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={otherUser?.isOnline ? 'success' : 'gray'} className="gap-1.5">
              {otherUser?.isOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                </>
              )}
            </Badge>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5 text-dark-600" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="fixed top-14 right-4 z-50 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-200 dark:border-dark-700 py-2 animate-in">
                    <button
                      onClick={() => { setShowMenu(false); navigate(`/profile/${otherUser?.id}`); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-700 text-left"
                    >
                      <UserCheck className="w-5 h-5" />
                      View Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-medium text-dark-900 dark:text-dark-100 mb-1">No messages yet</h3>
              <p className="text-dark-500 dark:text-dark-400 max-w-xs">
                Say hello to {otherUser?.name || 'your new connection'}!
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                currentUserId={user?._id}
                showAvatar={index === 0 || messages[index - 1]?.sender._id !== message.sender._id}
              />
            ))
          )}
          
          {typingUsers.size > 0 && (
            <TypingIndicator userName={otherUser?.name || 'Someone'} />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          disabled={sending}
          placeholder={`Message ${otherUser?.name || ''}`}
        />
      </div>
    </div>
  );
};

export default ChatPage;