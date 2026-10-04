import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Search, Sparkles, Users, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ConversationItem = ({ conversation, onClick, active }) => {
  const { user, lastMessage, unreadCount } = conversation;
  const isOnline = user.isOnline;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
        active
          ? 'bg-primary-500/10 border border-primary-500/20'
          : 'hover:bg-neutral-800/50'
      }`}
    >
      <Avatar src={user.avatar} name={user.name} size="lg" status={isOnline ? 'online' : 'offline'} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-white truncate">{user.name}</h4>
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            {lastMessage && formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400 truncate flex-1">
            {lastMessage ? (
              <span className="flex items-center gap-1">
                {lastMessage.sender.toString() === user.id ? '' : <span className="text-primary-400">You: </span>}
                {lastMessage.content}
              </span>
            ) : (
              'No messages yet'
            )}
          </p>
          {unreadCount > 0 && (
            <Badge variant="danger" size="sm" dot>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};

export default function ChatsPage() {
  const { user } = useAuth();
  const { conversations, loading, fetchConversations, fetchMessages, activeConversation, markAsRead } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((c) =>
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation) => {
    fetchMessages(conversation.user.id);
    markAsRead(conversation.user.id);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B12]">
      <div className="p-4 space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <NavLink to="/connections">
            <Button variant="ghost" size="sm">
              <Users className="w-5 h-5" />
            </Button>
          </NavLink>
        </div>

        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </div>

      <div className="flex-1 overflow-y-auto animate-in">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={searchQuery ? 'No conversations found' : 'No conversations yet'}
            description={searchQuery
              ? 'Try a different search term'
              : 'Connect with people to start chatting'}
            action="Start scanning to meet new people"
          />
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.user.id}
                conversation={conversation}
                active={activeConversation === conversation.user.id}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}