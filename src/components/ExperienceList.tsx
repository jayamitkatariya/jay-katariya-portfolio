import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import SectionHeading, { PixelIcon, type SpriteName } from './SectionHeading';
import AnimatedDescription from './AnimatedDescription';

export interface Experience {
  company: string;
  role: string;
  description: string;
}

interface ExperienceListProps {
  id: string;
  title: string;
  icon: SpriteName;
  /** tailwind text color class for the heading icon */
  color: string;
  items: Experience[];
  /** mono caption under the heading, e.g. "ongoing" */
  caption: string;
  /** show a blinking "now" marker */
  live?: boolean;
  /** decoration shown under the sticky heading in the side column (lg+, where the heading column exists) */
  mascot?: ReactNode;
}

const EASE = [0.23, 1, 0.32, 1] as const;

// Editorial list: sticky heading column on the left (lg+), indexed rows on the
// right. Hovering a row quietly dims its siblings (pure CSS) and swaps its
// index for a pixel ▸.
export default function ExperienceList({ id, title, icon, color, items, caption, live = false, mascot }: ExperienceListProps) {
  return (
    <section id={id} className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-8">
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <SectionHeading text={title} icon={icon} color={color} className="!mb-2" />
            <p className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-[var(--text-tertiary)] mb-4 lg:mb-0">
              <span>{String(items.length).padStart(2, '0')} — {caption}</span>
              {live && (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-1.5 h-1.5 bg-emerald-500 animate-pixel-blink" aria-hidden="true" />
                  now
                </span>
              )}
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
            <motion.li
              key={exp.company}
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: '-40px' }}
              className="group relative grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2.5rem_minmax(0,1fr)] lg:grid-cols-[2.5rem_minmax(0,0.85fr)_minmax(0,1.6fr)] gap-x-3 md:gap-x-6 gap-y-2 py-5 sm:py-6 md:py-7 transition-opacity duration-500 ease-out group-hover/list:opacity-50 hover:!opacity-100"
            >
              {/* top rule draws in from the left */}
              <motion.span
                aria-hidden="true"
                className="absolute left-0 right-0 top-0 h-px bg-[var(--border-primary)] origin-left"
                variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
              />
              {i === items.length - 1 && (
                <motion.span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-0 h-px bg-[var(--border-primary)] origin-left"
                  variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }}
                  transition={{ duration: 0.7, delay: i * 0.06 + 0.1, ease: EASE }}
                />
              )}

              <motion.span
                className="relative row-span-2 lg:row-span-1 pt-1 font-mono text-[11px] tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-300"
                variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
                transition={{ duration: 0.4, delay: i * 0.06 + 0.25 }}
              >
                <span className="group-hover:opacity-0 transition-opacity duration-150">{String(i + 1).padStart(2, '0')}</span>
                <PixelIcon
                  name="arrow"
                  size={12}
                  instant
                  className="absolute left-0 top-[7px] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 [transition-timing-function:steps(3)]"
                />
              </motion.span>

              <motion.div
                className="flex flex-col gap-1"
                variants={{ hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, delay: i * 0.06 + 0.25, ease: EASE }}
              >
                <span className="text-base sm:text-lg md:text-xl font-medium tracking-tight text-[var(--text-primary)] leading-snug">
                  {exp.company}
                </span>
                <span className="font-mono text-[11px] tracking-widest text-[var(--text-tertiary)]">{exp.role}</span>
              </motion.div>

              <motion.p
                className="max-w-[60ch] text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed lg:pt-0.5"
                variants={{ hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, delay: i * 0.06 + 0.32, ease: EASE }}
              >
                <AnimatedDescription text={exp.description} />
              </motion.p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
