export default function Card({ children, className = '', interactive = false, ...props }) {
  const baseClasses = 'bg-neutral-900/50 backdrop-blur-sm rounded-2xl border shadow-xl';
  
  const interactiveClasses = interactive
    ? 'transition-all duration-300 hover:border-primary-500/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)] hover:-translate-y-0.5 cursor-pointer'
    : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}