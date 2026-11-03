import type { ReactNode } from 'react';
import SectionHeading, { PixelIcon, type SpriteName } from './SectionHeading';

export interface Experience {
  company: string;
  role: string;
  description: string;
}

interface ExperienceListProps {
  id: string;
  title: string;
  icon: SpriteName;
  items: Experience[];
  /** mono caption under the heading, e.g. "ongoing" */
  caption: string;
  /** decoration shown under the sticky heading in the side column (lg+, where the heading column exists) */
  mascot?: ReactNode;
}

// Editorial list: sticky heading column on the left (lg+), indexed rows on the
// right. Hovering a row quietly dims its siblings (pure CSS) and swaps its
// index for a pixel ▸.
export default function ExperienceList({ id, title, icon, items, caption, mascot }: ExperienceListProps) {
  return (
    <section id={id} className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-8">
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <SectionHeading text={title} icon={icon} className="!mb-2" />
            <p className="font-mono text-[11px] tracking-widest text-[var(--text-tertiary)] mb-4 lg:mb-0">
              {String(items.length).padStart(2, '0')} · {caption}
            </p>
            {mascot && (
              <div aria-hidden="true" className="hidden lg:block mt-10 pointer-events-none">
                {mascot}
              </div>
            )}
          </div>
        </div>

        <ol className="lg:col-span-9 group/list">
          {items.map((exp, i) => (
            <li
              key={exp.company}
              className="group relative grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2.5rem_minmax(0,1fr)] lg:grid-cols-[2.5rem_minmax(0,0.85fr)_minmax(0,1.6fr)] gap-x-3 md:gap-x-6 gap-y-2 py-5 sm:py-6 md:py-7 border-t border-[var(--border-primary)] last:border-b transition-opacity duration-500 ease-out group-hover/list:opacity-50 hover:!opacity-100"
            >
              <span className="relative row-span-2 lg:row-span-1 pt-1 font-mono text-[11px] tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-300">
                <span className="group-hover:opacity-0 transition-opacity duration-150">{String(i + 1).padStart(2, '0')}</span>
                <PixelIcon
                  name="arrow"
                  size={12}
                  instant
                  className="absolute left-0 top-[7px] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,translate] duration-200 [transition-timing-function:steps(3)]"
                />
              </span>

              <div className="flex flex-col gap-1">
                <span className="text-base sm:text-lg md:text-xl font-medium tracking-tight text-[var(--text-primary)] leading-snug">
                  {exp.company}
                </span>
                <span className="font-mono text-[11px] tracking-widest text-[var(--text-tertiary)]">{exp.role}</span>
              </div>

              <p className="max-w-[60ch] text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed lg:pt-0.5">
                {exp.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
