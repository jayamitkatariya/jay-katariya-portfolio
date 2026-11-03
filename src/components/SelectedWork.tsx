import { Link } from 'react-router';
import { projects } from '../data/projects';
import { awardsText, selectedWork } from '../data/home';
import { PixelIcon } from './SectionHeading';

// The only list on the home page. Company at display size, role in mono,
// one proof point on the right. Everything else lives one click deeper.
export default function SelectedWork() {
  return (
    <section
      id="work"
      className="relative mx-auto max-w-6xl scroll-mt-24 px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24 md:px-8 md:pb-20 md:pt-28 xl:max-w-7xl"
    >
      <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] tracking-[0.22em] text-[var(--text-tertiary)]">
        <h2 className="font-mono text-[9px] font-normal tracking-[0.22em] sm:text-[10px]">01 / selected work</h2>
        <Link
          to="/portfolio"
          className="tap-target pointer-coarse:-my-2 pointer-coarse:py-2 transition-colors duration-300 hover:text-[var(--text-primary)]"
        >
          {projects.length} projects ↗
        </Link>
      </div>

      <div className="mt-6 border-t border-[var(--border-primary)]">
        {selectedWork.map((work, i) => (
          <Link
            key={work.company}
            to={work.href}
            className="group grid grid-cols-[1.4rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-b border-[var(--border-primary)] py-5 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:py-6"
          >
            <span className="font-mono text-[8.5px] tracking-widest text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--accent)] sm:text-[9px]">
              {String(i + 1).padStart(2, '0')}
            </span>

            <span className="min-w-0">
              <span className="block font-display text-[clamp(1.55rem,4.6vw,2.7rem)] leading-none tracking-normal text-[var(--text-primary)] transition-transform duration-300 ease-out group-hover:translate-x-1">
                {work.company}
              </span>
              <span className="mt-1.5 block font-mono text-[8.5px] tracking-[0.16em] text-[var(--text-tertiary)] sm:text-[9.5px]">
                {work.role}
              </span>
            </span>

            <span className="justify-self-end text-right font-mono text-[8.5px] tracking-[0.12em] text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--accent)] sm:text-[9.5px]">
              {work.metric}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[8.5px] tracking-[0.14em] text-[var(--text-tertiary)] sm:text-[9.5px]">
        <Link to="/resume#recognition" className="tap-target pointer-coarse:-my-2 pointer-coarse:py-2 flex items-center gap-1.5 text-[var(--accent)]">
          <PixelIcon name="trophy" size={12} instant />
          awards
        </Link>
        <span className="hidden sm:inline">{awardsText}</span>
        <Link
          to="/resume#recognition"
          className="tap-target ml-auto underline decoration-[var(--text-muted)] underline-offset-4 pointer-coarse:-my-2 pointer-coarse:py-2 transition-colors duration-300 hover:text-[var(--text-primary)] hover:decoration-current"
        >
          full list ↗
        </Link>
      </div>
    </section>
  );
}
