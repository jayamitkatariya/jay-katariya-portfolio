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
    type: "consulting",
    name: "united airlines",
    description: "led a team of five to improve recruiting pipelines, enhance MileagePlus marketing, and drive data-driven strategy",
    tags: ["strategy", "data analytics", "recruiting", "marketing"]
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
    name: "clickyyy",
    description: "shake your cursor to summon an ai agent that sees your screen and clicks, types, and acts for you",
    tags: ["macos", "electron", "ai agent", "typescript", "open source"],
    url: "https://github.com/jayamitkatariya/clickyyy"
  },
  {
    type: "personal",
    name: "cue",
    description: "ask your screen anything. ⌥c drops a glass overlay with your screen attached and any vision model answers back",
    tags: ["macos", "tauri", "rust", "ai", "open source"],
    url: "https://github.com/jayamitkatariya/cue"
  },
  {
    type: "personal",
    name: "localmind",
    description: "bring-your-own-key ai chat that stays on your machine. live web search, file attachments, local tools",
    tags: ["tauri", "react", "typescript", "llm", "open source"],
    url: "https://github.com/jayamitkatariya/localmind"
  },
  {
    type: "personal",
    name: "bucket",
    description: "your clipboard, living in the notch. ocr, background removal, moodboards — all local",
    tags: ["macos", "swift", "swiftui", "clipboard", "open source"],
    url: "https://github.com/jayamitkatariya/bucket"
  },
  {
    type: "personal",
    name: "persona cli",
    description: "notes, tasks, and an ai that knows your files. one folder of plain markdown, no cloud",
    tags: ["node.js", "typescript", "cli", "markdown", "local-first"],
    url: "https://github.com/jayamitkatariya/personacli"
  },
  {
    type: "personal",
    name: "mote",
    description: "shake-to-write overlay notepad for macos. scribble on your screen, vanish when you're done",
    tags: ["macos", "tauri", "rust", "notes", "open source"],
    url: "https://github.com/jayamitkatariya/mote"
  },
  {
    type: "personal",
    name: "brewed",
    description: "closed-source ios dating app. dating with intention — live on the app store",
    tags: ["ios", "expo", "react native", "supabase", "closed source"],
    url: "https://apps.apple.com/us/app/brewed-dating/id6791085244"
  }
];
