import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowUpRight, Download } from 'lucide-react';
import PageHeader from './PageHeader';
import SectionHeading, { type SpriteName } from './SectionHeading';
import {
  RESUME_URL, RESUME_FILENAME, RESUME_UPDATED as UPDATED,
  education, experience, recognition, skills, type ResumeEntry as Entry,
} from '../data/profile';

const EASE = [0.23, 1, 0.32, 1] as const;

const SECTIONS: { id: string; label: string; icon: SpriteName; color: string; bar: string }[] = [
  { id: 'education', label: 'education', icon: 'cap', color: 'text-violet-500', bar: 'bg-violet-500' },
  { id: 'experience', label: 'experience', icon: 'bolt', color: 'text-blue-500', bar: 'bg-blue-500' },
  { id: 'recognition', label: 'recognition', icon: 'trophy', color: 'text-amber-500', bar: 'bg-amber-500' },
  { id: 'skills', label: 'skills', icon: 'heart', color: 'text-emerald-500', bar: 'bg-emerald-500' },
];

function Section({ index, children }: { index: number; children: ReactNode }) {
  const s = SECTIONS[index];
  return (
    // below lg the sticky section rail sits under the nav, so anchor jumps need more clearance
    <section id={s.id} className="pb-10 sm:pb-14 scroll-mt-32! lg:scroll-mt-[72px]!">
      <SectionHeading text={s.label} icon={s.icon} color={s.color} />
      <div className="flex flex-col border-t border-[var(--border-primary)]">{children}</div>
    </section>
  );
}

// One hairline row: date/meta on the left, content on the right
function Row({ i, bar, meta, children }: { i: number; bar: string; meta: ReactNode; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.3), ease: EASE }}
      className="group relative grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-6 py-5 sm:py-6 border-b border-[var(--border-primary)]"
    >
      <span className={`absolute -left-3 sm:-left-4 top-5 bottom-5 w-[2px] ${bar} opacity-0 group-hover:opacity-50 transition-opacity duration-300`} aria-hidden="true" />
      <div className="sm:col-span-3 font-mono text-[11px] sm:text-xs tracking-wider text-[var(--text-tertiary)] sm:pt-0.5">{meta}</div>
      <div className="sm:col-span-9 min-w-0">{children}</div>
    </motion.div>
  );
}

