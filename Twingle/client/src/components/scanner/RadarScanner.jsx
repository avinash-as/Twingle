import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Users, Wifi, UserCheck, Search, Sparkles } from 'lucide-react';

const RadarScanner = ({ scanning, nearbyUsers, scanCount, scanProgress = 0 }) => {
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
  const colorsRef = useRef({});

  const colors = useMemo(() => ({
    isDark: true,
    gridColor: 'rgba(124, 58, 237, 0.08)',
    primaryColor: '#7C3AED',
    primaryGlow: 'rgba(124, 58, 237',
    secondaryColor: '#22D3EE',
    secondaryGlow: 'rgba(34, 211, 238',
    textColor: '#F8FAFC',
    mutedColor: '#A1A1AA',
    clearColor: scanning ? 'rgba(11, 11, 18, 0.15)' : 'rgba(11, 11, 18, 0.3)',
  }), [scanning]);

  useEffect(() => {
    const target = scanCount || 0;
    const duration = 400;
    const start = foundCount;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setFoundCount(Math.round(start + (target - start) * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [scanCount, foundCount]);

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
      const maxR = Math.min(width, height) / 2 - 25;
      
      canvasSizeRef.current = { width, height, cx, cy, maxR };
    };
    
    resize();
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const drawRadar = useCallback((timestamp) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    const deltaTime = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) : 0;
    lastTimeRef.current = timestamp;
    
    const { cx, cy, maxR } = canvasSizeRef.current;
    const c = colorsRef.current;

    ctx.fillStyle = c.clearColor;
    ctx.fillRect(0, 0, canvasSizeRef.current.width, canvasSizeRef.current.height);

    ctx.strokeStyle = c.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.stroke();

    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = `${c.gridColor}80`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = c.mutedColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i;
      const dist = Math.round((r / maxR) * 5000);
      ctx.fillText(`${dist}m`, cx + r + 12, cy);
    }

    if (scanning) {
      const sweepSpeed = 1.4;
      sweepAngleRef.current += sweepSpeed * deltaTime;
      if (sweepAngleRef.current > Math.PI * 3 / 2) {
        sweepAngleRef.current = -Math.PI / 2;
      }

      const angle = sweepAngleRef.current;
      const sweepLength = maxR;

      const trailLength = 0.9;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, `${c.primaryGlow}, 0.15)`);
      gradient.addColorStop(0.5, `${c.secondaryGlow}, 0.05)`);
      gradient.addColorStop(1, `${c.primaryGlow}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angle - trailLength, angle);
      ctx.closePath();
      ctx.fill();

      const x2 = cx + Math.cos(angle) * sweepLength;
      const y2 = cy + Math.sin(angle) * sweepLength;
      
      ctx.strokeStyle = c.primaryColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = c.primaryColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.shadowBlur = 0;
      
      const lineGradient = ctx.createLinearGradient(cx, cy, x2, y2);
      lineGradient.addColorStop(0, `${c.primaryGlow}, 0.6)`);
      lineGradient.addColorStop(0.5, `${c.secondaryGlow}, 0.4)`);
      lineGradient.addColorStop(1, `${c.secondaryGlow}, 0)`);
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.fillStyle = c.secondaryColor;
      ctx.shadowColor = c.secondaryColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const rings = ringsRef.current;
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      if (ring.opacity <= 0) {
        rings.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `${ring.color}, ${ring.opacity * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ring.radius += 50 * deltaTime;
      ring.opacity -= 0.45 * deltaTime;
    }

    if (scanning && rings.length < 6 && Math.random() < 0.015) {
      rings.push({ 
        radius: 30, 
        opacity: 1, 
        color: Math.random() > 0.5 ? c.primaryGlow : c.secondaryGlow 
      });
    }

    if (scanning && particlesRef.current.length < 30 && Math.random() < 0.08) {
      particlesRef.current.push({
        x: Math.random() * canvasSizeRef.current.width,
        y: Math.random() * canvasSizeRef.current.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: 1,
        size: Math.random() * 2 + 0.5,
        color: Math.random() > 0.5 ? c.primaryColor : c.secondaryColor,
      });
    }

    if (particlesRef.current.length > 0) {
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        ctx.fillStyle = `${p.color}, ${p.life * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.003;
      });
    }

    if (nearbyUsers.length > 0) {
      const primaryGlow = 'rgba(124, 58, 237';
      const secondaryGlow = 'rgba(34, 211, 238';
      const primaryColor = '#7C3AED';
      const secondaryColor = '#22D3EE';
      const mutedColor = '#A1A1AA';
      const textColor = '#F8FAFC';
      const now = timestamp;
      
      nearbyUsers.forEach((user, index) => {
        if (!user.distance) return;
        
        const normalizedDistance = Math.min(user.distance / 5000, 1);
        const dotRadius = normalizedDistance * maxR;
        const baseAngle = (index * (Math.PI * 2)) / Math.max(nearbyUsers.length, 1);
        const wobble = Math.sin(now / 800 + index) * 0.1;
        const dotAngle = baseAngle + wobble + (scanning ? sweepAngleRef.current * 0.02 : 0);
        
        const x = cx + Math.cos(dotAngle) * dotRadius;
        const y = cy + Math.sin(dotAngle) * dotRadius;

        const pulse = Math.sin(now / 250 + index * 2) * 0.2 + 0.8;
        const isOnline = user.isOnline !== false;
        const dotColor = isOnline ? primaryColor : mutedColor;
        const glowColor = isOnline ? primaryGlow : `rgba(161, 161, 170`;

        ctx.fillStyle = `${glowColor}, ${0.25 * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${glowColor}, ${0.4 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = dotColor;
        ctx.shadowColor = dotColor;
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0B0B12';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (scanning && Math.abs(dotAngle - sweepAngleRef.current) < 0.25) {
          ctx.fillStyle = textColor;
          ctx.font = '11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(user.name || 'User', x + 14, y + 4);
        }
      });
    }

    const primaryColor = '#7C3AED';
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0B0B12';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(drawRadar);
  }, [scanning, nearbyUsers]);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  useEffect(() => {
    if (scanning || nearbyUsers.length > 0 || ringsRef.current.length > 0 || particlesRef.current.length > 0) {
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
    <div className="relative w-full aspect-square max-w-[380px] mx-auto">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        aria-label="Radar scanner detecting nearby users" 
        style={{ willReadFrequently: false }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 flex items-center justify-center shadow-2xl animate-glow-pulse relative">
            <Users className="w-12 h-12 text-white" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 opacity-30 blur-xl" />
          </div>
          
          {scanning && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/40 animate-[pulseRing_2.5s_ease-out_infinite]" />
              <div className="absolute inset-0 rounded-full border-2 border-accent-500/25 animate-[pulseRing_2.5s_ease-out_infinite]" style={{ animationDelay: '0.8s' }} />
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/10 animate-[pulseRing_2.5s_ease_out_infinite]" style={{ animationDelay: '1.6s' }} />
              <div className="absolute inset-0 rounded-full border-t-2 border-accent-400/30 animate-[rotate-scan_4s_linear_infinite]" />
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 px-5 py-3 rounded-full bg-[#151522]/80 backdrop-blur-sm text-white text-sm font-medium animate-in animate-in-delayed shadow-lg border border-neutral-700/50">
        {scanning ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" style={{ animationDelay: '80ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '160ms' }} />
            </div>
            <span className="text-sm font-medium">Scanning nearby... {Math.round(scanProgress)}%</span>
            <div className="w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </>
        ) : foundCount > 0 ? (
          <>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                {foundCount} {foundCount === 1 ? 'person' : 'people'} nearby
              </span>
            </div>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-500">Tap SCAN to discover</span>
          </>
        )}
      </div>

      <div className="absolute -top-2 -right-2 w-16 h-16 border-2 border-primary-500/20 rounded-tr-3xl opacity-50" />
      <div className="absolute -bottom-2 -left-2 w-16 h-16 border-2 border-accent-500/20 rounded-bl-3xl opacity-50" />
      <div className="absolute -top-2 -left-2 w-12 h-12 border-2 border-primary-500/15 rounded-tl-3xl opacity-30" />
      <div className="absolute -bottom-2 -right-2 w-12 h-12 border-2 border-accent-500/15 rounded-br-3xl opacity-30" />
    </div>
  );
};

export default RadarScanner;