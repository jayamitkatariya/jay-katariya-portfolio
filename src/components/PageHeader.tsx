import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { PixelIcon, type SpriteName } from './SectionHeading';
import TextScramble from './TextScramble';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: SpriteName;
  /** tailwind text color class for the pixel icon */
  iconColor: string;
  /** right-aligned slot (controls, actions) */
  children?: ReactNode;
  className?: string;
}

// Shared page title: pixel icon + scrambled title + mono subtitle, left-aligned
// on the same container as the home sections.
export default function PageHeader({ title, subtitle, icon, iconColor, children, className = '' }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}
    >
      <div>
        <h1 className="flex items-center gap-3 sm:gap-4 text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[var(--text-primary)]">
          <PixelIcon name={icon} size={28} className={`shrink-0 ${iconColor}`} />
          <TextScramble text={title} trigger="mount" />
        </h1>
        {subtitle && <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-[var(--text-tertiary)]">{subtitle}</p>}
      </div>
      {children}
    </motion.header>
  );
}
