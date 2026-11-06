import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {buildAgentMarkdown} from './src/lib/agentMarkdown';
import {writingNotes} from './src/data/writing';

// The site as plain markdown for agents that don't run JS: /llms.txt, plus /index.md
// for agents that try "append .md". Built from the same data the pages render.
function agentFiles(): Plugin {
  const files = {
    'llms.txt': 'text/plain; charset=utf-8',
    'index.md': 'text/markdown; charset=utf-8',
  };
  return {
    name: 'agent-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].slice(1) as keyof typeof files;
        if (!Object.hasOwn(files, name)) return next();
        res.setHeader('Content-Type', files[name]);
        res.end(buildAgentMarkdown());
      });
    },
    generateBundle() {
      const source = buildAgentMarkdown();
      for (const fileName of Object.keys(files)) {
        this.emitFile({type: 'asset', fileName, source});
      }
    },
  };
}

// One index.html per page, so crawlers that read the raw HTML see that page's own title and
// canonical url instead of the home page's. The SPA takes over from there as usual.
function routeHtml(): Plugin {
  const SITE = 'https://www.jaykatariya.com';
  // [title, description]; every page gets its own, or search and link previews all show the home page's
  const pages: Record<string, [string, string]> = {
    portfolio: ['Portfolio | Jay Katariya', 'Startups, consulting and personal projects by Jay Katariya: Workro, MindCord and more, with demos and source.'],
    writing: ['Writing | Jay Katariya', 'Short notes by Jay Katariya on building things, design and the making of this site.'],
    memories: ['Memories | Jay Katariya', 'A contact sheet of 68 photos: friends, travel, home, the lab, the water, the win.'],
    resume: ['Resume | Jay Katariya', 'Resume of Jay Katariya: Integrated Business & Engineering at Purdue, Cofounder & CEO of Workro, founder of MindCord.'],
    ...Object.fromEntries(writingNotes.map(note => [`writing/${note.slug}`, [`${note.title} | Jay Katariya`, note.lede]])),
  };
  const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return {
    name: 'route-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const index = bundle['index.html'];
      if (index?.type !== 'asset') return;
      const html = String(index.source);
      for (const [route, [title, description]] of Object.entries(pages)) {
        const url = `${SITE}/${route}`;
        const source = html
          .replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`)
          .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, `$1${attr(title)}"`)
          .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*"/g, `$1${attr(description)}"`)
          .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
          .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`);
        this.emitFile({type: 'asset', fileName: `${route}/index.html`, source});
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), agentFiles(), routeHtml()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // browser binaries and test artifacts sometimes land in the project root and
      // the watcher then churns through hundreds of MB (and errors when they vanish)
      watch: {
        ignored: ['**/.pw-browsers/**', '**/playwright-report/**', '**/test-results/**'],
      },
    },
  };
});
