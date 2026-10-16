// The whole site as one markdown document, following the llms.txt convention.
// Emitted at build time as /llms.txt and /index.md, and copied from agent mode.
import {
  SITE_URL, RESUME_UPDATED, summary, about, contact, pages,
  education, experience, recognition, skills, places, type ResumeEntry,
} from '../data/profile';
import { projects } from '../data/projects';

const entry = (e: ResumeEntry) =>
  [`### ${e.org}`, `${e.role} · ${e.when}`, '', ...e.points.map(p => `- ${p}`)].join('\n');

export function buildAgentMarkdown(): string {
  const now = experience.filter(e => e.when.includes('now'));
  return [
    '# Jay Katariya',
    '',
    `> ${summary}`,
    '',
    `this is the plain-text version of ${SITE_URL}, written for ai agents and llms. everything on the visual site is here. resume last updated ${RESUME_UPDATED}.`,
    '',
    '## About',
    '',
    about.join('\n\n'),
    '',
    '## Now',
    '',
    ...now.map(e => `- ${e.org}: ${e.role}`),
    '',
    '## Experience',
    '',
    experience.map(entry).join('\n\n'),
    '',
    '## Education',
    '',
    education.map(entry).join('\n\n'),
    '',
    '## Projects',
    '',
    ...projects.map(p =>
      `- ${p.url ? `[${p.name}](${p.url})` : p.name} (${p.type}): ${p.description}. tags: ${p.tags.join(', ')}`,
    ),
    '',
    '## Recognition',
    '',
    ...recognition.map(r => `- ${r.title} (${r.tag}): ${r.detail}`),
    '',
    '## Skills',
    '',
    ...skills.map(s => `- ${s.label}: ${s.items.join(', ')}`),
    '',
    '## Places',
    '',
    ...places.map(p => `- ${p.name}: ${p.context}`),
    '',
    '## Contact',
    '',
    ...contact.map(c => `- ${c.label}: [${c.value}](${c.href})`),
    '',
    '## Pages',
    '',
    ...pages.map(p => `- [${p.label}](${SITE_URL}${p.path}): ${p.description}`),
    '',
  ].join('\n');
}
