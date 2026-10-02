import { forwardRef, memo } from 'react';

const Input = memo(forwardRef(({ 
  label, 
  error, 
  className = '', 
  id, 
  icon, 
  trailing, 
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasIcon = !!icon;
  const hasTrailing = !!trailing;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-2xl border px-4 py-3.5 text-dark-900 placeholder-dark-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
            hasIcon ? 'pl-12' : ''
          } ${hasTrailing ? 'pr-12' : ''} ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-dark-300 bg-white focus:border-primary-500 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 dark:placeholder-dark-500 dark:focus:border-primary-400'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {trailing && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';

export default Input;