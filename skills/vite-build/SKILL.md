---
name: vite-build
description: Vite dev server, production build, preview, bundle analysis, and common pitfalls for frontend applications. Opinionated for the stack company's Vite + TypeScript base.
---

## Purpose

This skill covers the full Vite lifecycle for frontend apps in the stack company: local dev, production builds, preview, bundle analysis, and integration with the release pipeline. All commands assume `bun` as the package manager and TypeScript as the primary language.

## Commands

```bash
# Start dev server (hot module replacement enabled)
bun run dev

# Production build (outputs to dist/)
bun run build

# Preview the production build locally
bun run preview

# Type-check without emitting (run before build in CI)
bun run typecheck

# Analyze bundle composition
bunx vite-bundle-visualizer

# Clear Vite's dependency cache and restart
rm -rf node_modules/.vite && bun run dev
```

In CI, always run `bun run typecheck && bun run build` in sequence. Type errors do not block the Vite build by default; the typecheck step catches them explicitly.

## Configuration

Minimal `vite.config.ts` for a typical stack app:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Set base to '/' for root-hosted apps, or '/subpath/' for sub-path deploys
  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    // Expose build-time constants (not secrets)
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Target modern browsers; adjust if legacy support is needed
    target: 'es2020',

    // Source maps: enable for Sentry-style upload, disable for public bundles
    sourcemap: false,

    rollupOptions: {
      // Multi-entry example (e.g., main app + admin panel)
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Manual chunking keeps vendor code separate from app code
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

Key options to know:

- `base`: must match the path prefix where the app is served. Wrong value breaks asset loading silently.
- `build.target`: `es2020` covers all modern browsers. Drop to `es2015` only if analytics show legacy traffic.
- `resolve.alias`: use `@` for `src/` imports. Keeps paths short and refactor-safe.
- `define`: injects constants at build time. Values are inlined as literals, not runtime variables.

## Environment Variables

Vite exposes only variables prefixed with `VITE_` to client code. Everything else is stripped at build time.

```bash
# .env (committed, non-secret defaults)
VITE_API_BASE_URL=https://api.example.com
VITE_FEATURE_FLAGS=false

# .env.local (gitignored, developer overrides)
VITE_API_BASE_URL=http://localhost:8080
```

Access in code:

```typescript
const apiBase = import.meta.env.VITE_API_BASE_URL
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD
```

**Never put secrets in `VITE_` variables.** Once bundled, they are readable in the browser. API keys, tokens, and credentials belong server-side only. Use `define` for build-time constants that are genuinely public (version strings, feature flags).

`.env.local` overrides `.env` for local dev. Both are loaded automatically. In CI, set `VITE_*` vars as pipeline environment variables, not in committed files.

## Dev Server Gotchas

**HMR stops working after adding a new file:**
Vite's file watcher sometimes misses new files on Linux. Restart the dev server. If it recurs, add `server.watch: { usePolling: true }` (slower but reliable in Docker or WSL).

**Dependency pre-bundling is stale:**
Vite pre-bundles `node_modules` into `node_modules/.vite` on first run. If a dep updates or you add a new one and HMR breaks, clear the cache:

```bash
rm -rf node_modules/.vite && bun run dev
```

**New dep not recognized by Vite's optimizer:**
Some packages (especially CJS-only ones) need explicit inclusion:

```typescript
optimizeDeps: {
  include: ['some-cjs-package', 'another-legacy-dep'],
}
```

**Port conflicts:**
Default port is 5173 (Vite default) or 3000 (if configured). If something else owns the port, Vite increments automatically. Check the terminal output for the actual URL.

**Proxy not forwarding cookies:**
Add `cookieDomainRewrite: 'localhost'` to the proxy config when the backend sets `Domain` on cookies.

## Production Build

```bash
bun run build
```

Output lands in `dist/`. The directory is fully self-contained: HTML, JS chunks, CSS, and hashed assets.

**Asset hashing:** Vite appends content hashes to filenames (`main.a1b2c3.js`). This enables aggressive CDN caching. Do not rename or strip hashes.

**Minification:** Vite uses esbuild for JS minification by default. It is fast and sufficient. For maximum compression, switch to `build.minify: 'terser'` (slower, ~5-10% smaller).

**Source maps for error tracking:**
```typescript
build: {
  sourcemap: 'hidden', // generates maps but does not reference them in bundles
}
```
Upload maps to Sentry (or equivalent) during CI, then delete them from `dist/` before deploying. Never ship source maps publicly.

**Chunking strategy:**
Keep vendor chunks separate from app code. This way, a code change does not bust the vendor cache. The `manualChunks` example in the config section above is the baseline. Add more splits if `vendor` grows past ~500 KB.

**Build size check:**
```bash
bun run build && du -sh dist/assets/*.js | sort -h
```
Flag any chunk over 300 KB for investigation before merging.

## Integration With Release

The `dist/` directory is the build artifact. It feeds directly into the release pipeline:

1. `bun run build` runs in CI (GitHub Actions).
2. The `dist/` contents are copied into the container image by the Dockerfile.
3. `k8s-deploy` publishes the image to the cluster. The container serves `dist/` via nginx or a static file server.
4. `github-actions-release` tags the commit and creates a GitHub release with the build artifact attached.

Do not commit `dist/` to the repo. It is generated in CI. The `.gitignore` should include `dist/`.

If the build step fails in CI, the release pipeline stops. Fix the build locally first with `bun run build` before pushing.

## Pitfalls

**`process.env` does not work in Vite.**
Vite uses `import.meta.env`, not `process.env`. Code that worked in webpack or CRA will silently get `undefined`. Replace all `process.env.VITE_*` references with `import.meta.env.VITE_*`.

**Absolute imports break in some environments.**
Prefer `@/` alias imports over bare absolute paths. Bare paths like `/src/utils/foo` work in the browser but fail in Vitest and some editors without extra config.

**CSS module class name collisions.**
Vite scopes CSS modules by default, but global CSS files are not scoped. Avoid generic class names (`.container`, `.wrapper`) in global CSS. They will leak into components.

**`import.meta.url` in Web Workers.**
Workers need special handling in Vite:
```typescript
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
```
Using a plain string path will fail in production builds.

**SSR hydration mismatches.**
If the app uses SSR (e.g., with a Node server), ensure the server and client render identical HTML. Date formatting, random IDs, and browser-only APIs (`window`, `document`) are common sources of mismatch. Guard browser-only code with `if (typeof window !== 'undefined')`.

**`define` values are not strings by default.**
`define: { FOO: 'bar' }` injects `bar` as a bare identifier, not the string `"bar"`. Always wrap string values: `define: { FOO: JSON.stringify('bar') }`.
