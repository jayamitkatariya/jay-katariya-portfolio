// Plain data shared by the resume page, agent mode and the build-time llms.txt.
// No React imports: vite.config.ts loads this file too.

export const SITE_URL = 'https://www.jaykatariya.com';
export const RESUME_URL = '/jay-katariya-resume.pdf';
export const RESUME_FILENAME = 'Jay_Katariya_Resume.pdf';
// bump when the pdf in /public changes
export const RESUME_UPDATED = 'may 2026';

export const summary =
  'integrated business & engineering student (minor in psychology) at purdue university. cofounder and ceo of workro, founder of mindcord (130k+ members), goldman sachs possibilities summit alum.';

export const about = [
  "hey, i'm currently studying integrated business and engineering at purdue because i like understanding things from first principles. i crave the feeling of creating something out of nothing.",
  'i like to write code, build innovative platforms, do entrepreneurship, produce projects, and philosophize.',
];

export const contact = [
  { label: 'email', value: 'jkatariy@purdue.edu', href: 'mailto:jkatariy@purdue.edu' },
  { label: 'linkedin', value: 'linkedin.com/in/jkatariya', href: 'https://linkedin.com/in/jkatariya' },
  { label: 'resume', value: 'jay-katariya-resume.pdf', href: `${SITE_URL}${RESUME_URL}` },
  { label: 'website', value: 'jaykatariya.com', href: SITE_URL },
];

export const pages = [
  { path: '/', label: 'home', description: 'about, current work, recognition, skills, travel, contact' },
  { path: '/portfolio', label: 'portfolio', description: 'startups, consulting, freelance and personal projects' },
  { path: '/memories', label: 'memories', description: 'photo gallery' },
  { path: '/resume', label: 'resume', description: 'the one-page resume, unfolded' },
];

export interface ResumeEntry {
  when: string;
  org: string;
  role: string;
  points: string[];
}

export const education: ResumeEntry[] = [
  {
    when: 'exp. may 2028',
    org: 'purdue university',
    role: 'b.s. integrated business & engineering · minor in psychology',
    points: [
      "dean's list & semester honors",
      'larsen leaders academy, top 10% of daniels · certificate in entrepreneurship & innovation',
      'lincoln leadership institute study abroad, gettysburg, pa (fully sponsored)',
      'ta for mgmt 100 · venturex · doster leadership conference · im soccer',
    ],
  },
];

export const experience: ResumeEntry[] = [
  {
    when: 'dec 2025 — now',
    org: 'workro',
    role: 'co-founder & ceo',
    points: [
      'building an ai-native people platform for indian smbs, backed by infinity automated solutions. leading the dev and marketing teams.',
      'workro desk and workro recruit are live with 100+ companies onboarded. recruit runs ai resume screening, proctored interviews and candidate pipelines.',
    ],
  },
  {
    when: 'sep 2024 — now',
    org: 'purduethink',
    role: 'project manager & consultant, senior advisory board · 6% acceptance',
    points: [
      'leading a 5-person team advising united airlines on recruiting pipeline strategy and mileageplus loyalty, presenting directly to united leadership.',
      "built a short, mid and long-term growth strategy for careshub's $500k initiative across marketing, data analytics and geographic expansion.",
    ],
  },
  {
    when: "summers '25 & '26",
    org: 'infinity automated solutions',
    role: 'corporate strategy & ops intern',
    points: [
      'ran audits across every department and built systems to improve efficiency. on the deal team negotiating a sales deal with dollar general.',
      'led southeast asia market-entry analysis with financial models and m&a screens. opened 3 markets (indonesia, hong kong, singapore) for a 15% lift in qualified leads and a projected $250k in new revenue.',
      'built infinitysols.com from scratch.',
    ],
  },
  {
    when: 'jan 2020 — aug 2025',
    org: 'mindcord',
    role: 'founder & ceo',
    points: [
      'grew a 130k+ member global stem, entrepreneurship and finance community from zero with monthly competitions, no outside backing, before college. featured in teenager today.',
      'flagged as a prospect by the thiel fellowship, dorm room fund and z fellows.',
    ],
  },
  {
    when: '2025',
    org: 'goldman sachs',
    role: 'possibilities summit · 4% acceptance',
    points: [
      'year-long program working with gs professionals across investment banking, asset management and markets on capital markets, deal structuring and investment strategy.',
    ],
  },
  {
    when: 'jul — aug 2024',
    org: 'clemson university',
    role: 'research intern',
    points: [
      'studied subtractive and additive manufacturing under associate dean xin zhao. sole-authored 2 peer-reviewed papers on ssrn (lipss in laser physics, pollutant removal).',
    ],
  },
];

export const recognition = [
  { tag: '$1k', title: 'burton d. morgan venture concept competition', detail: 'special prize winner, purdue' },
  { tag: '$5k', title: 'purdue venturex2', detail: 'venture grant' },
  { tag: 'top 70 / 9k', title: 'tks unicorn scholar', detail: '$500 scholarship, international pool' },
  { tag: 'top 0.02%', title: 'national cyber olympiad', detail: 'among 5 million students' },
  { tag: '$1.6k', title: 'amp global youth scholar', detail: 'international merit scholarship · un recognition for refugee awareness' },
  { tag: '$1k', title: 'dartmouth cid alumni scholar', detail: 'creativity, innovation + design program' },
  { tag: '2 papers', title: 'published researcher', detail: 'ssrn · laser physics, environmental science' },
  { tag: 'silver', title: 'state-level football', detail: 'u-16' },
];

export const skills = [
  { label: 'technical', items: ['javascript', 'react', 'react native', 'html/css', 'python', 'node.js', 'postgresql', 'rest apis', 'excel', 'matlab', 'fusion 360'] },
  { label: 'languages', items: ['english', 'hindi', 'marathi', 'marwari', 'sanskrit'] },
  { label: 'interests', items: ['premier league', 'swimming', 'soccer', 'standup comedy', 'coding', 'robotics'] },
];

// names and context only; the world map keeps its own coordinates
export const places = [
  { name: 'pune, india', context: 'hometown' },
  { name: 'west lafayette, indiana', context: 'purdue university' },
  { name: 'mauritius', context: 'traveled' },
  { name: 'singapore', context: 'traveled' },
  { name: 'switzerland', context: 'traveled' },
  { name: 'spain', context: 'traveled' },
  { name: 'los angeles, california', context: 'traveled' },
  { name: 'san diego, california', context: 'traveled' },
  { name: 'gettysburg, pennsylvania', context: 'lincoln leadership institute' },
  { name: 'chicago, illinois', context: 'traveled' },
  { name: 'indianapolis, indiana', context: 'traveled' },
  { name: 'cincinnati, ohio', context: 'traveled' },
];
