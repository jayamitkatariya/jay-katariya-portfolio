import type { ReactNode } from 'react';
import { PixelIcon, type SpriteName } from './SectionHeading';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: SpriteName;
  /** right-aligned slot (controls, actions) */
  children?: ReactNode;
  className?: string;
}

// Shared page title: pixel icon + display-face title + mono subtitle,
// left-aligned on the same container as the home sections.
export default function PageHeader({ title, subtitle, icon, children, className = '' }: PageHeaderProps) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}>
      <div>
        <h1 className="flex items-center gap-3 sm:gap-4 font-display font-bold tracking-normal text-3xl sm:text-4xl md:text-5xl text-[var(--text-primary)]">
          <PixelIcon name={icon} size={28} className="shrink-0 text-[var(--accent)]" />
          {title}
        </h1>
        {subtitle && <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-[var(--text-tertiary)]">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
