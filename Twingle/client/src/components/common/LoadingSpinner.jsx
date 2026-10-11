export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`inline-flex ${className}`}>
      <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="text-neutral-700"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
        />
        <circle
          className="text-primary-500"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
          strokeDasharray="31.4"
          strokeDashoffset="0"
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="strokeDasharray"
            values="1, 31.4; 15.7, 15.7; 31.4, 1"
            dur="1.5s"
            repeatCount="indefinite"
            keyTimes="0; 0.5; 1"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
        </circle>
      </svg>
    </div>
  );
}