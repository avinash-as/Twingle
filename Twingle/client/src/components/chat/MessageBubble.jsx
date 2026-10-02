import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import Avatar from '../ui/Avatar';

const MessageBubble = ({ message, currentUserId, showAvatar = false }) => {
  const isOwn = message.sender._id === currentUserId;
  const senderName = message.sender.name;

  return (
    <div 
      className={`flex gap-2 animate-in ${isOwn ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: '0.05s' }}
    >
      {!isOwn && showAvatar && (
        <Avatar src={message.sender.avatar} name={senderName} size="sm" className="flex-shrink-0" />
      )}
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
      
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-br-lg shadow-lg shadow-primary-500/25'
            : 'bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 rounded-bl-lg shadow-sm border border-dark-200 dark:border-dark-700'
        }`}
      >
        {!isOwn && showAvatar && (
          <p className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-1">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
        <div className={`flex items-center gap-1.5 mt-2 text-xs ${
          isOwn ? 'text-primary-100 justify-end' : 'text-dark-400 dark:text-dark-500'
        }`}>
          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
          {isOwn && (
            <>
              {message.read ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4 opacity-60" />
              )}
            </>
          )}
        </div>
      </div>
      
      {isOwn && <div className="w-8 flex-shrink-0" />}
    </div>
  );
};

export default MessageBubble;