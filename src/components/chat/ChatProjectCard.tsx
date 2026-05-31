import { motion } from 'motion/react';
import type { Project } from '../../data/projects';

interface ChatProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ChatProjectCard({ project, onClick }: ChatProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className="my-2.5 border border-[var(--border-primary)] rounded-xl p-3.5 bg-[var(--bg-primary)]/60 backdrop-blur-sm hover:border-[var(--text-tertiary)] hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      {/* Type badge */}
      <div className="font-mono text-[9px] tracking-widest text-[var(--text-tertiary)] uppercase mb-1.5">
        {project.type}
      </div>

      {/* Project name */}
      <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-orange-500 transition-colors duration-200 mb-1.5">
        {project.name}
      </div>

      {/* Description — 2 lines max */}
      <div className="text-xs text-[var(--text-secondary)] font-light leading-relaxed line-clamp-2 mb-2.5">
        {project.description}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {project.tags.slice(0, 4).map(tag => (
          <span
            key={tag}
            className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--text-tertiary)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
