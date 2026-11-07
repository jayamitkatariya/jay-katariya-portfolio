import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { Project } from '../../data/projects';
import CategoryFilter, { type Category } from './CategoryFilter';
import { safeDecode } from '../../lib/safeDecode';

const EASE = [0.23, 1, 0.32, 1] as const;
const EASE_EXIT = [0.4, 0, 0.6, 1] as const;
const EMAIL = 'hi@jaykatariya.com';

const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function PreviewGif({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      width={1280}
      height={800}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

interface ProjectListProps {
  projects: Project[];
  activeCategory: Category;
  onChange: (category: Category) => void;
  counts: Record<string, number>;
  total: number;
}

// The index: project names as lines, details on demand. Clicking a line opens
// its description, tags and the one link that matters — demo, source or email.
export default function ProjectList({ projects, activeCategory, onChange, counts, total }: ProjectListProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { hash } = useLocation();

  // links like /portfolio#workro-recruit land with that project already open. Keyed on
  // the hash alone: `projects` is a new array on every filter change, and re-running
  // then would re-open a project the reader had just collapsed.
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  useEffect(() => {
    const id = safeDecode(hash.replace(/^#/, ''));
    if (id && projectsRef.current.some((p) => slug(p.name) === id)) setOpen(id);
  }, [hash]);

  // a filter change can remove the open project
  useEffect(() => {
    if (open && !projects.some((p) => slug(p.name) === open)) setOpen(null);
  }, [projects, open]);

  // the preview belongs to the row it was opened from
  useEffect(() => {
    setPreview(null);
  }, [open]);

  return (
    <>
      <div className="flex flex-col gap-5 border-b border-[var(--border-primary)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-mono text-[9px] font-normal tracking-[0.22em] text-[var(--text-tertiary)] sm:text-[10px]">
            01 / all projects
          </h2>
          <p className="mt-2 font-mono text-[9px] tracking-[0.16em] text-[var(--text-tertiary)]">
            {projects.length} of {total} projects
          </p>
        </div>
        <CategoryFilter active={activeCategory} onChange={onChange} counts={counts} />
      </div>

      <div>
        <AnimatePresence initial={false} mode="popLayout">
          {projects.map((project, i) => {
            const id = slug(project.name);
            const isOpen = open === id;
            const isGithub = project.url?.includes('github.com');
            const isConsulting = project.type === 'consulting';
            const isExited = id === 'mindcord';
            const isPreview = preview === id;
            const demoLabel = isGithub ? 'view source' : 'open project';

            return (
              <motion.div
                key={project.name}
                id={id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: EASE, layout: { duration: 0.3, ease: EASE } }}
                className="scroll-mt-24 border-b border-[var(--border-primary)]"
              >
                <button
                  type="button"
                  onClick={() => setOpen((prev) => (prev === id ? null : id))}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-panel`}
                  className="group grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 py-5 text-left sm:grid-cols-[2.2rem_minmax(0,1fr)_auto] sm:py-6"
                >
                  <span className="font-mono text-[8.5px] tracking-widest text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--accent)] sm:text-[9px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span className="min-w-0">
                    <span className="block font-display text-[clamp(1.45rem,4.4vw,2.6rem)] leading-none tracking-normal text-[var(--text-primary)] transition-transform duration-300 ease-out group-hover:translate-x-1">
                      {project.name}
                    </span>
                  </span>

                  <span className="flex items-center gap-2.5 justify-self-end font-mono text-[8.5px] tracking-[0.14em] text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--text-secondary)] sm:text-[9.5px]">
                    <span className="hidden sm:inline">{project.type}</span>
                    {project.url && (
                      <span className="text-[var(--accent)]">{isGithub ? 'code' : 'demo'}</span>
                    )}
                    <Plus
                      size={14}
                      strokeWidth={1.5}
                      className={`transition-transform duration-300 ease-out ${isOpen ? 'rotate-45 text-[var(--accent)]' : ''}`}
                    />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`${id}-panel`}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.16, ease: EASE_EXIT } }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="mb-1 grid gap-5 rounded-b-xl bg-[var(--bg-secondary)]/55 px-3 py-5 sm:grid-cols-12 sm:px-5 sm:py-6">
                        <div className="sm:col-span-7">
                          <p className="max-w-[52ch] text-sm font-light leading-relaxed text-[var(--text-secondary)] sm:text-base">
                            {project.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-[var(--border-primary)] px-2 py-0.5 font-mono text-[8.5px] tracking-[0.1em] text-[var(--text-tertiary)] sm:text-[9px]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:col-span-5 sm:items-end sm:pt-0.5">
                          <span className="font-mono text-[8.5px] tracking-[0.18em] text-[var(--text-tertiary)] sm:text-[9px]">
                            {project.type}
                          </span>
                          {isExited ? (
                            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-tertiary)] sm:text-[11px]">
                              <span className="h-1 w-1 bg-[var(--text-muted)]" aria-hidden="true" />
                              exited
                            </span>
                          ) : project.url ? (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/link inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-primary)] underline decoration-[var(--border-primary)] underline-offset-4 transition-colors hover:decoration-[var(--accent)] sm:text-[11px]"
                            >
                              {demoLabel}
                              <ArrowUpRight
                                size={13}
                                strokeWidth={1.5}
                                className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                              />
                            </a>
                          ) : (
                            <a
                              href={`mailto:${EMAIL}?subject=${encodeURIComponent(`${isConsulting ? 'about' : 'demo'}: ${project.name}`)}`}
                              className="group/link inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--text-primary)] underline decoration-[var(--border-primary)] underline-offset-4 transition-colors hover:decoration-[var(--accent)] sm:text-[11px]"
                            >
                              {isConsulting ? 'ask about it' : 'ask for a demo'}
                              <ArrowUpRight
                                size={13}
                                strokeWidth={1.5}
                                className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                              />
                            </a>
                          )}
                          {!project.url && !isExited && (
                            <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--text-tertiary)]">
                              no public link yet
                            </span>
                          )}
                          {project.preview && (
                            <button
                              type="button"
                              onClick={() => setPreview((prev) => (prev === id ? null : id))}
                              aria-expanded={isPreview}
                              aria-controls={`${id}-preview`}
                              aria-label={`${isPreview ? 'hide' : 'show'} ${project.name} preview`}
                              className="group/show mt-1 inline-flex items-center gap-2 rounded-sm font-mono text-[9px] tracking-[0.16em] text-[var(--text-tertiary)] transition-colors duration-200 hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] focus-visible:outline-none sm:text-[10px]"
                            >
                              <span
                                className={`h-1 w-1 transition-colors duration-200 ${isPreview ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)] group-hover/show:bg-[var(--accent)]'}`}
                                aria-hidden="true"
                              />
                              {isPreview ? 'hide' : 'show'}
                            </button>
                          )}
                        </div>

                        <div id={`${id}-preview`} className="sm:col-span-12">
                          <AnimatePresence initial={false}>
                            {isPreview && project.preview && (
                              <motion.figure
                                key="preview"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_EXIT } }}
                                transition={{ duration: 0.28, ease: EASE }}
                                className="m-0 overflow-hidden"
                              >
                                <div className="pt-1">
                                  <div
                                    className="relative w-full overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
                                    style={{ aspectRatio: '16 / 10' }}
                                  >
                                    <>
                                        <img
                                          src={project.preview.placeholder}
                                          alt=""
                                          aria-hidden="true"
                                          width={16}
                                          height={10}
                                          className="absolute inset-0 h-full w-full scale-105 object-cover blur-xl"
                                        />
                                        <img
                                          src={project.preview.poster}
                                          alt=""
                                          aria-hidden="true"
                                          width={1280}
                                          height={800}
                                          loading="lazy"
                                          className="absolute inset-0 h-full w-full object-cover"
                                        />
                                        <PreviewGif src={project.preview.gif} alt={project.preview.alt} />
                                    </>
                                  </div>
                                  <figcaption className="mt-2 flex items-baseline justify-between gap-4 font-mono text-[8.5px] tracking-[0.14em] text-[var(--text-tertiary)] sm:text-[9px]">
                                    <span>
                                      {project.name} · screen recording
                                    </span>
                                    <span className="text-[var(--text-tertiary)]">
                                      loops
                                    </span>
                                  </figcaption>
                                </div>
                              </motion.figure>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
