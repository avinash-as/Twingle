import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Smile, X, Mic, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';

export default function ChatInput({ onSend, disabled, placeholder = 'Type a message...', replyTo }) {
  const [message, setMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(replyTo || null);
  const [messageType, setMessageType] = useState('text');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!message.trim() && messageType === 'text') || disabled) return;

    onSend({
      content: message.trim(),
      messageType,
      replyTo: replyToMessage?._id || replyToMessage,
    });
    setMessage('');
    setReplyToMessage(null);
    setMessageType('text');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearReply = () => setReplyToMessage(null);

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-neutral-900/50 border-t border-neutral-800">
      {replyToMessage && (
        <div className="flex-1 bg-neutral-800/50 border border-neutral-700 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-neutral-400">Replying to</span>
            <button
              onClick={clearReply}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded hover:text-red-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary-400 truncate max-w-[150px]">
              {replyToMessage.sender?.name || 'User'}
            </span>
            <span className="text-xs text-neutral-500 truncate max-w-[200px]">
              {replyToMessage.content || replyToMessage.mediaType || 'Media'}
            </span>
          </div>
        </div>
      )}
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
          <button
            type="button"
            onClick={() => setMessageType('text')}
            className={`p-2 rounded ${messageType === 'text' ? 'bg-primary-500/20 text-primary-400' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="Text"
          >
            <span className="text-xs">A</span>
          </button>
          <button
            type="button"
            onClick={() => setMessageType('voice')}
            className={`p-2 rounded ${messageType === 'voice' ? 'bg-primary-500/20 text-primary-400' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="Voice Message"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="File"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={disabled}
        disabled={!message.trim() && messageType === 'text' || disabled}
        className="h-12 min-w-[48px]"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
}