import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [typedText, setTypedText] = useState('');
  const fullText = "loading jay's world...";

  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(stableOnComplete, 1800);
    return () => clearTimeout(timer);
  }, [stableOnComplete]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[200] bg-[var(--bg-primary)] flex items-center justify-center"
    >
      <span className="font-mono text-xs sm:text-sm tracking-widest text-[var(--text-tertiary)]">
        {typedText}
        <span className="inline-block w-[2px] h-4 bg-[var(--text-tertiary)] ml-0.5 animate-pulse align-text-bottom" />
      </span>
    </motion.div>
  );
}
