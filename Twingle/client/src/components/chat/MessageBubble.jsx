import { formatDistanceToNow } from 'date-fns';
import { CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, isOwn, user }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in`}>
      <div className={`max-w-[75%] ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary-400">{user?.name || 'User'}</span>
          </div>
        )}
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-tr-md'
              : 'bg-neutral-800/50 text-white rounded-tl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${isOwn ? 'text-primary-100' : 'text-neutral-500'}`}>
            <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
            {isOwn && message.isRead && (
              <CheckCheck className="w-3.5 h-3.5 text-green-400" />
            )}
            {isOwn && !message.isRead && (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}