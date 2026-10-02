import { useState, useEffect, useCallback, memo } from 'react';
import { X, MapPin, UserCheck, MessageSquare, Send, Wifi, WifiOff } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

const OnlineIndicator = memo(({ isOnline }) => (
  <Badge 
    variant={isOnline ? 'success' : 'gray'} 
    className="gap-1.5 text-sm px-3 py-1.5"
  >
    {isOnline ? (
      <>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Available Now
      </>
    ) : (
      <>
        <WifiOff className="w-3.5 h-3.5" />
        Away
      </>
    )}
  </Badge>
));

const DistanceBadge = memo(({ distance, distanceFormatted }) => (
  <Badge variant="info" className="gap-1.5 text-sm px-3 py-1.5">
    <MapPin className="w-3.5 h-3.5" />
    {distanceFormatted || `${distance}m away`}
  </Badge>
));

const LastSeenText = memo(({ lastSeen }) => (
  <p className="text-xs text-dark-500 dark:text-dark-400 flex items-center gap-1">
    <Wifi className="w-3 h-3" />
    Last seen {formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}
  </p>
));

const ActionButtons = memo(({ onConnect, onClose, connecting, user }) => (
  <div className="grid grid-cols-2 gap-3 pt-2">
    <Button
      variant="primary"
      onClick={() => onConnect(user.id)}
      disabled={connecting}
      loading={connecting}
      className="h-12"
    >
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5" />
        {connecting ? 'Connecting...' : 'Connect'}
      </div>
    </Button>
    <Button
      variant="secondary"
      onClick={onClose}
      className="h-12"
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Message
      </div>
    </Button>
  </div>
));

const ProfilePreview = ({ user, onClose, onConnect, connecting, loading }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!user) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
    >
      <div 
        className={`w-full max-w-md bg-white dark:bg-dark-900 rounded-3xl shadow-2xl overflow-hidden animate-in ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-200 dark:border-dark-700">
          <h2 id="profile-title" className="font-semibold text-dark-900 dark:text-dark-100">Profile</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar src={user.avatar} name={user.name} size="3xl" />
              {user.isOnline && (
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-4 border-white dark:border-dark-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-dark-900 dark:text-dark-100">{user.name}</h3>
              {user.bio && (
                <p className="text-dark-600 dark:text-dark-400 mt-1 max-w-xs">{user.bio}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <OnlineIndicator isOnline={user.isOnline} />
              {user.distance !== undefined && (
                <DistanceBadge distance={user.distance} distanceFormatted={user.distanceFormatted} />
              )}
            </div>

            {user.lastSeen && !user.isOnline && (
              <LastSeenText lastSeen={user.lastSeen} />
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-200 dark:border-dark-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-dark-900 text-dark-500 dark:text-dark-400">Actions</span>
            </div>
          </div>

          <ActionButtons 
            onConnect={onConnect} 
            onClose={handleClose} 
            connecting={connecting} 
            user={user} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePreview;