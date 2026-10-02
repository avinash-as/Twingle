import { MessageSquare } from 'lucide-react';

const TypingIndicator = ({ userName }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-dark-500 dark:text-dark-400 animate-in">
      <div className="flex items-center gap-1 bg-dark-100 dark:bg-dark-800 rounded-full px-3 py-1.5">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
        <span className="ml-1 font-medium">{userName}</span>
        <span className="text-dark-500 dark:text-dark-400">is typing</span>
      </div>
    </div>
  );
};

export default TypingIndicator;