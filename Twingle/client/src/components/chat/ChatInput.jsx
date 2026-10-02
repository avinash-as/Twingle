import { useRef, useState, useEffect } from 'react';
import { Send, Paperclip, Mic, Smile, Image, FileText } from 'lucide-react';
import Button from '../ui/Button';

const ChatInput = ({ onSend, onTyping, onStopTyping, disabled, placeholder = 'Type a message...' }) => {
  const [message, setMessage] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    onTyping?.();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.();
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
    onStopTyping?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-dark-200 dark:border-dark-700 p-4 bg-white/50 dark:bg-dark-900/50 backdrop-blur-sm">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-4 py-3 pr-14 bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-2xl text-dark-900 dark:text-dark-100 placeholder-dark-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[48px] max-h-[140px] transition-all duration-200"
              rows={1}
              aria-label="Message"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className="p-2 rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors text-dark-500 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Attachments"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors text-dark-500"
                aria-label="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors text-dark-500"
                aria-label="Voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {showAttachments && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white dark:bg-dark-800 rounded-2xl border border-dark-200 dark:border-dark-700 shadow-lg animate-in">
              <div className="flex gap-2">
                <button className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors text-dark-600 dark:text-dark-300">
                  <Image className="w-6 h-6" />
                  <span className="text-xs font-medium">Photo</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors text-dark-600 dark:text-dark-300">
                  <FileText className="w-6 h-6" />
                  <span className="text-xs font-medium">File</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors text-dark-600 dark:text-dark-300">
                  <Mic className="w-6 h-6" />
                  <span className="text-xs font-medium">Audio</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant="primary"
          size="xl"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          aria-label="Send message"
          className="h-12 w-12 flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;