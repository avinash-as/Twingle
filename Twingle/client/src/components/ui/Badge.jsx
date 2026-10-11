export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    outline: 'bg-transparent border-neutral-700 text-neutral-400',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dot === 'success' ? 'bg-green-400' : dot === 'danger' ? 'bg-red-400' : dot === 'warning' ? 'bg-yellow-400' : 'bg-primary-400'} ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      {children}
    </span>
  );
}