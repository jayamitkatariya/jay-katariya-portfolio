import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projects } from '../../data/projects';
import GlowCard from './GlowCard';
import CategoryFilter, { getCategoryDot } from './CategoryFilter';
import type { Category } from './CategoryFilter';
import IdBadge from './IdBadge';
import { PixelIcon } from '../SectionHeading';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  // stagger only on the first reveal, so re-filtering feels instant
  const firstReveal = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => (firstReveal.current = false), 1200);
    return () => clearTimeout(t);
  }, []);

  const counts = useMemo(
    () => projects.reduce<Record<string, number>>((acc, p) => ((acc[p.type] = (acc[p.type] ?? 0) + 1), acc), {}),
    [],
  );

  const filtered = useMemo(
    () => (activeCategory === 'all' ? projects : projects.filter(p => p.type === activeCategory)),
    [activeCategory],
  );

  return (
    <div className="min-h-screen relative">
      <h1 className="sr-only">portfolio</h1>

      {/* Badge hero: stacked through iPad portrait, side by side from lg.
          svh, not dvh: dvh tracks the toolbar and would resize the WebGL canvas mid-scroll. */}
      <section className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        <IdBadge className="order-1 lg:order-2 lg:col-span-7 h-[clamp(380px,64svh,470px)] sm:h-[clamp(440px,60svh,540px)] md:h-[clamp(480px,52svh,600px)] short:h-[360px] lg:h-[min(88svh,800px)] -mx-4 sm:-mx-6 md:-mx-8 lg:mx-0" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
          className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-end gap-5 sm:gap-6 pb-10 lg:pb-24"
        >
          <span className="flex items-center gap-2.5 font-mono text-[11px] tracking-widest text-[var(--text-tertiary)]">
            <PixelIcon name="star" size={14} className="text-blue-500" />
            ~/portfolio
          </span>
          <p className="text-2xl sm:text-3xl xl:text-4xl font-medium tracking-tight leading-[1.15] text-[var(--text-primary)]">
            {projects.length} projects.
            <br />
            <span className="text-[var(--text-tertiary)]">startups, consulting, freelance & personal.</span>
          </p>
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} counts={counts} />
        </motion.div>
      </section>

      {/* Projects */}
      <section id="projects" className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-20">
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.name}
                layout
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{
                  duration: 0.45,
                  // by column, not index: cards revealed later by scrolling still land with their row
                  delay: firstReveal.current ? (i % 3) * 0.06 : 0,
                  ease: EASE,
                  layout: { duration: 0.35, ease: EASE },
                }}
                className="h-full"
              >
                <GlowCard project={project} dotClass={getCategoryDot(project.type)} index={projects.indexOf(project)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
