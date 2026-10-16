import { useEffect, useRef, useState } from 'react';
import AgentModeToggle from './AgentModeToggle';
import {
  RESUME_UPDATED, summary, about, contact, pages,
  education, experience, recognition, skills, places, type ResumeEntry,
} from '../data/profile';
import { projects } from '../data/projects';
import { buildAgentMarkdown } from '../lib/agentMarkdown';

interface AgentViewProps {
  onExit: () => void;
}

function Entry({ e }: { e: ResumeEntry }) {
  return (
    <article>
      <h3>{e.org}</h3>
      <p className="agent-meta">{e.role} · <time>{e.when}</time></p>
      <ul>
        {e.points.map(p => <li key={p}>{p}</li>)}
      </ul>
    </article>
  );
}

// The whole site as one semantic document. Styled like markdown in a terminal
// (prefixes come from css), but it's real headings, lists and links underneath.
export default function AgentView({ onExit }: AgentViewProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildAgentMarkdown());
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const now = experience.filter(e => e.when.includes('now'));

  return (
    <div className="agent-doc min-h-svh font-mono text-[13px] sm:text-sm leading-relaxed text-[var(--text-secondary)] px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <div className="max-w-[72ch] mx-auto">
        <header className="mb-10 border border-dashed border-[var(--border-primary)] rounded-md px-4 py-3 text-[11px] sm:text-xs tracking-wide">
          <p className="text-[var(--text-primary)]">
            <span aria-hidden="true">● </span>agent mode
          </p>
          <p className="mt-1">this page is plain, semantic and machine-readable. no js needed for the raw version.</p>
          <nav aria-label="agent mode" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a href="/llms.txt">/llms.txt</a>
            <a href="/index.md">/index.md</a>
            <button type="button" onClick={copy} className="agent-link">{copied ? 'copied ✓' : 'copy as markdown'}</button>
            <button type="button" onClick={onExit} className="agent-link">exit agent mode</button>
          </nav>
        </header>

        <main>
          <h1>jay katariya</h1>
          <blockquote>{summary}</blockquote>

          <section aria-labelledby="agent-about">
            <h2 id="agent-about">about</h2>
            {about.map(p => <p key={p}>{p}</p>)}
          </section>

          <section aria-labelledby="agent-now">
            <h2 id="agent-now">now</h2>
            <ul>
              {now.map(e => <li key={e.org}><strong>{e.org}</strong>: {e.role}</li>)}
            </ul>
          </section>

          <section aria-labelledby="agent-experience">
            <h2 id="agent-experience">experience</h2>
            {experience.map(e => <Entry key={e.org} e={e} />)}
          </section>

          <section aria-labelledby="agent-education">
            <h2 id="agent-education">education</h2>
            {education.map(e => <Entry key={e.org} e={e} />)}
          </section>

          <section aria-labelledby="agent-projects">
            <h2 id="agent-projects">projects</h2>
            <ul>
              {projects.map(p => (
                <li key={p.name}>
                  {p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a> : <strong>{p.name}</strong>}
                  {' '}({p.type}): {p.description}
                  <span className="agent-tags"> [{p.tags.join(', ')}]</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="agent-recognition">
            <h2 id="agent-recognition">recognition</h2>
            <ul>
              {recognition.map(r => <li key={r.title}><strong>{r.title}</strong> ({r.tag}): {r.detail}</li>)}
            </ul>
          </section>

          <section aria-labelledby="agent-skills">
            <h2 id="agent-skills">skills</h2>
            <dl>
              {skills.map(s => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.items.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="agent-places">
            <h2 id="agent-places">places</h2>
            <ul>
              {places.map(p => <li key={p.name}>{p.name}: {p.context}</li>)}
            </ul>
          </section>

          <section aria-labelledby="agent-contact">
            <h2 id="agent-contact">contact</h2>
            <ul>
              {contact.map(c => (
                <li key={c.label}>{c.label}: <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{c.value}</a></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="agent-pages">
            <h2 id="agent-pages">pages</h2>
            <ul>
              {pages.map(p => (
                <li key={p.path}><a href={p.path}>{p.label}</a>: {p.description}</li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="mt-14 pt-6 border-t border-dashed border-[var(--border-primary)] flex flex-wrap items-center justify-between gap-3 text-[10px] sm:text-[11px] tracking-widest">
          <AgentModeToggle isAgent onToggle={onExit} />
          <span className="text-[var(--text-tertiary)]">resume updated {RESUME_UPDATED} · © {new Date().getFullYear()} jay katariya</span>
        </footer>
      </div>
    </div>
  );
}
