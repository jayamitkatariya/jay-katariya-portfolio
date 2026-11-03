// Plain data shared by the resume page, agent mode and the build-time llms.txt.
// No React imports: vite.config.ts loads this file too.

export const SITE_URL = 'https://www.jaykatariya.com';
export const RESUME_URL = '/jay-katariya-resume.pdf';
export const RESUME_FILENAME = 'Jay_Katariya_Resume.pdf';
// bump when the pdf in /public changes
export const RESUME_UPDATED = 'nov 2026';

export const summary =
  'integrated business & engineering student (minor in psychology) at purdue university. cofounder and ceo of workro (100+ companies, 50,000+ ai interviews), founder of mindcord (130,000+ members), goldman sachs possibilities summit alum.';

export const about = [
  "hey, i'm currently studying integrated business and engineering at purdue because i like understanding things from first principles. i crave the feeling of creating something out of nothing.",
  'i like writing code, starting companies, shipping side projects, and philosophizing.',
];

export const contact = [
  { label: 'email', value: 'hi@jaykatariya.com', href: 'mailto:hi@jaykatariya.com' },
  { label: 'linkedin', value: 'linkedin.com/in/jkatariya', href: 'https://linkedin.com/in/jkatariya' },
  { label: 'github', value: 'github.com/jayamitkatariya', href: 'https://github.com/jayamitkatariya' },
  { label: 'resume', value: 'jay-katariya-resume.pdf', href: `${SITE_URL}${RESUME_URL}` },
  { label: 'website', value: 'jaykatariya.com', href: SITE_URL },
];

export const pages = [
  { path: '/', label: 'home', description: 'the cover: intro, selected work, photos and contact' },
  { path: '/portfolio', label: 'portfolio', description: 'startups, consulting and personal projects' },
  { path: '/writing', label: 'writing', description: 'notes on building, design and the internet' },
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
      'larsen leaders academy, top 10% · certificate in entrepreneurship & innovation · doster leadership conference',
      'venturex ($5,000 venturex2 grant) · lincoln leadership institute study abroad (fully sponsored) · ta, mgmt 100',
    ],
  },
];

export const experience: ResumeEntry[] = [
  {
    when: 'dec 2025 – now',
    org: 'workro',
    role: 'co-founder & ceo',
    points: [
      'co-founded an ai-native b2b saas company that gives indian smbs intelligent hiring and it operations tools. secured institutional backing from infinity automated solutions. leading the development and marketing teams.',
      'launched workro recruit, an ai-powered recruitment ats with resume screening, proctored interviews and candidate pipelines, and workro desk, an it helpdesk and asset management platform. onboarded 100+ companies.',
      'scaled recruit past 50,000 ai interviews. cut screening time 72%, from 500 applicants to a shortlist of 5 in about 30 minutes.',
    ],
  },
  {
    when: 'sep 2024 – now',
    org: 'purduethink',
    role: 'project manager & consultant, senior advisory board · 6% acceptance',
    points: [
      'led a 5-person consulting team advising united airlines on improving its recruiting pipelines and mileageplus loyalty marketing. built data-driven recommendations and presented them directly to united airlines leadership.',
      "developed a short-, mid-, and long-term growth strategy for careshub's $500k initiative to launch a dedicated mental health clinic for purdue engineering students, spanning marketing, data analytics and geographic expansion.",
    ],
  },
  {
    when: 'jan 2020 – aug 2025',
    org: 'mindcord',
    role: 'founder & ceo',
    points: [
      'built a global stem, entrepreneurship and finance community from zero to 130,000+ members before college through monthly competitions and curated content, with zero outside funding. featured in teenager today.',
      'recognized as a prospect by the thiel fellowship, dorm room fund and z fellows prior to enrolling at purdue.',
    ],
  },
  {
    when: 'may – aug 2026',
    org: 'infinity automated solutions',
    role: 'corporate strategy & ops intern · returned for a second summer',
    points: [
      'led southeast asia market-entry analysis for a packaging-automation manufacturer with 800+ installations and 400+ clients. built financial models and m&a screens to prioritize international expansion.',
      'opened 3 new markets (indonesia, hong kong, singapore), lifting qualified leads 15% and projecting $250k in revenue.',
      'ran company-wide efficiency audits. sat on the deal team that closed a strategic sales agreement with dollar general.',
    ],
  },
  {
    when: '2025',
    org: 'goldman sachs',
    role: 'possibilities summit · 4% acceptance',
    points: [
      'completed a year-long program with senior professionals across investment banking, asset management and markets.',
    ],
  },
  {
    when: 'jul – aug 2024',
    org: 'clemson university',
    role: 'research intern',
    points: [
      'investigated subtractive and additive manufacturing under associate dean xin zhao. sole-authored 2 papers published on ssrn covering high/low-frequency lipss in laser physics and pollutant removal in environmental science.',
    ],
  },
];

export const recognition = [
  { tag: 'winner', title: 'moss long horizon award', detail: 'calhacks 13.0 · uc berkeley, 3,000 hackers' },
  { tag: '1st', title: 'apify 1st customer award', detail: 'calhacks 13.0 · uc berkeley, 3,000 hackers' },
  { tag: '$1k', title: 'burton d. morgan venture concept competition', detail: 'special prize winner, purdue' },
  { tag: 'top 70 / 9k', title: 'tks unicorn scholar', detail: '$500 scholarship, 9,000+ international applicants' },
  { tag: 'top 0.02%', title: 'national cyber olympiad', detail: 'among 5 million students' },
  { tag: '$1.6k', title: 'amp global youth scholar', detail: 'international merit scholarship · un recognition for refugee awareness' },
];

export const skills = [
  { label: 'technical', items: ['javascript', 'typescript', 'python', 'swift', 'rust', 'react', 'react native', 'next.js', 'node.js', 'tauri', 'electron', 'html/css', 'postgresql', 'supabase', 'convex', 'rest apis', 'claude api', 'llm agents', 'git', 'vercel', 'excel', 'matlab', 'fusion 360'] },
  { label: 'languages', items: ['english', 'hindi', 'marathi', 'marwari', 'sanskrit'] },
  { label: 'interests', items: ['premier league', 'swimming', 'soccer (u-16 state silver)', 'standup comedy', 'coding'] },
];

// named on the one-pager; the portfolio page has the full set
export const resumeProjects = ['workro.in', 'assembly labs', 'okidoki', 'char', 'brewed (app store)'];

// names, countries and context only; the world map keeps its own coordinates
export const places = [
  { name: 'pune, india', country: 'india', context: 'hometown' },
  { name: 'west lafayette, indiana', country: 'usa', context: 'purdue university' },
  { name: 'mauritius', country: 'mauritius', context: 'traveled' },
  { name: 'singapore', country: 'singapore', context: 'traveled' },
  { name: 'switzerland', country: 'switzerland', context: 'traveled' },
  { name: 'spain', country: 'spain', context: 'traveled' },
  { name: 'los angeles, california', country: 'usa', context: 'traveled' },
  { name: 'san diego, california', country: 'usa', context: 'traveled' },
  { name: 'gettysburg, pennsylvania', country: 'usa', context: 'lincoln leadership institute' },
  { name: 'chicago, illinois', country: 'usa', context: 'traveled' },
  { name: 'indianapolis, indiana', country: 'usa', context: 'traveled' },
  { name: 'cincinnati, ohio', country: 'usa', context: 'traveled' },
];
