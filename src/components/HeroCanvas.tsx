import { useEffect, useRef } from 'react';

const IMAGE_CONFIGS = [
  { url: "/tajmahal.jpg", invert: false },
  { url: "/messi.jpg", invert: false },
  { url: "/bezos.png", invert: false },
  { url: "/jensen.png", invert: true },
  { url: "/zuck.png", invert: false },
];

export default function HeroCanvas({ isDark = false }: { isDark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let loadedSources: { img: HTMLImageElement; invert: boolean }[] = [];
    let currentImgIndex = 0;
    let currentInverted = false;
    let animationFrameId: number;
    let intervalId: ReturnType<typeof setInterval>;
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    interface GridCell {
      x: number;
      y: number;
      size: number;
      targetSize: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
    }

    const step = 10; // Size of each pixel square (smaller = higher res)
    let cols = 0;
    let rows = 0;
    let grid: GridCell[] = [];

    const getTargets = (source: HTMLImageElement, invert: boolean) => {
      if (canvas.width === 0 || canvas.height === 0) return new Float32Array(cols * rows);

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return new Float32Array(cols * rows);

      offscreen.width = canvas.width;
      offscreen.height = canvas.height;

      // Fill white background first
      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, canvas.width, canvas.height);

      if (source.width === 0 || source.height === 0) return new Float32Array(cols * rows);
      // Cover fit: fill the entire viewport with no whitespace gaps
      const scale = Math.max(canvas.width / source.width, canvas.height / source.height);
      const w = source.width * scale;
      const h = source.height * scale;
      const x = (canvas.width - w) / 2;
      // Bias vertical crop toward the bottom (hidden by gradient overlay)
      // so faces/subjects at the top stay visible
      const y = h > canvas.height ? -(h - canvas.height) * 0.25 : (canvas.height - h) / 2;
      offCtx.drawImage(source, x, y, w, h);

      const imgData = offCtx.getImageData(0, 0, canvas.width, canvas.height).data;
      const rawDarkness = new Float32Array(cols * rows);
      let minDarkness = 255;
      let maxDarkness = 0;

      // First pass: Calculate darkness and find min/max for histogram normalization
      for (let py = 0; py < rows; py++) {
        for (let px = 0; px < cols; px++) {
          const pixelX = px * step + Math.floor(step / 2);
          const pixelY = py * step + Math.floor(step / 2);

          if (pixelX < canvas.width && pixelY < canvas.height) {
            const i = (pixelY * canvas.width + pixelX) * 4;
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];

            const brightness = (r + g + b) / 3;
            const darkness = 255 - brightness;

            rawDarkness[py * cols + px] = darkness;
            if (darkness < minDarkness) minDarkness = darkness;
            if (darkness > maxDarkness) maxDarkness = darkness;
          }
        }
      }

      const targets = new Float32Array(cols * rows);
      const range = maxDarkness - minDarkness || 1;

      // Second pass: Normalize contrast so every image looks perfect
      for (let i = 0; i < rawDarkness.length; i++) {
        // Normalize to 0.0 - 1.0, clamped so padding pixels don't produce NaN
        let normalized = Math.max(0, (rawDarkness[i] - minDarkness) / range);

        // Invert: light areas become visible pixels instead of dark areas
        if (invert) normalized = 1 - normalized;

        // Apply a curve to increase contrast (makes darks darker, lights lighter)
        normalized = Math.pow(normalized, 1.5);

        // Only show pixels above threshold
        if (normalized > 0.15) {
          targets[i] = normalized;
        } else {
          targets[i] = 0;
        }
      }
      
      return targets;
    };

    const switchImage = (index: number) => {
      if (!loadedSources[index]) return;
      currentInverted = loadedSources[index].invert;
      const targets = getTargets(loadedSources[index].img, currentInverted);

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];
        
        // Calculate distance from center for a cool radial wipe effect
        const dx = cell.baseX - canvas.width / 2;
        const dy = cell.baseY - canvas.height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Add random noise to the delay for a "digital glitch" feel
        const delay = dist * 0.3 + Math.random() * 200;
        
        const t = setTimeout(() => {
          // Max size is 90% of step to leave a tiny grid gap
          cell.targetSize = targets[i] * step * 0.9; 
        }, delay);
        
        timeouts.push(t);
      }
    };

    const init = () => {
      canvas.width = Math.max(1, window.innerWidth);
      canvas.height = Math.max(1, window.innerHeight);
      
      cols = Math.ceil(canvas.width / step);
      rows = Math.ceil(canvas.height / step);
      grid = [];

      // Initialize grid with random noise so it looks cool immediately
      for (let py = 0; py < rows; py++) {
        for (let px = 0; px < cols; px++) {
          grid.push({
            x: px * step + step / 2,
            y: py * step + step / 2,
            size: Math.random() * step * 0.5, // Start with random noise
            targetSize: 0,
            vx: 0,
            vy: 0,
            baseX: px * step + step / 2,
            baseY: py * step + step / 2,
          });
        }
      }
      
      // Start animation loop immediately
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();

      // Load all images locally - skip any that fail
      Promise.all(
        IMAGE_CONFIGS.map(config => {
          return new Promise<{ img: HTMLImageElement; invert: boolean } | null>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ img, invert: config.invert });
            img.onerror = () => resolve(null);
            img.src = config.url;
          });
        })
      ).then(results => {
        loadedSources = results.filter((r): r is { img: HTMLImageElement; invert: boolean } => r !== null);

        if (loadedSources.length > 0) {
          switchImage(0);
          intervalId = setInterval(() => {
            currentImgIndex = (currentImgIndex + 1) % loadedSources.length;
            switchImage(currentImgIndex);
          }, 5000);
        }
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bgColor = isDark ? '#0a0a0a' : '#ffffff';
      const fgColor = isDark ? '#f5f5f5' : '#111111';
      if (currentInverted) {
        ctx.fillStyle = fgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bgColor;
      } else {
        ctx.fillStyle = fgColor;
      }

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];

        // Mouse interaction (repel and shrink)
        const dx = mouse.x - cell.x;
        const dy = mouse.y - cell.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
          const force = (80 - dist) / 80;
          cell.vx -= (dx / dist) * force * 5;
          cell.vy -= (dy / dist) * force * 5;
          cell.size *= 0.8; // Shrink when hovered
        }

        // Spring back to base grid position
        cell.vx += (cell.baseX - cell.x) * 0.15;
        cell.vy += (cell.baseY - cell.y) * 0.15;

        // Friction
        cell.vx *= 0.8;
        cell.vy *= 0.8;

        cell.x += cell.vx;
        cell.y += cell.vy;

        // Smooth size transition
        cell.size += (cell.targetSize - cell.size) * 0.1;

        if (cell.size > 0.5) {
          // Draw actual square pixels
          ctx.fillRect(
            cell.x - cell.size / 2, 
            cell.y - cell.size / 2, 
            cell.size, 
            cell.size
          );
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        timeouts.forEach(clearTimeout);
        timeouts = [];
        clearInterval(intervalId);
        init();
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
      timeouts.forEach(clearTimeout);
      clearTimeout(resizeTimeout);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-90"
    />
  );
}

