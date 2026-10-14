import { readFileSync } from 'node:fs';
import { normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

const sourcesRoot = fileURLToPath(new URL('./sources/', import.meta.url));

/**
 * Dev-only middleware that serves the vendored source files from the repo root, so `fetchSourceDocument`
 * reads `/sources/<file>` in dev exactly as it reads jsDelivr in production. A path that escapes
 * `sources/` is refused.
 */
const serveSources = (): Plugin => ({
  name: 'prakaram-serve-sources',
  configureServer(server) {
    server.middlewares.use('/sources', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '');
      const file = resolve(sourcesRoot, normalize(path));
      if (file !== sourcesRoot && !file.startsWith(sourcesRoot.endsWith(sep) ? sourcesRoot : sourcesRoot + sep)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      try {
        const body = readFileSync(file);
        res.setHeader('content-type', file.endsWith('.json') ? 'application/json' : 'text/plain; charset=utf-8');
        res.end(body);
      } catch {
        // A missing source file is a 404, not the app shell: the runtime expects JSON or nothing.
        res.statusCode = 404;
        res.end('Not found');
      }
    });
  },
});

export default defineConfig({
  plugins: [preact(), serveSources()],
  server: {
    port: 5173,
    host: true,
  },
});
