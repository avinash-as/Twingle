import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import Button from '../ui/Button';

export default function ChatInput({ onSend, disabled, placeholder = 'Type a message...' }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-neutral-900/50 border-t border-neutral-800">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 pr-12 rounded-2xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none transition-all duration-200 disabled:opacity-50"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button type="button" className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={disabled}
        disabled={!message.trim() || disabled}
        className="h-12 min-w-[48px]"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
}