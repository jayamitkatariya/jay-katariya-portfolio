export interface Project {
  type: string;
  name: string;
  description: string;
  tags: string[];
  url?: string;
}

export const projects: Project[] = [
  {
    type: "startup",
    name: "mindcord",
    description: "130k+ member global stem, entrepreneurship & finance community. featured in teenager today",
    tags: ["react", "node.js", "ai/ml", "postgresql"]
  },
  {
    type: "startup",
    name: "workro desk",
    description: "workspace management that doesn't suck",
    tags: ["web development", "startup", "workspace"],
    url: "https://desk.workro.in"
  },
  {
    type: "startup",
    name: "workro recruit",
    description: "cofounded this b2b recruitment saas",
    tags: ["web development", "startup", "recruiting"],
    url: "https://workrohr.com"
  },
  {
    type: "startup",
    name: "workro people",
    description: "hr platform, launching soon",
    tags: ["web development", "startup", "hr", "coming soon"]
  },
  {
    type: "consulting",
    name: "united airlines",
    description: "led a team of five to improve recruiting pipelines, enhance MileagePlus marketing, and drive data-driven strategy",
    tags: ["strategy", "data analytics", "recruiting", "marketing"]
  },
  {
    type: "startup",
    name: "figur8",
    description: "ranked 4th/2000 in a hackathon. ai consulting engine delivering mbb-level strategic analysis in hours, not months",
    tags: ["ai/ml", "consulting", "startup", "strategy"]
  },
  {
    type: "freelance",
    name: "infinitysols.com",
    description: "built the website for infinity automated solutions",
    tags: ["web development", "freelance", "client work"],
    url: "https://infinitysols.com"
  },
  {
    type: "personal",
    name: "planout.me",
    description: "your thoughts, captured & organized. ai companion that turns voice or text in any language into beautiful notes",
    tags: ["ai/ml", "react", "typescript", "notes"],
    url: "https://planout.me"
  },
  {
    type: "consulting",
    name: "careshub",
    description: "short, mid, and long-term strategic planning engagement",
    tags: ["strategy", "consulting", "business planning"]
  },
  {
    type: "consulting",
    name: "psg consulting",
    description: "improved transparency between the student body, student government, and senate at purdue",
    tags: ["consulting", "strategy", "student government"]
  },
  {
    type: "personal",
    name: "notabook.xyz",
    description: "fck notion. project management tool built because nothing else cut it",
    tags: ["react", "typescript", "tailwind", "vercel"],
    url: "https://notabook.xyz"
  },
  {
    type: "personal",
    name: "instasched",
    description: "when2meet + calendly alternative. scheduling made simple and collaborative",
    tags: ["react", "typescript", "scheduling", "collaboration"],
    url: "https://planout.me"
  },
  {
    type: "personal",
    name: "typeshit",
    description: "rich text editor with word counter. made it coz i hate wordcounter.net",
    tags: ["javascript", "html", "css", "rich text"],
    url: "https://typeshitt.vercel.app"
  }
];
