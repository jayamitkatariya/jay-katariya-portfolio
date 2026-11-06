// The home page is deliberately an index, not a résumé. Four rows, one line
// each, and a link into the page where the detail already lives.
import { projects } from './projects';

export interface WorkRow {
  company: string;
  role: string;
  metric: string;
  href: string;
}

export const selectedWork: WorkRow[] = [
  { company: 'workro', role: 'cofounder & ceo', metric: '100+ companies', href: '/portfolio#workro-recruit' },
  { company: 'mindcord', role: 'founder & ceo', metric: '130k members', href: '/portfolio#mindcord' },
  { company: 'purdue think', role: 'project manager', metric: 'united airlines', href: '/portfolio#united-airlines' },
  { company: 'side projects', role: 'builder', metric: `${projects.length} shipped`, href: '/portfolio' },
];

// One texture line; the full list is on /resume#recognition.
export const awardsText = 'moss + apify @ calhacks · morgan $1k · venturex2 $5k';

// The same three, split for phones: a tiny two-line ledger instead of one long run.
export const awardsShort = [
  { name: 'moss + apify', where: 'calhacks' },
  { name: 'morgan', where: '$1k prize' },
  { name: 'venturex2', where: '$5k' },
];

// A curated contact sheet from the 68-photo roll: friends, travel, home,
// childhood, the lab, the water, the win. Order is about rhythm, not chronology.
// ar = width / height, so every print keeps its true orientation.
export interface FilmstripPhoto {
  n: number;
  ar: number;
}

export const filmstripPhotos: FilmstripPhoto[] = [
  { n: 52, ar: 1.333 },
  { n: 16, ar: 0.562 },
  { n: 6, ar: 0.75 },
  { n: 62, ar: 1.333 },
  { n: 10, ar: 0.75 },
  { n: 41, ar: 0.75 },
  { n: 27, ar: 0.75 },
  { n: 51, ar: 0.562 },
  { n: 64, ar: 0.562 },
];
