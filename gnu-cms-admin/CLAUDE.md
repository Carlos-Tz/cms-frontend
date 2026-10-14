# GNU CMS Admin

React + Vite app using Tailwind CSS v4 (`@tailwindcss/vite`, no config file — utilities used directly) and `react-router` v8 (import from `"react-router"`, not `react-router-dom`).

## Server layout (production)

All sites are static files served from `/var/www/html/sitios-cms/`:

```
/var/www/html/sitios-cms/
├── administracion-cms/   ← this admin (vite build output)
├── gnu/                  ← landing-gnu
│   ├── code/             ← the Astro project itself (package.json, src/, node_modules/ installed)
│   ├── _astro/           ┐
│   ├── blog/ contacto/…  │ contents of code/dist/ after `npm run build`
│   ├── index.html        │ (index.html, _astro/, one folder per route)
│   └── favicon.*         ┘
├── gnu-gas-natural/      ← gas-gnu            (same layout: code/ + build output)
├── tectuus/              ← tectuus            (same layout)
└── traninn-logistic/     ← trainin            (same layout)
```

Each site folder holds the build output **directly** (not inside a `dist/` folder), next to a `code/` folder that is the Astro project as in this repo, with `node_modules` already installed. A rebuild runs `npm run build` in `<site>/code` and replaces everything in `<site>/` **except `code/`** with the contents of `<site>/code/dist/`.

Admin route prefix → repo project → server folder:

| Admin route | Repo project (= `code/` on the server) | Server folder |
| :-- | :-- | :-- |
| `/gnu` | `landing-gnu` | `gnu` |
| `/gas-natural` | `gas-gnu` | `gnu-gas-natural` |
| `/trainin` | `trainin` | `traninn-logistic` |
| `/tectuus` | `tectuus` | `tectuus` |

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
