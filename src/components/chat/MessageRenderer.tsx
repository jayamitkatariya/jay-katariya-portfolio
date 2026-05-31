import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import type { MessageSegment } from '../../lib/parseMessage';
import { renderMarkdown } from '../../lib/parseMarkdown';
import type { Project } from '../../data/projects';
import ChatProjectCard from './ChatProjectCard';

interface MessageRendererProps {
  segments: MessageSegment[];
  projects: Project[];
  onAction?: (action: string) => void;
  onNavigate?: (path: string) => void;
}

export default function MessageRenderer({ segments, projects, onAction, onNavigate }: MessageRendererProps) {
  const actionsExecuted = useRef(false);

  useEffect(() => {
    if (actionsExecuted.current || !onAction) return;
    const actions = segments.filter(s => s.type === 'action');
    if (actions.length > 0) {
      actionsExecuted.current = true;
      actions.forEach(s => {
        if (s.type === 'action') onAction(s.action);
      });
    }
  }, [segments, onAction]);

  return (
    <>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case 'text':
            return <span key={i}>{renderMarkdown(segment.content)}</span>;

          case 'project': {
            const project = projects.find(
              p => p.name.toLowerCase() === segment.name.toLowerCase()
            );
            if (!project) return <span key={i} className="font-medium">{segment.name}</span>;
            return (
              <div key={i}>
                <ChatProjectCard
                  project={project}
                  onClick={() => onNavigate?.('/portfolio')}
                />
              </div>
            );
          }

          case 'link':
            return (
              <motion.a
                key={i}
                href={segment.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-0.5 text-[var(--text-primary)] underline underline-offset-2 decoration-[var(--text-tertiary)]/50 hover:decoration-[var(--text-primary)] transition-colors duration-200"
              >
                {segment.text}
                <ExternalLink size={10} className="opacity-50 shrink-0" />
              </motion.a>
            );

          case 'button':
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => {
                  if (segment.target.startsWith('http') || segment.target.startsWith('mailto:')) {
                    window.open(segment.target, '_blank', 'noopener,noreferrer');
                  } else {
                    onAction?.(segment.target);
                  }
                }}
                className="inline-flex items-center font-mono text-[11px] text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full px-3 py-1 mx-0.5 hover:bg-[var(--bg-secondary)] hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:scale-[0.97] transition-all duration-200"
              >
                {segment.label}
              </motion.button>
            );

          case 'action':
            return null;

          case 'chips':
            return null;

          default:
            return null;
        }
      })}
    </>
  );
}
