import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../../data/projects';
import { PixelIcon } from '../SectionHeading';

interface GlowCardProps {
  project: Project;
  index: number;
}

// Project card in the site's monochrome pixel language: index number, category
// pixel, and a pixel ▸ that steps in on hover. Color is confined to one pixel.
// Hover feedback is reserved for cards that actually link somewhere.
export default function GlowCard({ project, index }: GlowCardProps) {
  const interactive = Boolean(project.url);
  const Wrapper = interactive ? 'a' : 'div';
  const wrapperProps = interactive
    ? { href: project.url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative flex flex-col h-full rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 sm:p-6 ${
        interactive
          ? 'cursor-pointer transition-colors duration-300 hover:border-[var(--text-tertiary)]'
          : 'cursor-default'
      }`}
    >
      {/* Header: index + category + link */}
      <div className="flex items-center gap-2.5 mb-5 font-mono text-[11px] tracking-widest">
        <span className="relative w-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-300">
          <span className="group-hover:opacity-0 transition-opacity duration-150">{String(index + 1).padStart(2, '0')}</span>
          <PixelIcon
            name="arrow"
            size={12}
            instant
            className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,translate] duration-200 [transition-timing-function:steps(3)]"
          />
        </span>
        <span className="w-1.5 h-1.5 bg-[var(--accent)]" aria-hidden="true" />
        <span className="uppercase text-[var(--text-tertiary)]">{project.type}</span>
        {interactive && (
          <ArrowUpRight size={14} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-300" />
        )}
      </div>

      <h3 className="text-lg sm:text-xl font-medium tracking-tight text-[var(--text-primary)] mb-2">
        {project.name}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed mb-5 flex-1">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-[11px] font-mono text-[var(--text-tertiary)] border border-[var(--border-primary)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </Wrapper>
  );
}
