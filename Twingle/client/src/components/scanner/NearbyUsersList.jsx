import { MapPin, UserCheck, Clock, Send, MessageSquare, Sparkles } from 'lucide-react';
import { memo, useCallback } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

const UserCard = memo(({ user, onConnect, connectingId, loading }) => {
  const handleConnect = useCallback(() => onConnect(user.id), [onConnect, user.id]);
  
  const isConnecting = connectingId === user.id;
  
  return (
    <div className="card-elevated p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatar} name={user.name} size="lg" className="flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-semibold text-dark-900 dark:text-dark-100 truncate">{user.name}</h4>
            {user.isOnline && (
              <Badge variant="success" className="gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Available
              </Badge>
            )}
          </div>
          
          {user.bio && (
            <p className="text-sm text-dark-600 dark:text-dark-400 mb-2 truncate line-clamp-1">{user.bio}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {user.distanceFormatted || `${user.distance}m`}
            </span>
            {user.lastSeen && !user.isOnline && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Button
            variant={isConnecting ? 'primary' : 'outline'}
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting || loading}
            loading={isConnecting}
            className="w-[110px]"
          >
            {isConnecting ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Connect
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-[110px] text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={handleConnect}
            disabled={loading}
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        </div>
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';

const EmptyState = memo(() => (
  <div className="text-center py-12 animate-in">
    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center">
      <MapPin className="w-10 h-10 text-primary-500 dark:text-primary-400" />
    </div>
    <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-100 mb-2">No one nearby yet</h3>
    <p className="text-dark-500 dark:text-dark-400 mb-6 max-w-xs mx-auto">
      Move around or try scanning again to find people near you
    </p>
    <div className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400">
      <Sparkles className="w-4 h-4 animate-pulse" />
      <span>Waiting for discoverable users...</span>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

const NearbyUsersList = ({ users, onConnect, connectingId, loading }) => {
  const handleConnect = useCallback((id) => onConnect(id), [onConnect]);
  
  if (!users.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 animate-in">
      {users.map((user, index) => (
        <UserCard
          key={user.id}
          user={user}
          onConnect={handleConnect}
          connectingId={connectingId}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default NearbyUsersList;