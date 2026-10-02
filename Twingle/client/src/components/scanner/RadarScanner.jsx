import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Users, Wifi, UserCheck, Search, Sparkles } from 'lucide-react';

const RadarScanner = ({ scanning, nearbyUsers, scanCount }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const sweepAngleRef = useRef(-Math.PI / 2);
  const ringsRef = useRef([]);
  const particlesRef = useRef([]);
  const lastTimeRef = useRef(0);
  const [foundCount, setFoundCount] = useState(0);
  const ctxRef = useRef(null);
  const dprRef = useRef(1);
  const canvasSizeRef = useRef({ width: 0, height: 0, cx: 0, cy: 0, maxR: 0 });
  const isDarkRef = useRef(false);
  const colorsRef = useRef({});

  // Memoize colors to avoid recalculation
  const colors = useMemo(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      isDark,
      gridColor: isDark ? 'rgba(74, 222, 128, 0.05)' : 'rgba(34, 197, 94, 0.03)',
      primaryColor: isDark ? '#4ade80' : '#22c55e',
      primaryGlow: isDark ? 'rgba(74, 222, 128' : 'rgba(34, 197, 94',
      textColor: isDark ? '#e2e8f0' : '#1e293b',
      mutedColor: isDark ? '#64748b' : '#94a3b8',
      clearColor: scanning ? 'rgba(15, 23, 42, 0.15)' : 'rgba(15, 23, 42, 0.3)',
    };
  }, [scanning]);

  // Update found count with animation - optimized
  useEffect(() => {
    const target = scanCount || 0;
    const duration = 300;
    const start = foundCount;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * progress * (3 - 2 * progress); // smoother easing
      setFoundCount(Math.round(start + (target - start) * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [scanCount, foundCount]);

  // Setup canvas - only run once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true,
      willReadFrequently: false 
    });
    if (!ctx) return;

    ctxRef.current = ctx;
    dprRef.current = window.devicePixelRatio || 1;
    isDarkRef.current = document.documentElement.classList.contains('dark');

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = dprRef.current;
      const width = rect.width;
      const height = rect.height;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) / 2 - 30;
      
      canvasSizeRef.current = { width, height, cx, cy, maxR };
    };
    
    resize();
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Animation loop - optimized
  const drawRadar = useCallback((timestamp) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    const deltaTime = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) : 0;
    lastTimeRef.current = timestamp;
    
    const { cx, cy, maxR } = canvasSizeRef.current;
    const c = colorsRef.current;

    // Clear
    ctx.fillStyle = c.clearColor;
    ctx.fillRect(0, 0, canvasSizeRef.current.width, canvasSizeRef.current.height);

    // Grid circles - batch draw
    ctx.strokeStyle = c.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Crosshairs
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance labels - batch
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = c.mutedColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i;
      const dist = Math.round((r / maxR) * 5000);
      ctx.fillText(`${dist}m`, cx + r + 15, cy);
    }

    // Sweep animation
    if (scanning) {
      const sweepSpeed = 1.5;
      sweepAngleRef.current += sweepSpeed * deltaTime;
      if (sweepAngleRef.current > Math.PI * 3 / 2) {
        sweepAngleRef.current = -Math.PI / 2;
      }

      const angle = sweepAngleRef.current;
      const sweepLength = maxR;

      // Trail arc - single path
      const trailLength = 0.8;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, `${c.primaryGlow}, 0.12)`);
      gradient.addColorStop(0.7, `${c.primaryGlow}, 0.03)`);
      gradient.addColorStop(1, `${c.primaryGlow}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angle - trailLength, angle);
      ctx.closePath();
      ctx.fill();

      // Sweep line
      const x2 = cx + Math.cos(angle) * sweepLength;
      const y2 = cy + Math.sin(angle) * sweepLength;
      
      ctx.strokeStyle = c.primaryColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.shadowColor = c.primaryColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.shadowBlur = 0;
      
      // Gradient line
      const lineGradient = ctx.createLinearGradient(cx, cy, x2, y2);
      lineGradient.addColorStop(0, `${c.primaryGlow}, 0.5)`);
      lineGradient.addColorStop(1, `${c.primaryGlow}, 0)`);
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Rings - filter and update in place
    const rings = ringsRef.current;
    const primaryGlow = c.primaryGlow;
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      if (ring.opacity <= 0) {
        rings.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `${primaryGlow}, ${ring.opacity * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ring.radius += 40 * deltaTime;
      ring.opacity -= 0.5 * deltaTime;
    }

    // Add new rings - limit to prevent buildup
    if (scanning && rings.length < 8 && Math.random() < 0.01) {
      rings.push({ radius: 20, opacity: 1 });
    }

    // Nearby users - batch draw
    if (nearbyUsers.length > 0) {
      const primaryGlow = c.primaryGlow;
      const primaryColor = c.primaryColor;
      const mutedColor = c.mutedColor;
      const textColor = c.textColor;
      const now = timestamp;
      
      nearbyUsers.forEach((user, index) => {
        if (!user.distance) return;
        
        const normalizedDistance = Math.min(user.distance / 5000, 1);
        const dotRadius = normalizedDistance * maxR;
        const baseAngle = (index * (Math.PI * 2)) / Math.max(nearbyUsers.length, 1);
        const wobble = Math.sin(now / 800 + index) * 0.12;
        const dotAngle = baseAngle + wobble;
        
        const x = cx + Math.cos(dotAngle) * dotRadius;
        const y = cy + Math.sin(dotAngle) * dotRadius;

        const pulse = Math.sin(now / 250 + index * 2) * 0.2 + 0.8;
        const isOnline = user.isOnline !== false;
        const dotColor = isOnline ? primaryColor : mutedColor;
        const glowColor = isOnline ? primaryGlow : `rgba(100, 116, 139`;

        // Glow
        ctx.fillStyle = `${glowColor}, ${0.2 * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 14 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = `${glowColor}, ${0.3 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 10 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Dot
        ctx.fillStyle = dotColor;
        ctx.shadowColor = dotColor;
        ctx.shadowBlur = 6 * pulse;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner dot
        ctx.fillStyle = isDarkRef.current ? '#0f172a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Center
    const primaryColor = c.primaryColor;
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isDarkRef.current ? '#0f172a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(drawRadar);
  }, [scanning, nearbyUsers]);

  // Update colors ref when colors change
  useEffect(() => {
    colorsRef.current = colors;
    isDarkRef.current = document.documentElement.classList.contains('dark');
  }, [colors]);

  // Start/stop animation loop
  useEffect(() => {
    if (scanning || nearbyUsers.length > 0 || ringsRef.current.length > 0) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(drawRadar);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scanning, nearbyUsers.length, drawRadar]);

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        aria-label="Radar scanner" 
        style={{ willReadFrequently: false }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl animate-glow-pulse">
            <Users className="w-10 h-10 text-white" />
          </div>
          
          {scanning && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 animate-[pulse-ring_2s_ease-out_infinite]" />
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/20 animate-[pulse-ring_2s_ease-out_infinite]" style={{ animationDelay: '0.6s' }} />
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/10 animate-[pulse-ring_2s_ease-out_infinite]" style={{ animationDelay: '1.2s' }} />
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-sm text-white text-sm font-medium animate-in animate-in-delayed">
        {scanning ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '80ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '160ms' }} />
            </div>
            <span>Scanning...</span>
          </>
        ) : foundCount > 0 ? (
          <>
            <UserCheck className="w-4 h-4 text-green-400" />
            <span>{foundCount} {foundCount === 1 ? 'person' : 'people'} found</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-gray-400" />
            <span>Tap SCAN to discover</span>
          </>
        )}
      </div>

      <div className="absolute -top-1 -right-1 w-12 h-12 border-2 border-primary-500/15 rounded-tr-3xl" />
      <div className="absolute -bottom-1 -left-1 w-12 h-12 border-2 border-primary-500/15 rounded-bl-3xl" />
    </div>
  );
};

export default RadarScanner;