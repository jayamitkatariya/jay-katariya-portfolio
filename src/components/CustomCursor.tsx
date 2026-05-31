import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const stateRef = useRef({ mouseX: 0, mouseY: 0, ringX: 0, ringY: 0, hovering: false, clicking: false, prevX: 0, prevY: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't render on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Add class to html so CSS knows custom cursor is active
    document.documentElement.classList.add('custom-cursor-active');

    const dot = dotRef.current;
    const ring = ringRef.current;
    const canvas = canvasRef.current;
    if (!dot || !ring || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const s = stateRef.current;
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];

    const handleMove = (e: MouseEvent) => {
      s.mouseX = e.clientX;
      s.mouseY = e.clientY;
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement;
      s.hovering = !!target.closest('a, button, [role="button"], input, textarea, select, [data-cursor-hover]');
    };

    const handleDown = () => { s.clicking = true; };
    const handleUp = () => { s.clicking = false; };
    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    let frameId: number;

    const animate = () => {
      // Dot follows exactly
      dot.style.transform = `translate(${s.mouseX - 3}px, ${s.mouseY - 3}px)`;

      // Ring follows with spring
      s.ringX += (s.mouseX - s.ringX) * 0.15;
      s.ringY += (s.mouseY - s.ringY) * 0.15;
      const ringSize = s.clicking ? 20 : s.hovering ? 48 : 32;
      ring.style.width = ring.style.height = `${ringSize}px`;
      ring.style.transform = `translate(${s.ringX - ringSize / 2}px, ${s.ringY - ringSize / 2}px)`;
      ring.style.borderWidth = s.hovering ? '1.5px' : '1px';

      // Spawn particles on fast movement (skip if reduced motion preferred)
      if (!prefersReducedMotion) {
        const speed = Math.sqrt((s.mouseX - s.prevX) ** 2 + (s.mouseY - s.prevY) ** 2);
        if (speed > 15 && particles.length < 30) {
          particles.push({
            x: s.mouseX,
            y: s.mouseY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 1,
            maxLife: 0.4 + Math.random() * 0.3,
          });
        }
      }
      s.prevX = s.mouseX;
      s.prevY = s.mouseY;

      // Draw particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, p.life / p.maxLife) * 0.4;
        const size = 2 * (p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(245,245,245,${alpha})` : `rgba(17,17,17,${alpha})`;
        ctx.fill();
      }

      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    document.addEventListener('mouseleave', handleLeave);
    document.addEventListener('mouseenter', handleEnter);
    window.addEventListener('resize', handleResize);
    frameId = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      document.removeEventListener('mouseleave', handleLeave);
      document.removeEventListener('mouseenter', handleEnter);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, [visible]);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none z-[9998] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 w-1.5 h-1.5 bg-[var(--text-primary)] rounded-full pointer-events-none z-[9999] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 border border-[var(--text-primary)]/30 rounded-full pointer-events-none z-[9999] transition-[width,height,opacity,border-width] duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
