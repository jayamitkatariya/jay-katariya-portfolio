import { motion } from 'motion/react';
import type { ProjectType } from '../../data/projects';

export type Category = 'all' | ProjectType;

interface CategoryFilterProps {
  active: Category;
  onChange: (category: Category) => void;
  counts: Record<string, number>;
}

const CATEGORIES: { id: Category; label: string; dot: string }[] = [
  { id: 'all', label: 'all', dot: 'bg-[var(--text-primary)]' },
  { id: 'startup', label: 'startup', dot: 'bg-blue-500' },
  { id: 'consulting', label: 'consulting', dot: 'bg-emerald-500' },
  { id: 'personal', label: 'personal', dot: 'bg-purple-500' },
  { id: 'freelance', label: 'freelance', dot: 'bg-amber-500' },
];

export function getCategoryDot(type: string) {
  return CATEGORIES.find((c) => c.id === type)?.dot ?? 'bg-[var(--text-tertiary)]';
}

export default function CategoryFilter({ active, onChange, counts }: CategoryFilterProps) {
  return (
    // lg+: one row, running into the empty space under the badge, rather than orphaning the last chip
    <div className="relative z-10 flex flex-wrap lg:flex-nowrap lg:w-max gap-1.5 pointer-coarse:gap-2" role="group" aria-label="filter projects by category">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        const count = cat.id === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[cat.id] ?? 0;
        if (!count) return null;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            aria-pressed={isActive}
            className={`relative flex items-center gap-2 px-3.5 py-2 pointer-coarse:py-3 rounded-full font-mono text-[11px] tracking-wider whitespace-nowrap transition-colors duration-200 ${
              isActive ? 'text-[var(--bg-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full bg-[var(--text-primary)]"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className={`relative w-1.5 h-1.5 ${isActive ? 'bg-[var(--bg-primary)]' : cat.dot}`} aria-hidden="true" />
            <span className="relative">{cat.label}</span>
            <span className={`relative ${isActive ? 'opacity-60' : 'text-[var(--text-muted)]'}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
