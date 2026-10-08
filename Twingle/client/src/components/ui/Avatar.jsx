import { User } from 'lucide-react';

export default function Avatar({ src, name, size = 'md', status, className = '', ...props }) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const statusClasses = {
    online: 'bg-green-400',
    offline: 'bg-neutral-500',
    away: 'bg-yellow-400',
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-flex ${className}`} {...props}>
      <div className={`relative rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 ${sizeClasses[size]}`}>
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500">
            <User className={`text-white ${sizeClasses[size].replace('text-', '')}`} />
          </div>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#0B0B12] ${statusSizeClasses[size]} ${statusClasses[status]}`}
        />
      )}
    </div>
  );
}