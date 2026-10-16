import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {buildAgentMarkdown} from './src/lib/agentMarkdown';

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
  const pages = {
    portfolio: 'Portfolio | Jay Katariya',
    memories: 'Memories | Jay Katariya',
    resume: 'Resume | Jay Katariya',
  };
  return {
    name: 'route-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const index = bundle['index.html'];
      if (index?.type !== 'asset') return;
      const html = String(index.source);
      for (const [route, title] of Object.entries(pages)) {
        const url = `${SITE}/${route}`;
        const source = html
          .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, `$1${title}"`)
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
    },
  };
});
