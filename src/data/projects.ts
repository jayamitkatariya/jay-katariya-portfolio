// typed, so a typo can't create a project with no filter chip
export type ProjectType = 'startup' | 'consulting' | 'freelance' | 'personal';

export interface ProjectPreview {
  gif: string;
  poster: string;
  placeholder: string;
  alt: string;
}

export interface Project {
  type: ProjectType;
  name: string;
  description: string;
  tags: string[];
  url?: string;
  preview?: ProjectPreview;
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
    description: "it helpdesk and asset management that doesn't suck",
    tags: ["web development", "startup", "workspace"],
    url: "https://desk.workro.in"
  },
  {
    type: "startup",
    name: "workro recruit",
    description: "b2b recruitment saas: ai resume screening, proctored interviews and candidate pipelines",
    tags: ["web development", "startup", "recruiting"],
    url: "https://workrohr.com"
  },
  {
    type: "consulting",
    name: "united airlines",
    description: "led a five-person team on united's recruiting pipeline and mileageplus marketing",
    tags: ["strategy", "data analytics", "recruiting", "marketing"]
  },
  {
    type: "consulting",
    name: "careshub",
    description: "led a $500k project to establish a mental health services clinic at purdue for engineering students",
    tags: ["consulting", "strategy", "mental health", "purdue"]
  },
  {
    type: "personal",
    name: "bucket",
    description: "your clipboard, living in the notch. ocr, background removal, moodboards, all local",
    tags: ["macos", "swift", "swiftui", "clipboard", "open source"],
    url: "https://github.com/jayamitkatariya/bucket",
    preview: {
      gif: "/launch/bucket.gif",
      poster: "/launch/bucket-poster.jpg",
      placeholder: "/launch/bucket-poster-blur.jpg",
      alt: "screen recording of the bucket clipboard panel dropping down from the macbook notch, showing copied links, images, colors and a moodboard"
    }
  },
  {
    type: "personal",
    name: "char",
    description: "local-first notepad that turns messy notes into todos and hands tasks to your agent",
    tags: ["macos", "electron", "ai", "notes", "open source"],
    url: "https://getchar.xyz",
    preview: {
      gif: "/launch/char.gif",
      poster: "/launch/char-poster.jpg",
      placeholder: "/launch/char-poster-blur.jpg",
      alt: "screen recording of char turning a brain dump note into a checklist of to-dos and an ideas list"
    }
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
    url: "https://github.com/jayamitkatariya/mote",
    preview: {
      gif: "/launch/mote.gif",
      poster: "/launch/mote-poster.jpg",
      placeholder: "/launch/mote-poster-blur.jpg",
      alt: "screen recording of shaking the cursor to summon a translucent mote notepad over an article, then typing a note"
    }
  },
  {
    type: "personal",
    name: "brewed",
    description: "closed-source ios dating app for dating with intention. live on the app store",
    tags: ["ios", "expo", "react native", "supabase", "closed source"],
    url: "https://apps.apple.com/us/app/brewed-dating/id6791085244"
  }
];
