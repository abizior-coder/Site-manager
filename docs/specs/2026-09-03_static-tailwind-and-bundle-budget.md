# Static Tailwind and a bundle budget

**Status: implemented 2026-09-03** (accepted the same day: "Tailwind statycznie i bundle
poniżej 350 KB"). Result: first paint 319 KB of JS + 118 KB languages (EN+DE) + 16 KB CSS; the whole build is split into 24 chunks.

## Goal

The app must load fast on a site phone with one bar of signal, and it must
not depend on a third-party script that can change under it. Two things:

1. **Tailwind built at build time.** The play CDN (a 400 KB script that
   compiles classes in the browser, fetched from cdn.tailwindcss.com with
   no integrity hash — audit item L1) is replaced by a `tailwind.css`
   generated from the classes the source actually uses.
2. **A budget for the first load: `bundle.js` under 350 KB** (minified,
   uncompressed, as committed). Everything the first screen does not need
   is loaded on demand as a separate chunk.

## Where the 1.2 MB goes (measured 2026-09-03)

| Part | KB | Share |
|---|---|---|
| 14 language files | 578 | 47.6 % |
| app code (`roofing-site-manager.jsx`) | 394 | 32.5 % |
| react-dom + react + scheduler | 142 | 11.7 % |
| qrcode | 23 | 1.9 % |
| lucide-react (used icons only) | 18 | 1.5 % |
| the rest | 60 | 5 % |

## Plan

- **Languages on demand.** `i18n/index.js` stops importing all fourteen
  files. `loadLang(code)` imports one file as a chunk; English stays the
  fallback and is loaded with the first language before the app mounts.
  Switching language loads its chunk and re-renders. Result: 0 KB of
  translations in the main bundle, one ~40 KB chunk per language in use.
- **Code splitting.** esbuild builds with `--splitting` into `build/`;
  `index.html` loads `build/bundle.js`; the stamp hashes that file. The
  Pages and CI checks compare the whole `build/` directory.
- **Lazy pieces.** `qrcode` only when a code is drawn. The photo editor
  and viewer, the job view (`ProjectDetail`), and the shop catalogue data
  move into modules loaded when first opened. Top-level helpers they need
  are exported from the app module (a lazy chunk importing its parent is a
  cycle ESM resolves without trouble; the parent is long evaluated).
- **Preact through `preact/compat`** in place of react-dom if every render
  test passes unchanged; that is 120 KB. If anything differs, React stays
  and the budget is met with more splitting.
- **Tailwind 3.4 CLI**, `tailwind.config.js` with the same `lg: 900px`
  screens as the CDN config, content = the JSX modules and `index.html`.
  The two class names built at runtime (`gapClass`, the `inp` prefix)
  are in the safelist or written out in full.

## Definition of done

- `index.html` has no `cdn.tailwindcss.com`; `tailwind.css` is built by
  `npm run build` and committed like the bundle.
- `build/bundle.js` < 350 KB; a logic test fails the build when it is not.
- The app looks the same: the render suite passes; a visual check in the
  emulator of Today, a job, Materials, Board on desktop and phone widths.
- Language switch in the app still works, including a language whose
  chunk has not loaded yet.
- CI and the Pages deploy check the new build output.

## Out of scope

- A service worker (next spec).
- Splitting the remaining tabs into modules for their own sake.
