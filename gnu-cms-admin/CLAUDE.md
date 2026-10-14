# GNU CMS Admin

React + Vite app using Tailwind CSS v4 (`@tailwindcss/vite`, no config file — utilities used directly) and `react-router` v8 (import from `"react-router"`, not `react-router-dom`).

## Server layout (production)

Each public site lives as two **independent** directories on the server — not nested, no shared parent folder:

```
<CODE_PATH>/              ← the Astro project (package.json, src/, node_modules/ installed) — the build runs here
└── dist/                   produced by `npm run build`

<PUBLIC_PATH>/            ← what the web server actually serves
├── _astro/                ┐
├── blog/ contacto/…       │ fully replaced with the contents of <CODE_PATH>/dist/ after a rebuild
└── index.html             ┘
```

`administracion-cms` (this admin's own Vite build output) and `build-server` are deployed separately and aren't part of this per-site CODE_PATH/PUBLIC_PATH pair.

Admin route prefix → repo project (`CODE_PATH`) → CMS slug (the names don't match — see `build-server/README.md`):

| Admin route | Repo project | CMS slug |
| :-- | :-- | :-- |
| `/gnu` | `landing-gnu` | `gnu` |
| `/gas-natural` | `gas-gnu` | `gnu-vehicular` |
| `/trainin` | `trainin` | `traninn-logistic` |
| `/tectuus` | `tectuus` | `tectuus` |

## "Reconstruir sitio"

`src/components/rebuild-site-button.jsx` (on each site's `select-page.jsx`) publishes saved CMS edits. The browser can't run `npm run build` or touch the server's filesystem, so the button calls the separate `build-server/` service (`VITE_BUILD_SERVER_URL`, see `src/functions/fetch.jsx` → `rebuildSite` / `getRebuildStatus`) — only that URL belongs in this admin's `.env`; the actual `CODE_PATH`/`PUBLIC_PATH` filesystem paths live in `build-server`'s own `.env` (`VITE_<SITE>_CODE_PATH` / `VITE_<SITE>_PUBLIC_PATH`), never shipped to the browser. The service runs `npm run build` in `CODE_PATH`, then fully replaces the contents of `PUBLIC_PATH` with `CODE_PATH/dist/`. See `../build-server/README.md`.

## Routing

- `src/App.jsx` owns the top-level `<Routes>` and renders the landing page directly.
- Route components live under `src/pages/<name>/index.jsx` and are routed at `/<name>` (e.g. `pages/login` → `/login`, `pages/home` → `/home`), not `/pages/<name>`.
- `BrowserRouter` wraps `<App />` in `src/main.jsx`.

## Design system

Dark, violet/blue brand derived from `public/favicon.svg` and `public/icons.svg`.

**Colors**
- Background: `#0b0611`
- Primary accent (violet): `#863bff` / `#7e14ff`
- Secondary accent (blue): `#47bfff`
- Light accent text (e.g. eyebrow labels): `#c9a3ff`
- Body copy on dark bg: `text-white` at reduced opacity (`text-white/60`, `/70`, `/40`) rather than gray tones

**Components**
- Primary CTA: pill button (`rounded-full`), gradient `from-[#863bff] to-[#47bfff]`, `shadow-lg shadow-[#863bff]/30`, `hover:brightness-110`
- Secondary/nav button: `rounded-full border border-white/15`, hover to `border-white/30`
- Cards/panels: "glass" style — `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm`
- Inputs: `rounded-lg border border-white/15 bg-white/5`, `focus:border-[#863bff]`
- Headline gradient text: wrap the emphasized phrase in `bg-gradient-to-r from-[#863bff] to-[#47bfff] bg-clip-text text-transparent`
- `src/components/card.jsx` — reusable card (title, subtitle, status dot, circular arrow icon button). Status is semantic, not brand color: `active` emerald, `pending` amber, `draft` white/40, `error` rose. Reuse this set for any new status states instead of inventing new colors.

**Assets**
- `public/favicon.svg` doubles as the small logo mark in page headers.
- `src/assets/hero.png` is the hero illustration on the landing page.

Keep new pages consistent with this palette and component set rather than introducing new colors or button styles.
