import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1800);
    const t2 = setTimeout(() => onFinish && onFinish(), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0B12] transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-2xl animate-glow-pulse">
        <span className="text-4xl font-extrabold text-white">T</span>
      </div>
      <h1 className="mt-6 text-3xl font-extrabold gradient-text">Twingle</h1>
      <p className="mt-2 text-neutral-500 text-sm">Discover people nearby</p>
      <div className="mt-8 flex gap-2">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
