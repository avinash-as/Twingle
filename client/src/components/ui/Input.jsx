import { useId } from 'react';

export default function Input({
  label,
  type = 'text',
  error,
  className = '',
  id: providedId,
  leftIcon,
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`w-full py-3.5 rounded-xl bg-neutral-900/50 border text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${
            leftIcon ? 'pl-12' : 'px-4'
          } ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-neutral-700 focus:border-primary-500'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}