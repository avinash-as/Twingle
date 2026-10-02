import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, Users, Plus, Search, Bell as BellIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useConnections } from '../../hooks/useConnections';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import Header from '../../components/common/Header';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ChatsPage = () => {
  const { connections, pendingRequests, loading, refetchConnections, refetchPending, acceptConnection, rejectConnection } = useConnections();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'chats') refetchConnections();
    if (activeTab === 'requests') refetchPending();
  }, [activeTab, refetchConnections, refetchPending]);

  const allChats = connections.map((conn) => ({
    ...conn,
    type: 'chat',
  }));

  const allRequests = pendingRequests.map((req) => ({
    ...req,
    type: 'request',
    user: req.sender,
  }));

  const filteredChats = allChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Header 
        title={activeTab === 'chats' ? 'Chats' : 'Requests'} 
        showBack={false}
        actions={
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Plus className="w-5 h-5" />
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto">
        {/* Search Bar */}
        <div className="px-4 py-4 border-b border-dark-200 dark:border-dark-700 sticky top-14 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-2xl text-dark-900 dark:text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 px-4 py-3 border-b border-dark-200 dark:border-dark-700 sticky top-[70px] bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl z-10">
          <button
            onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'chats'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chats
              {connections.length > 0 && (
                <Badge variant={activeTab === 'chats' ? 'gray' : 'info'} className="ml-1" size="sm">
                  {connections.length}
                </Badge>
              )}
            </span>
          </button>
          
          <button
            onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'requests'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-500 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant={activeTab === 'requests' ? 'gray' : 'danger'} size="sm">
                  {pendingRequests.length}
                </Badge>
              )}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3 pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : activeTab === 'chats' ? (
            filteredChats.length === 0 ? (
              searchQuery ? (
                <EmptyState
                  icon={Search}
                  title="No matches found"
                  description="Try a different search term"
                />
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Connect with people nearby to start chatting"
                  action={
                    <NavLink to="/" className="btn-primary">
                      <Search className="w-4 h-4 mr-2" />
                      Start scanning
                    </NavLink>
                  }
                />
              )
            ) : (
              filteredChats.map((chat) => (
                <NavLink
                  key={chat.id}
                  to={`/chats/${chat.id}`}
                  className="block"
                >
                  <Card className="p-4 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 group">
                    <div className="flex items-center gap-4">
                      <Avatar src={chat.avatar} name={chat.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-dark-900 dark:text-dark-100 truncate">
                            {chat.name}
                          </h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-dark-500 dark:text-dark-400 whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-sm text-dark-500 dark:text-dark-400 truncate mt-1 group-hover:text-dark-600 dark:group-hover:text-dark-300 transition-colors">
                            {chat.lastMessage.sender === user?._id ? (
                              <span className="font-medium text-dark-600 dark:text-dark-300">You: </span>
                            ) : ''}
                            {chat.lastMessage.message}
                          </p>
                        )}
                        {!chat.lastMessage && (
                          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                            No messages yet. Say hello!
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge variant="success" className="ml-2 animate-pulse">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </NavLink>
              ))
            )
          ) : (
            allRequests.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No pending requests"
                description="When someone wants to connect with you, it will appear here"
              />
            ) : (
              allRequests.map((req) => (
                <Card key={req.connectionId} className="p-4 animate-in">
                  <div className="flex items-center gap-4">
                    <Avatar src={req.user.avatar} name={req.user.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark-900 dark:text-dark-100">
                        {req.user.name}
                      </h3>
                      {req.user.bio && (
                        <p className="text-sm text-dark-500 dark:text-dark-400 truncate mt-1">
                          {req.user.bio}
                        </p>
                      )}
                      <p className="text-xs text-dark-500 dark:text-dark-400 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                        Wants to connect
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectConnection(req.connectionId)}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => acceptConnection(req.connectionId)}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-xl transition-all shadow-lg shadow-primary-500/25"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;