import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projects } from '../../data/projects';
import AmbientGlow from './AmbientGlow';
import GlowCard from './GlowCard';
import CategoryFilter, { getCategoryStyle } from './CategoryFilter';
import type { Category } from './CategoryFilter';

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? projects
        : projects.filter((p) => p.type === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen relative">
      <AmbientGlow />

      <section className="relative z-10 max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-36 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mb-10 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[var(--text-primary)] mb-3">
            portfolio
          </h1>
          <p className="font-mono text-xs sm:text-sm tracking-wider text-[var(--text-tertiary)]">
            {projects.length} projects. startups, consulting, freelance & personal
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 sm:mb-10"
        >
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
        </motion.div>

        {/* Project grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => {
              const { rgb, accent } = getCategoryStyle(project.type);
              const staggerDelay = Math.min(i * 0.05, 0.4);

              return (
                <motion.div
                  key={project.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{
                    duration: 0.4,
                    delay: staggerDelay,
                    ease: [0.23, 1, 0.32, 1],
                    layout: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
                  }}
                  className="h-full"
                >
                  <GlowCard
                    project={project}
                    glowRGB={rgb}
                    accentClass={accent}
                    index={i}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <p className="font-mono text-sm text-[var(--text-tertiary)]">no projects in this category yet.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
