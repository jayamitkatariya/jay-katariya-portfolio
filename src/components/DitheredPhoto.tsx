import { useEffect, useRef } from 'react';
import { atkinson, loadImage, paintMask, sampleLuma } from '../lib/dither';

// 1-bit Atkinson-dithered print of a photo, sized to its box. Layer it over the
// real <img> and fade it out to "develop" the photo into color.

const INK: [number, number, number, number] = [20, 20, 20, 255];
const PAPER: [number, number, number, number] = [242, 239, 232, 255];

interface DitheredPhotoProps {
  src: string;
  className?: string;
  /** css px per dither pixel */
  pixel?: number;
  focusY?: number;
  onReady?: () => void;
}

export default function DitheredPhoto({ src, className = '', pixel = 1.6, focusY = 0.35, onReady }: DitheredPhotoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let last = '';

    const draw = async () => {
      const w = Math.max(8, Math.round(canvas.clientWidth / pixel));
      const h = Math.max(8, Math.round(canvas.clientHeight / pixel));
      const key = `${w}x${h}`;
      if (key === last) return;
      last = key;
      const img = await loadImage(src).catch(() => null);
      if (!img || cancelled) return;
      canvas.width = w;
      canvas.height = h;
      paintMask(canvas.getContext('2d')!, atkinson(sampleLuma(img, w, h, focusY, 1.45), w, h), w, h, INK, PAPER);
      onReadyRef.current?.();
    };

    draw();
    // redraw only on meaningful size changes (tiles spring-animate their size)
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(draw, 120);
    });
    ro.observe(canvas);
    return () => {
      cancelled = true;
      clearTimeout(t);
      ro.disconnect();
    };
  }, [src, pixel, focusY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full [image-rendering:pixelated] ${className}`}
    />
  );
}
