import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { projects } from '../../data/projects';
import ProjectList from './ProjectList';
import type { Category } from './CategoryFilter';
import IdBadge from './IdBadge';
import { PixelIcon } from '../SectionHeading';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const counts = useMemo(
    () => projects.reduce<Record<string, number>>((acc, p) => ((acc[p.type] = (acc[p.type] ?? 0) + 1), acc), {}),
    [],
  );

  const filtered = useMemo(
    () => (activeCategory === 'all' ? projects : projects.filter((p) => p.type === activeCategory)),
    [activeCategory],
  );

  return (
    <main className="relative min-h-screen">
      <h1 className="sr-only">portfolio</h1>

      {/* Badge hero: stacked through iPad portrait, side by side from lg.
          svh, not dvh: dvh tracks the toolbar and would resize the WebGL canvas mid-scroll. */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 px-4 sm:px-6 md:px-8 lg:grid-cols-12 lg:gap-8 xl:max-w-7xl">
        <IdBadge className="order-1 -mx-4 h-[clamp(340px,58svh,470px)] sm:-mx-6 sm:h-[clamp(440px,60svh,540px)] md:-mx-8 md:h-[clamp(480px,52svh,600px)] short:h-[360px] lg:order-2 lg:col-span-7 lg:mx-0 lg:h-[min(80svh,760px)]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
          className="order-2 flex flex-col justify-end gap-5 pb-10 sm:gap-6 lg:order-1 lg:col-span-5 lg:pb-16"
        >
          <span className="flex items-center gap-2.5 font-mono text-[11px] tracking-widest text-[var(--text-tertiary)]">
            <PixelIcon name="star" size={14} className="text-[var(--accent)]" />
            ~/portfolio
          </span>
          <p className="font-display text-2xl font-bold leading-[1.15] tracking-normal text-[var(--text-primary)] sm:text-3xl xl:text-4xl">
            {projects.length} projects.
            <br />
            <span className="text-[var(--text-tertiary)]">startups, consulting & personal.</span>
          </p>
          <a
            href="#projects"
            className="tap-target group flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-[var(--text-tertiary)] transition-colors duration-300 hover:text-[var(--text-primary)] sm:text-[10px]"
          >
            the index
            <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
          </a>
        </motion.div>
      </section>

      <section
        id="projects"
        className="relative mx-auto max-w-6xl scroll-mt-24 px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 md:px-8 xl:max-w-7xl"
      >
        <ProjectList
          projects={filtered}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
          counts={counts}
          total={projects.length}
        />
      </section>
    </main>
  );
}
