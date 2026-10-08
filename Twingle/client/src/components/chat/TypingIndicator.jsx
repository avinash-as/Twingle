export default function TypingIndicator({ userName }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-neutral-500 text-sm animate-in">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '100ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '200ms' }} />
      </div>
      <span>{userName} is typing...</span>
    </div>
  );
}