function EntryRow({ entry, i, bar }: { entry: Entry; i: number; bar: string }) {
  return (
    <Row i={i} bar={bar} meta={entry.when}>
      <h3 className="text-base sm:text-lg font-medium tracking-tight text-[var(--text-primary)]">{entry.org}</h3>
      <p className="mt-0.5 font-mono text-[11px] sm:text-xs tracking-wide text-[var(--text-tertiary)]">{entry.role}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {entry.points.map(p => (
          <li key={p} className="flex items-start gap-3 text-sm sm:text-[15px] text-[var(--text-secondary)] font-light leading-relaxed">
            <span className={`mt-[0.6em] w-1 h-1 shrink-0 ${bar} opacity-60`} aria-hidden="true" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Row>
  );
}

// Tracks which section is under the top third of the viewport
function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

// Miniature of the one-pager: skeleton lines, section bars tinted like the page
function PaperPreview() {
  const line = 'h-[3px] rounded-full bg-[var(--text-muted)]';
  return (
    <a
      href={RESUME_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="open resume pdf in a new tab"
      className="group relative block aspect-[8.5/11] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-[9%] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--text-tertiary)] hover:shadow-xl hover:shadow-black/5"
    >
      <div className="flex flex-col items-center gap-1.5 mb-[8%]">
        <div className="h-[6px] w-2/5 rounded-full bg-[var(--text-tertiary)]" />
        <div className={`${line} w-3/5 opacity-70`} />
      </div>
      {[
        { bar: 'bg-violet-500', rows: [92, 70, 80, 58] },
        { bar: 'bg-blue-500', rows: [95, 88, 72, 90, 60, 84, 77, 93, 66, 81, 70, 89, 74, 62] },
        { bar: 'bg-amber-500', rows: [86, 74, 80, 68] },
        { bar: 'bg-emerald-500', rows: [90, 64, 78] },
      ].map((s, i) => (
        <div key={i} className="mb-[7%] last:mb-0">
          <div className={`h-[4px] w-1/4 rounded-full ${s.bar} opacity-70 mb-2`} />
          <div className="flex flex-col gap-[5px]">
            {s.rows.map((w, j) => (
              <div key={j} className={line} style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-[var(--bg-primary)]/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono text-xs tracking-widest text-[var(--text-primary)]">
        open pdf <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
      </span>
    </a>
  );
}

export default function ResumePage() {
  const active = useActiveSection();

  return (
    <div className="min-h-svh">
      <PageHeader
        title="resume"
        subtitle={`the one-pager, unfolded · updated ${UPDATED}`}
        icon="book"
        iconColor="text-violet-500"
        className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 md:pt-28 pb-8 sm:pb-12"
      >
        <div className="flex items-center gap-2">
          <a
            href={RESUME_URL}
            download={RESUME_FILENAME}
            className="group inline-flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-[11px] sm:text-xs tracking-wider hover:opacity-85 transition-opacity"
          >
            <Download className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
            download pdf
          </a>
          <a
            href={RESUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-full border border-[var(--border-primary)] font-mono text-[11px] sm:text-xs tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)] transition-colors"
          >
            open
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </PageHeader>

      {/* section rail for phones and portrait iPads, where the sidebar is hidden */}
      <nav
        aria-label="resume sections"
        className="lg:hidden sticky top-14 md:top-16 z-40 -mt-4 sm:-mt-6 mb-4 bg-[var(--nav-bg)] backdrop-blur-md"
      >
        <div className="no-scrollbar max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-2 flex gap-1.5 overflow-x-auto">
          {SECTIONS.map(s => {
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={e => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 pointer-coarse:py-3 rounded-full border font-mono text-[11px] tracking-wider transition-colors ${
                  isActive
                    ? 'border-[var(--text-tertiary)] text-[var(--text-primary)]'
                    : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 transition-opacity ${s.bar} ${isActive ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true" />
                {s.label}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        {/* capped below lg so body lines don't run to ~110 characters on a portrait iPad */}
        <main className="lg:col-span-8 min-w-0 w-full max-w-3xl mx-auto lg:max-w-none">
          <Section index={0}>
            {education.map((e, i) => <EntryRow key={e.org} entry={e} i={i} bar="bg-violet-500" />)}
          </Section>

          <Section index={1}>
            {experience.map((e, i) => <EntryRow key={e.org} entry={e} i={i} bar="bg-blue-500" />)}
          </Section>

          <Section index={2}>
            {recognition.map((r, i) => (
              <Row key={r.title} i={i} bar="bg-amber-500" meta={<span className="text-amber-500">{r.tag}</span>}>
                <p className="text-sm sm:text-[15px] font-medium text-[var(--text-primary)] leading-snug">{r.title}</p>
                <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-tertiary)] font-light">{r.detail}</p>
              </Row>
            ))}
          </Section>

          <Section index={3}>
            {skills.map((s, i) => (
              <Row key={s.label} i={i} bar="bg-emerald-500" meta={s.label}>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {s.items.map(item => (
                    <span
                      key={item}
                      className="px-3 py-1 text-sm font-light text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full hover:text-emerald-500 hover:border-emerald-500/40 transition-colors cursor-default"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Row>
            ))}
            <Row i={skills.length} bar="bg-emerald-500" meta="projects">
              <Link to="/portfolio" className="footer-link inline-flex items-center gap-1 pointer-coarse:py-2.5 pointer-coarse:-my-2.5 text-sm sm:text-[15px] text-[var(--text-primary)]">
                see everything i've built <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Row>
          </Section>
        </main>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="hidden lg:block lg:col-span-4"
        >
          {/* the preview shrinks on short laptop screens so the section nav and contacts stay in view */}
          <div className="sticky top-28 flex flex-col gap-8 max-h-[calc(100svh-8rem)] overflow-y-auto no-scrollbar">
            <div className="w-full max-w-[max(10rem,calc((100svh-27rem)*0.7727))]">
              <PaperPreview />
              <div className="mt-3 flex items-center justify-between font-mono text-[11px] tracking-wider text-[var(--text-tertiary)]">
                <span className="normal-case">{RESUME_FILENAME}</span>
                <span>1 page</span>
              </div>
            </div>

            <nav aria-label="resume sections" className="flex flex-col border-t border-[var(--border-primary)]">
              {SECTIONS.map(s => {
                const isActive = active === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={e => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-3 py-2.5 pointer-coarse:py-3 border-b border-[var(--border-primary)] font-mono text-xs tracking-wider transition-colors ${
                      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 transition-opacity ${s.bar} ${isActive ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true" />
                    {s.label}
                  </a>
                );
              })}
            </nav>

            <div className="flex flex-col gap-1.5 pointer-coarse:gap-0 font-mono text-[11px] tracking-wider text-[var(--text-tertiary)]">
              <a href="mailto:jkatariy@purdue.edu" className="footer-link w-fit pointer-coarse:py-2.5 hover:text-[var(--text-primary)]">jkatariy@purdue.edu</a>
              <a href="https://linkedin.com/in/jkatariya" target="_blank" rel="noreferrer" className="footer-link w-fit pointer-coarse:py-2.5 hover:text-[var(--text-primary)]">linkedin.com/in/jkatariya</a>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
