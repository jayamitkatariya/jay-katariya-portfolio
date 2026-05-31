import { motion } from 'motion/react';

export type Category = 'all' | 'personal' | 'startup' | 'consulting' | 'freelance';

interface CategoryFilterProps {
  active: Category;
  onChange: (category: Category) => void;
}

const CATEGORIES: { id: Category; label: string; rgb: string; accent: string }[] = [
  { id: 'all', label: 'all', rgb: '107, 114, 128', accent: 'text-[var(--text-primary)]' },
  { id: 'startup', label: 'startup', rgb: '59, 130, 246', accent: 'text-blue-400' },
  { id: 'consulting', label: 'consulting', rgb: '16, 185, 129', accent: 'text-emerald-400' },
  { id: 'personal', label: 'personal', rgb: '168, 85, 247', accent: 'text-purple-400' },
  { id: 'freelance', label: 'freelance', rgb: '245, 158, 11', accent: 'text-amber-400' },
];

export function getCategoryStyle(type: string) {
  const cat = CATEGORIES.find((c) => c.id === type);
  return {
    rgb: cat?.rgb ?? '107, 114, 128',
    accent: cat?.accent ?? 'text-[var(--text-secondary)]',
  };
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`relative px-4 py-2 rounded-full font-mono text-[11px] tracking-wider transition-colors duration-200 whitespace-nowrap ${
              isActive ? cat.accent + ' font-medium' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full border border-[var(--border-primary)]"
                style={{
                  background: `rgba(${cat.rgb}, 0.08)`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
