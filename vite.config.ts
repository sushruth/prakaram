import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

const sourcesRoot = fileURLToPath(new URL('./sources/', import.meta.url));

/**
 * Resolve the jsDelivr pin for the vendored `sources/` at build time. Precedence:
 *   1. `VITE_SOURCES_PIN` — a CI/deploy override;
 *   2. the last commit that touched `sources/` — the commit the data actually landed in;
 *   3. the build's own commit (`WORKERS_CI_COMMIT_SHA` / `CF_PAGES_COMMIT_SHA`);
 *   4. `'local'`.
 * A shallow clone or a checkout without history must not fail the build, so the git call is guarded.
 */
const resolveSourcesPin = (): string => {
  const override = process.env.VITE_SOURCES_PIN?.trim();
  if (override) return override;
  try {
    const sha = execSync('git log -1 --format=%H -- sources/', { encoding: 'utf8' }).trim();
    if (sha) return sha;
  } catch {
    // No git, a shallow clone or no history: fall through to the build's own commit.
  }
  return process.env.WORKERS_CI_COMMIT_SHA?.trim() || process.env.CF_PAGES_COMMIT_SHA?.trim() || 'local';
};

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

export default defineConfig(({ command }) => {
  const sourcesPin = resolveSourcesPin();
  if (command === 'build') console.log(`[prakaram] vendored sources pin: ${sourcesPin}`);
  return {
    plugins: [preact(), serveSources()],
    // Injected at build time so a `sources/` refresh needs only commit + deploy (no manual bump).
    define: { 'import.meta.env.VITE_SOURCES_PIN': JSON.stringify(sourcesPin) },
    // Latest browser + one previous version (see package.json `browserslist` and AGENTS.md §2).
    build: { target: 'es2023' },
    server: {
      port: 5173,
      host: true,
    },
  };
});
