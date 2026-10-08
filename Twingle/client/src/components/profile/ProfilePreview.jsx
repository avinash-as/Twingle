import { X, Send, MessageSquare, MapPin, Clock, Calendar, Share2, QrCode } from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ProfilePreview({ user, onClose, onConnect, connecting }) {
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const shareModal = showShare ? (
    <Fragment>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm animate-in" onClick={() => setShowShare(false)}>
        <div className="w-full max-w-md card animate-in" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
              Share Profile
              <button onClick={() => setShowShare(false)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                <Share2 className="w-6 h-6 text-primary-400" />
                <span className="text-sm font-medium">Share Link</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                <QrCode className="w-6 h-6 text-accent-400" />
                <span className="text-sm font-medium">QR Code</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                <Calendar className="w-6 h-6 text-green-400" />
                <span className="text-sm font-medium">Calendar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in" onClick={onClose}>
      <div className="w-full max-w-md card animate-in relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar src={user.avatar} name={user.name} size="2xl" status={user.isOnline ? 'online' : 'offline'} />
            
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white">{user.name}</h3>
              {user.isOnline && (
                <Badge variant="success" size="md" className="gap-1.5" dot pulse>
                  Online Now
                </Badge>
              )}
            </div>

            {user.bio && (
              <p className="text-neutral-400 max-w-xs">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-500 pt-2 border-t border-neutral-800">
              {user.distanceFormatted && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {user.distanceFormatted}
                </span>
              )}
              {user.lastSeen && !user.isOnline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Last seen {new Date(user.lastSeen).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant={connecting ? 'primary' : 'outline'}
              size="lg"
              onClick={() => onConnect(user.id)}
              disabled={connecting}
              loading={connecting}
              fullWidth
              className="flex-1"
            >
              {connecting ? (
                <>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Connect
                </>
              )}
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => onConnect(user.id)}
              disabled={connecting}
              fullWidth
              className="flex-1"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Message</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={() => setShowShare(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share Profile</span>
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {shareModal}
    </div>
  );
}