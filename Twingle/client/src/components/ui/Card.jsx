import { forwardRef } from 'react';

const Card = forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-dark-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`px-6 py-4 border-b border-dark-200 dark:border-dark-700 ${className}`} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`px-6 py-4 border-t border-dark-200 dark:border-dark-700 ${className}`} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };