import { MapPin, UserCheck, Clock, Send, MessageSquare, Sparkles, Wifi } from 'lucide-react';
import { memo, useCallback } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

const UserCard = memo(({ user, onConnect, connectingId, loading }) => {
  const handleConnect = useCallback(() => onConnect(user.id), [onConnect, user.id]);
  
  const isConnecting = connectingId === user.id;
  
  return (
    <div className="card-interactive p-4">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatar} name={user.name} size="lg" status={user.isOnline ? 'online' : 'offline'} className="flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-white truncate">{user.name}</h4>
            {user.isOnline && (
              <Badge variant="success" size="sm" className="gap-1" dot pulse>
                Available
              </Badge>
            )}
          </div>
          
          {user.bio && (
            <p className="text-sm text-neutral-400 mb-2 truncate">{user.bio}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {user.distanceFormatted || `${user.distance}m`}
            </span>
            {user.lastSeen && !user.isOnline && (
              <span className="flex items-center gap-1.5">
                <Wifi className="w-4 h-4" />
                {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Button
            variant={connectingId === user.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onConnect(user.id)}
            disabled={connectingId === user.id || loading}
            loading={connectingId === user.id}
            className="w-[110px]"
            fullWidth
          >
            {connectingId === user.id ? (
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
            className="w-[110px] text-primary-400 hover:bg-primary-500/10"
            onClick={() => onConnect(user.id)}
            disabled={loading}
            fullWidth
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Message</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';

const EmptyState = memo(() => (
  <div className="text-center py-16 animate-in">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center animate-float">
      <MapPin className="w-12 h-12 text-primary-500 dark:text-primary-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">No one nearby yet</h3>
    <p className="text-neutral-500 mb-8 max-w-xs mx-auto leading-relaxed">
      Move around or try scanning again to find people near you
    </p>
    <div className="flex items-center justify-center gap-2 text-sm text-primary-400">
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
    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 animate-in">
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