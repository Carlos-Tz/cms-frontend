# DevOps & Developer Handbook — cms-frontend

Operational reference for the five frontend projects in this repo: the React admin panel and the four Astro public sites.

Written for developers. The per-site **content** guides for editors/webmasters are the Spanish `DOCUMENTACION-CONTENIDO-*.txt` files at the repo root — this document does not repeat them.

| Doc | Audience | Language |
| :-- | :-- | :-- |
| `README.md` | Overview of the system | English |
| `DEVOPS.md` (this file) | Developers / deployers | English |
| `DOCUMENTACION-CONTENIDO-*.txt` | Content editors, webmaster | Spanish |
| `<project>/GUIDELINES.md` | Design language (identical copy in all 5) | English |
| `<project>/README.md` | Per-project detail (only admin + landing-gnu are written) | English |

> **Note on `README.md`**: its status table is out of date. It calls `gas-gnu`, `tectuus` and `trainin` "Astro scaffold only — no CMS wiring yet". All three are fully wired and built out. Treat this file as the current state.

---

## 1. System architecture

```
                    ┌───────────────────────────────┐
                    │  External headless CMS (Laravel)│
                    │  gnu-headless-cms...sslip.io    │
                    └───────┬───────────────┬────────┘
       authenticated write  │               │  public read, no auth
       /api/admin/*         │               │  /api/public/{site}/*
       Bearer JWT           │               │  AT BUILD TIME ONLY
                            │               │
                 ┌──────────┴─────┐   ┌─────┴──────────────────────────┐
                 │ gnu-cms-admin   │   │ landing-gnu  gas-gnu           │
                 │ React SPA       │   │ tectuus      trainin           │
                 │ login required  │   │ Astro → static dist/           │
                 └─────────────────┘   └────────────────────────────────┘
                                                    │
                                          public, no login, no session
```

**The single most important operational fact:** the Astro sites fetch CMS content *at build time only*. There is no SSR adapter in any `astro.config.mjs`. An editor saving in the admin changes the database immediately, but **the live site does not change until that site is rebuilt and redeployed**. There is no webhook wired up; publishing is a manual step today.

### The four sites and their CMS slugs

The CMS slug is **not** the folder name. This trips people up constantly.

| Folder | Brand | CMS site slug | Admin route prefix | Admin `site_id` |
| :-- | :-- | :-- | :-- | :-- |
| `landing-gnu` | GNU Gas Natural | `gnu` | `/gnu/*` | 1 |
| `gas-gnu` | GNU Gas Natural Vehicular | `gnu-vehicular` | `/gas-natural/*` | 2 |
| `trainin` | Traninn Logistic | `traninn-logistic` | `/trainin/*` | 3 |
| `tectuus` | Tectuus | `tectuus` | `/tectuus/*` | 4 |

Note the spelling drift on Traninn/Trainin — folder, brand string and CMS slug all differ. Don't "fix" one without the others.

---

## 2. Prerequisites

- **Node.js ≥ 22.12.0** — declared in `engines` on all four Astro projects. The admin declares no engine but needs a modern Node for Vite 8.
- **npm** — no workspace tooling of any kind (no pnpm workspaces, Lerna, Nx, Turborepo). Each project has its own `package.json`, `node_modules` and `.env`.
- **You must `cd` into a project before any npm command.** There is no root `package.json`.

### Stack versions

| | Framework | Build tool | Styling | State |
| :-- | :-- | :-- | :-- | :-- |
| `gnu-cms-admin` | React 19 + react-router 8 | Vite 8 | Tailwind CSS v4 (`@tailwindcss/vite`) | zustand 5 (persisted) |
| Astro sites | Astro 7.1 | Astro (Vite under the hood) | Plain CSS + custom properties | — |

Extra admin deps: `leaflet` 1.9 (map picker for `stations_map`), `oxlint` (lint).

---

## 3. Quick reference

| Project | Install & dev | Default port | Env var | Build output |
| :-- | :-- | :-- | :-- | :-- |
| `gnu-cms-admin` | `npm ci && npm run dev` | 5173 | `VITE_BASE_URL` | `dist/` — **SPA, needs rewrite fallback** |
| `landing-gnu` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — plain static |
| `gas-gnu` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — plain static |
| `tectuus` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — plain static |
| `trainin` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — plain static |

Astro auto-increments the port when 4321 is taken, so running two sites at once gives you 4321 and 4322. Nothing pins the port — pass `--port` if a script depends on it.

### Scripts

Astro projects: `dev`, `build`, `preview`, `astro`.
Admin: `dev`, `build`, `preview`, `lint` (oxlint).

There is **no test script anywhere in this repo.** No unit, integration or E2E tests exist on the frontend side. (The CMS backend has PHPUnit feature tests, documented in the `*-docs/` folders, but that code is not in this repo.)

---

## 4. Environment variables

### Astro sites — `CMS_API_URL`

```env
# <project>/.env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/<site-slug>/
```

- **Trailing slash is required.** `fetch.ts` does raw string concatenation: `fetch(BASE_URL + suffix)`.
- Includes the site slug — that's what scopes a build to one site.
- Read via `import.meta.env.CMS_API_URL`, falls back to `http://localhost:3000/`.
- The media origin is derived from it: `new URL(BASE_URL).origin + "/storage/" + path` (`mediaUrl()`).
- **Build-time only.** Changing it on a server after the fact does nothing. Point it somewhere else → rebuild.

Current values, all four pointing at the same host:

```
landing-gnu  → .../api/public/gnu/
gas-gnu      → .../api/public/gnu-vehicular/
tectuus      → .../api/public/tectuus/
trainin      → .../api/public/traninn-logistic/
```

### Admin — `VITE_BASE_URL`

```env
# gnu-cms-admin/.env
VITE_BASE_URL=https://gnu-headless-cms.165.227.59.215.sslip.io
```

- **Origin only, no trailing slash, no `/api`.** Every call appends its own `/api/admin/...` path.
- Must be prefixed `VITE_` or Vite won't expose it to client code.
- It is baked into the bundle at build time *and* copied into the persisted zustand store as `tenantDomain` on login. A user who logged in before a `VITE_BASE_URL` change keeps talking to the **old** host until they log out or clear `localStorage` — see §11.

### ⚠️ Reserved env var names — never use these

`BASE_URL`, `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`.

Astro/Vite own them. A custom `.env` entry named `BASE_URL` is silently overridden with `"/"` — no error, no warning. This is why the variable is `CMS_API_URL` and not the more obvious name.

### Secrets hygiene

- Astro `.gitignore`s all list `.env` — good.
- **`gnu-cms-admin/.gitignore` does not, and `gnu-cms-admin/.env` is committed to git.** It currently holds only a public hostname, so nothing is leaking today, but the moment anyone adds a key there it goes straight into history. Add `.env` to that `.gitignore` and commit a `.env.example` instead.

---

## 5. Local development

```bash
cd landing-gnu        # or gas-gnu / tectuus / trainin / gnu-cms-admin
npm ci
cp .env.example .env  # (doesn't exist yet — create .env by hand, see §4)
npm run dev
```

- Astro's dev server **re-fetches CMS content on every request**, so content edits show up on refresh without restarting. This is the one place the sites behave dynamically; production does not.
- The admin needs a login. Auth is `POST /api/admin/auth/login` with `{email, password}`; the returned `access_token` is persisted in `localStorage` under the key `gnu-cms-session`.

### Background dev servers

All four `AGENTS.md` files specify background mode for automated/agent use:

```bash
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

Dev logs land in `<project>/.astro/dev.log`.

### Working against a local CMS

Point `CMS_API_URL` / `VITE_BASE_URL` at your local backend. Nothing else needs to change. If the CMS is unreachable, `fetchData()` catches the error, logs it and returns `undefined` — so each site falls back to whatever its components do with empty data. That differs sharply per site (see §9), and on `trainin` it means **most of the page silently renders nothing**, which looks like a broken build but isn't.

---

## 6. Build & deploy

### 6.1 Astro sites

```bash
cd <project>
npm ci
npm run build      # fetches CMS content, writes dist/
npm run preview    # serve dist/ locally exactly as deployed
```

`dist/` is plain HTML/CSS/JS. No Node runtime required in production.

**Nginx (VPS):**

```nginx
server {
    listen 80;
    server_name gnugas.mx www.gnugas.mx;

    root /var/www/landing-gnu/dist;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

The `$uri.html` fallback matters: Astro emits `/contacto/index.html` for `/contacto`, but a flat-file layout can also produce `contacto.html`. Without it some routes 404.

**Static/serverless hosts (Vercel, Netlify, Cloudflare Pages, Azure Static Web Apps):**
- Build command `npm run build`, output directory `dist`.
- Set `CMS_API_URL` as a **build-time** env var in the platform's project settings.
- Azure SWA: app location `/`, output location `dist`, variable under Configuration → Environment variables.
- Because each project is a separate app rooted in a subdirectory, set the platform's "root directory"/"app location" to that subfolder — there is no monorepo config to do it for you.

### 6.2 The admin SPA

```bash
cd gnu-cms-admin
npm ci
npm run build
```

`BrowserRouter` with no `basename` means **every route must fall back to `index.html`**, or refreshing on `/tectuus/productos` 404s.

**Nginx:**

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /var/www/gnu-cms-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }

    location /assets/ {
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
```

**Serve the admin over HTTPS only** — it sends a bearer token on every request.

**S3 + CloudFront:** bucket static hosting with index document *and* error document both `index.html`; behind CloudFront/OAC add a custom error response mapping 403 and 404 → `/index.html` with HTTP 200 (an OAC-backed origin ignores the bucket's error-document setting). Redeploy with `aws s3 sync dist/ s3://bucket --delete`, then invalidate `/index.html`.

### 6.3 Publishing a content change (end to end)

1. Editor saves in the admin → CMS database updated immediately.
2. Someone runs `npm run build` in the affected Astro project → content is fetched and baked into HTML **at this moment**.
3. `dist/` is deployed.
4. Only now is the change visible to visitors.

A minimal redeploy script, per site:

```bash
#!/usr/bin/env bash
set -euo pipefail
SITE=${1:?usage: deploy.sh <landing-gnu|gas-gnu|tectuus|trainin>}
cd "/srv/cms-frontend/$SITE"
git pull --ff-only
npm ci
npm run build
rsync -a --delete dist/ "/var/www/$SITE/dist/"
```

Note `npm run build` **exits 0 even if the CMS is unreachable** — `fetchData()` swallows the error. A deploy pipeline will happily publish a content-less site. If you automate this, add a smoke check between build and deploy, e.g. grep `dist/index.html` for a string that only appears when real CMS content rendered, and fail the job if it's missing.

### 6.4 Infrastructure that does not exist yet

Worth knowing before you promise anything:

- **No CI/CD.** No `.github/workflows`, no `Dockerfile`, no `docker-compose`, no `*.toml`, no `_redirects`, no deploy scripts anywhere in the repo.
- **No CMS→rebuild webhook.** Rebuilds are triggered by hand from the admin's **Reconstruir página** button, served by `build-server/` (see its README). It must run on the host that serves the sites, with `DEPLOY_CMD_<SITE>` set if `dist/` has to be copied elsewhere.
- **No tests, no linting in the Astro projects** (only the admin has `oxlint`).
- **No staging environment** — all four `.env` files point at the one production CMS host.

---

## 7. Where things live

### 7.1 Astro sites — canonical layout

`landing-gnu`, `gas-gnu` and `tectuus` follow this. **`trainin` does not** — see 7.2.

```
<project>/
├── public/                     # copied verbatim to dist/ (favicon.svg, favicon.ico)
├── src/
│   ├── assets/images/noimg.jpg # fallback image, goes through Astro's asset pipeline
│   ├── components/
│   │   ├── SectionRenderer.astro   # maps CMS section "type" → component
│   │   └── sections/                # one component per section type
│   ├── config/seo.ts           # site name, titles, canonical domain, OG defaults
│   ├── functions/fetch.ts      # REST client: fetchData/sendData/updateData, mediaUrl, BASE_URL
│   ├── layouts/Layout.astro    # header, nav, footer, WhatsApp FAB; fetches /menu and /globals
│   ├── pages/                  # file-based routing
│   ├── styles/
│   │   ├── tokens.css          # design tokens (:root custom properties)
│   │   └── global.css          # @import "./tokens.css" + every component class
│   └── types/                  # globals.ts, menu.ts, page.ts, catalog.ts
├── astro.config.mjs            # empty defineConfig({}) in all four
├── tsconfig.json               # extends astro/tsconfigs/strict
├── .env
├── AGENTS.md                   # dev-server conventions
└── GUIDELINES.md               # design language (identical in all 5 projects)
```

Project-specific extras:

- `tectuus`: `src/functions/catalog.ts` (product/category fetching + `formatPrice`), `src/components/ProductCatalog.astro`, `public/placeholder-plate.svg`.
- `gas-gnu`: `src/components/sections/ServiceScheduling.astro` (appointment widget, the only site with one).
- `landing-gnu`: also carries `inspiration/`, `gnu-docs/`, `DESIGN-apple.md`, `gaseco-schema` — all gitignored scratch material, not part of the build.
- Every site has a `<site>-docs/` folder of Markdown blueprints describing the CMS contract (which sections each page has, endpoint payloads, seeder decisions). **These are the best reference for the API shape** and are worth reading before touching section rendering.

### 7.2 `trainin` — the odd one out

```
trainin/
├── assets/images/noimg.jpg     # ⚠ at project root, NOT src/assets — unused by the build
├── src/
│   ├── components/             # ⚠ FLAT — no sections/ subfolder
│   │   ├── PageSections.astro  # ⚠ the SectionRenderer equivalent, different name
│   │   ├── Hero.astro Clientes.astro Contacto.astro Simulador.astro …
│   │   ├── Header.astro Footer.astro WhatsAppButton.astro   # ⚠ split out of Layout
│   │   └── Servicios.astro Ubicaciones.astro   # ⚠ dead code, imported by nothing
│   ├── functions/  fetch.ts, globals.ts, blog.ts
│   ├── layouts/Layout.astro
│   ├── pages/
│   ├── styles/
│   │   ├── tokens.css          # ⚠ tokens AND all global classes in one file
│   │   └── motion.css          # reveal/stagger animations
│   └── types/globals.ts
├── response.json               # ⚠ stray API dump committed at root
└── (no src/config/seo.ts)      # ⚠ no SEO config — see §9
```

Also: `trainin/package.json` has **no `devDependencies`** — no `@astrojs/check`, no `typescript` — yet ships a `tsconfig.json`. `npx astro check` will not work there until those are added.

### 7.3 The admin

```
gnu-cms-admin/
├── src/
│   ├── main.jsx                # React root + <BrowserRouter>
│   ├── App.jsx                 # the whole <Routes> tree — manual, no file routing
│   ├── index.css               # literally just: @import "tailwindcss";
│   ├── components/
│   │   ├── form-fields.jsx     # Field, ImageField, CharHint, WordHint, DynamicItem,
│   │   │                       #   AddButton, fieldError, inputClass, MAX_UPLOAD_BYTES
│   │   ├── page-sections-editor.jsx   # ★ the shared section editor (see below)
│   │   └── card.jsx
│   ├── functions/fetch.jsx     # every REST call, all admin endpoints
│   ├── store/sessionStore.jsx  # zustand + persist → localStorage "gnu-cms-session"
│   └── pages/
│       ├── login/  home/
│       ├── gnu/           # landing-gnu's editors  (site=gnu)
│       ├── gas-natural/   # gas-gnu's editors      (site=gnu-vehicular)
│       ├── trainin/       # trainin's editors      (site=traninn-logistic)
│       └── tectuus/       # tectuus's editors      (site=tectuus)
└── vite.config.js          # react() + tailwindcss() plugins, nothing else
```

**Routing is manual.** Adding an admin page means creating `src/pages/<path>/index.jsx` *and* registering a `<Route>` in `App.jsx`. There is no filesystem router.

**`page-sections-editor.jsx` is the workhorse.** It exports:
- `PageSectionsEditor` — full page with back link + title. Most admin pages are a 10-line wrapper around it.
- `SectionsFields` — headless variant, embedded by pages that also show their own data (leads inbox, appointments, product catalog).

Its props:

| Prop | Purpose |
| :-- | :-- |
| `site` | CMS site slug |
| `page` | page slug for the `?page=` query |
| `pageId` | **numeric** page id; filters client-side. Required because the API ignores `?page=` for some sites and returns every section for the whole site |
| `includeGlobals` | also keep `page_id: null` sections (`contact_info`, `social_icons`, `whatsapp_button`) — pass on exactly one page per site |
| `title`, `backTo` | chrome |

It registers editors for 13 section types: `page_hero`, `feature_grid`, `rich_text`, `clients_showcase`, `stations_map`, `lead_capture_form`, `service_scheduling`, `banner_carousel`, `savings_simulator`, `contact_info`, `social_icons`, `whatsapp_button`, `image_gallery`. **Any other type falls back to a read-only JSON dump** — that's the symptom to look for when a new section type appears unstyled in the panel.

`pages/gas-natural/inicio/index.jsx` predates the shared component and **carries its own private copy of six section editors**, including a `testimonials` editor that the shared component does not have. Changes to shared editors do not propagate there.

### 7.4 "Where do I change X"

| Change | File |
| :-- | :-- |
| Brand colors, fonts, radii, shadows (a site) | `<site>/src/styles/tokens.css` |
| Component classes, layout, breakpoints (a site) | `<site>/src/styles/global.css` (`trainin`: `tokens.css` + per-component `<style>`) |
| Page `<title>` suffix, canonical domain, OG defaults | `<site>/src/config/seo.ts` (**absent in `trainin`**) |
| Header nav, footer columns, WhatsApp FAB | `<site>/src/layouts/Layout.astro` (`trainin`: `components/Header.astro`, `Footer.astro`, `WhatsAppButton.astro`) |
| Which component renders a CMS section type | `<site>/src/components/SectionRenderer.astro` (`trainin`: `components/PageSections.astro`) |
| How a section type looks | `<site>/src/components/sections/<Type>.astro` |
| CMS base URL, media URL resolution | `<site>/src/functions/fetch.ts` |
| Add a route | new file in `<site>/src/pages/` |
| Favicon | `<site>/public/favicon.svg` + `favicon.ico` |
| Admin form fields for a section type | `gnu-cms-admin/src/components/page-sections-editor.jsx` |
| Admin input primitives, upload limits, char hints | `gnu-cms-admin/src/components/form-fields.jsx` |
| Admin API calls | `gnu-cms-admin/src/functions/fetch.jsx` |
| Admin routes | `gnu-cms-admin/src/App.jsx` |

---

## 8. Theming & CSS

### 8.1 Astro sites — token-driven

Each site owns a `src/styles/tokens.css` defining `:root` custom properties, `@import`ed at the top of `global.css`, which `Layout.astro` imports once. **No Tailwind on the public sites** — it's plain CSS with BEM-ish class names.

Token groups (consistent across sites, values differ):

```
--font-display / --font-body        font stacks
--text-h1 / --text-h2 / …           fluid type scale, clamp()
--color-bg / --color-bg-alt         page grounds
--color-ink / --color-ink-2         dark surfaces (heroes, footers)
--color-primary / -alt / -light     brand
--color-accent                      secondary brand
--color-text / -60 / -40            text on light
--color-text-on-dark / -70 / -45    text on dark
--color-border / -hover / -on-dark  hairlines
--radius-sm … --radius-full         corner radii
--shadow-float / -cta / -card       elevation
--ease-out                          motion curve
```

Current palettes:

| Site | Primary | Ink | Accent | Fonts |
| :-- | :-- | :-- | :-- | :-- |
| `landing-gnu` / `gas-gnu` | `#1657c4` blue | `#0b2b5c` navy | `#4fa3e3` | system UI stack |
| `tectuus` | `#163a64` navy | `#0a1e35` | `#2fa84c` green + `#3ec6ef` cyan "pen" | **Archivo + IBM Plex Sans** (Google Fonts) |
| `trainin` | `#c8102e` red | `#201d1e` near-black | — | system UI stack |

**To rebrand a site:** edit `tokens.css` only. That is the intended seam and it mostly holds — but audit first, because it isn't airtight:

- `gas-gnu/src/styles/global.css` hardcodes `rgba(11, 43, 92, …)` in the page-hero scrim gradient instead of referencing `--color-ink`.
- `trainin` component `<style>` blocks hardcode `rgba(200, 16, 46, …)` (the red) in several places.
- The WhatsApp green `#25d366` is hardcoded in every site — correct, it's a third-party brand color.
- `tectuus` loads its fonts via a `<link>` to Google Fonts in `Layout.astro`, not via tokens. Changing the family means editing both `tokens.css` and that link.

Practical check after a token change: `grep -n "#[0-9a-fA-F]\{6\}\|rgba(" src/styles/global.css src/components/**/*.astro` and confirm every remaining literal is intentional.

`tectuus` deserves a warning: its design language is deliberate (cyan is used *only* as 1px linework and tick marks, never as fill; green means "action" and nothing decorative is green). The rationale is written at the top of its `tokens.css`. Read it before recoloring.

### 8.2 The admin — Tailwind v4, no theme

`index.css` is one line: `@import "tailwindcss";`. There is **no `tailwind.config.js` and no `@theme` block**, so no design tokens are registered with Tailwind. Every brand color is an inline arbitrary value:

```
#863bff  ×36   brand purple
#0b0611  ×25   background
#47bfff  ×16   gradient end
#8900ff  ×10   …
```

spread across 10 files. `GUIDELINES.md` documents these as CSS custom properties, but **that mapping was never implemented** — the tokens in that document don't exist in the code.

Consequence: **rebranding the admin today is a find-and-replace across 10 files.** If theming the admin is on the roadmap, the fix is small and worth doing first — add a `@theme` block to `index.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand:      #863bff;
  --color-brand-alt:  #47bfff;
  --color-ink:        #0b0611;
}
```

then replace `bg-[#0b0611]` → `bg-ink`, `from-[#863bff]` → `from-brand`, etc. After that the admin themes from one block, like the sites do from `tokens.css`.

### 8.3 Shared design language

`GUIDELINES.md` is byte-identical in all five projects (265 lines): tokens, typography, buttons, cards, form fields, with Tailwind equivalents in parentheses. It describes the **admin's** dark purple language — the public sites each diverged into their own palette deliberately. Don't treat it as the spec for the public sites.

---

## 9. Per-site behavioural differences that matter operationally

These are the things that make "it works on site A" not transfer to site B.

| | `landing-gnu` | `gas-gnu` | `tectuus` | `trainin` |
| :-- | :-- | :-- | :-- | :-- |
| Missing-content behaviour | fallbacks | **heavy fallbacks** | full fallback homepage | **none — blocks vanish** |
| Missing-image placeholder | `noimg.jpg` grey | `noimg.jpg` grey | `placeholder-plate.svg` blank plate | nothing rendered |
| `src/config/seo.ts` | yes | yes | yes | **no** |
| OG / canonical tags | yes | yes | yes | **none at all** |
| Blog | yes | yes | no | yes |
| Product catalog | no | no | **yes** | no |
| Appointments widget | no | **yes** | no | no |
| Savings simulator | yes | yes | no | yes |
| Globals editable in admin | yes | **no** | yes | yes |

Two consequences worth internalising:

- On **`trainin`**, an empty CMS response produces a near-blank page rather than a placeholder-filled one. When debugging a `trainin` build that "lost its content", check the API first — the site is behaving as designed.
- On **`gas-gnu`**, the opposite: the homepage renders fake testimonials, a fake blog strip and a hardcoded 60% savings rate when the CMS is empty. A build with a broken API **looks fine**. This is why the smoke check in §6.3 matters most for this site.

---

## 10. Common tasks

### Add a new CMS section type end to end

1. **Backend** declares the type and its schema (not in this repo).
2. **Public site** — add a component in `src/components/sections/`, then a `case "<type>":` in `SectionRenderer.astro` (`PageSections.astro` on `trainin`). Unknown types are skipped silently, so the site never breaks while you work.
3. **Admin** — write a `<Type>Editor({ content, onChange, errors })` in `page-sections-editor.jsx`, register it in `SECTION_EDITORS`, and add a Spanish label in `SECTION_LABELS`. Until you do, the panel shows a read-only JSON dump.
4. Repeat step 2 for **every site** that will use the type — there is no shared component package.
5. If `gas-gnu`'s homepage needs it, also add it to the **private copy** in `pages/gas-natural/inicio/index.jsx`.
6. Update the relevant `DOCUMENTACION-CONTENIDO-*.txt` with the image sizes and character limits.

### Add a page to a public site

1. Backend creates the page + sections and publishes it (`is_published`). The `/menu` endpoint is derived from the `pages` table, so the nav updates itself.
2. Create `src/pages/<path>/index.astro` — copy an existing interior page; they're all ~20 lines: fetch `pages/<slug>`, hand `sections` to the renderer.
3. **The Astro path and the CMS slug are independent.** e.g. `gas-gnu/src/pages/nuestros-servicios/instala-tu-equipo-de-gnv/cotiza-tu-equipo.astro` fetches `pages/cotiza-tu-equipo`. Get this wrong and you get an empty page, not an error.
4. Admin: add `src/pages/<site>/<page>/index.jsx` wrapping `PageSectionsEditor` with the right `site`, `page`, **`pageId`** and `backTo`; register the `<Route>` in `App.jsx`; add it to that site's `select-page.jsx` list.

Finding the numeric `pageId`: `GET /api/admin/sections?site=<slug>` with a bearer token and read `page_id` off the section belonging to your page. Omitting `pageId` is what causes the `trainin` Contacto bug in §11.

### Add a fifth site

1. `npm create astro@latest -- --template minimal`, then copy `src/functions/fetch.ts`, `src/types/`, `src/config/seo.ts`, `src/styles/`, `Layout.astro` and `SectionRenderer.astro` from **`tectuus`** — it's the most complete and most consistent of the four.
2. Create `.env` with the new site's `CMS_API_URL`.
3. Admin: new `src/pages/<site>/` folder, a `select-page.jsx`, routes in `App.jsx`, and a card on `pages/home/index.jsx`.
4. Copy `GUIDELINES.md` and `AGENTS.md` across; give it a real `README.md` (three of the four still ship the stock Astro starter readme).

---

## 11. Known traps

Ordered roughly by how much time they'll cost you.

1. **Blog pagination is broken in static builds** — `landing-gnu/src/pages/blog/index.astro:32` and `gas-gnu/src/pages/blog/index.astro:32` both read `Astro.url.searchParams.get("page")`. With no SSR adapter, search params are empty at build time, so every `?page=N` link serves the page-1 HTML. Either add `getStaticPaths` with real `/blog/page/N` routes, or paginate client-side the way `tectuus`'s `ProductCatalog.astro` handles `?category=`.
2. **`handleUnauthorized()` is called but never defined** — `gnu-cms-admin/src/functions/fetch.jsx:345`. On a 401 it throws a `ReferenceError`, caught by the outer `catch`, which fires `alert('Error al obtener datos ', error)`. An expired token therefore shows a generic alert instead of redirecting to login. Either define it (clear the token, navigate to `/login`) or drop the branch.
3. **`SectionsFields` without `pageId` shows every section of the whole site** — the API ignores `?page=` for at least `traninn-logistic`. `pages/trainin/contacto/index.jsx:129` omits it, so that screen lets an editor modify the homepage while believing they're editing `/contacto`. Every other screen passes a `pageId`.
4. **Section `PUT` is a full replacement, not a patch** — `PUT /api/admin/sections/{id}` takes the entire `content` object, and arrays (`slides`, `items`, `logos`) are replaced wholesale. This is why every editor holds the full content object in local state. Send a partial object and you delete the rest.
5. **No shared logic in `.astro` frontmatter** — keep reusable functions in plain `.ts` under `src/functions/`. Astro scopes top-level `const`/`let` per-component in a way that leaves a constant `undefined` inside an `export function` in the same frontmatter. (`landing-gnu/functions/fetch.astro` — an empty 0-byte file at that project's root, outside `src/` — is the abandoned remains of this attempt; safe to delete.)
6. **Reserved env var names** — §4. Silent override, no error.
7. **`dist/` is committed to git** (84 files across all five projects). The `# dist/` line in every `.gitignore` is commented out. Builds create diff noise and can be deployed stale. Uncomment and `git rm -r --cached */dist` when someone has time to coordinate it.
8. **`gnu-cms-admin/.env` is committed** — §4.
9. **A stale `tenantDomain` outlives a config change** — it's persisted in `localStorage` at login. Changing `VITE_BASE_URL` doesn't move existing sessions. Tell users to log out, or version the zustand store.
10. **`trainin` has no devDependencies** — `npx astro check` won't run there.
11. **Two stray route files publish junk on `trainin`** — `src/pages/nosotros/index.astro` contains the literal text `sobre nosotros`, `src/pages/servicios/index.astro` contains `serv`. Both are live routes. Delete them.
12. **Stray files committed at project roots** — `trainin/response.json` (an API dump), `trainin/assets/images/noimg.jpg` (outside `src/`, so unused by the build), and the empty `landing-gnu/functions/fetch.astro`.
13. **Favicons are the stock Astro icon in all four sites**, byte-identical. On `tectuus` that file is also used as the header/footer **logo**, so the Astro rocket is on every page.
14. **`gas-gnu`'s homepage admin editors are a private fork** — `pages/gas-natural/inicio/index.jsx` duplicates six section editors. Fixes to the shared ones don't reach it.
15. **The build exits 0 on CMS failure** — §6.3.

---

## 12. API surface

Base: `https://gnu-headless-cms.165.227.59.215.sslip.io`

### Public — no auth, read-only, consumed at build time

`{base}/api/public/{site}/…`

| Endpoint | Used by |
| :-- | :-- |
| `pages/{slug}` | every page — returns `{slug, path, title, sections[]}` |
| `menu` | `Layout.astro` nav + footer |
| `globals` | contact info, socials, WhatsApp button |
| `blog?page=N`, `blog/{slug}` | `landing-gnu`, `gas-gnu`, `trainin` |
| `product-categories`, `products?page=N`, `products/{slug}` | `tectuus` only |
| `stations` | `gas-gnu`, `trainin` map pins |
| `savings-simulator?fuel=&quantity=` | `gas-gnu` (server-side math) |
| `appointments/availability?station=&date=` | `gas-gnu` only |

Public **writes** (the only two, both rate-limited `throttle:10,1` — 10 req/min/IP):

- `POST leads` — `{name, email, phone, message, source, details{}}`. `source` must match a published page slug or it 422s. Anything outside the four core fields must be nested in `details` and is validated against that form's declared `fields[]`.
- `POST appointments` — `gas-gnu` only.

### Admin — `Authorization: Bearer <jwt>`

`{base}/api/admin/…`

`auth/login`, `auth/logout`, `sections` (index/show/**update only** — no create/delete), `pages` (update `is_published` only), `blog-posts` (full CRUD), `product-categories` (full CRUD, **409** on delete if it still has products), `products` (full CRUD), `leads` (read), `appointments` (read + delete), `media` (POST multipart, returns a ready-to-use absolute `url`).

**The editability contract**, enforced server-side and worth understanding before promising a feature: the admin manages *data*, never *structure*. Sections cannot be created, deleted, reordered or retyped. Pages cannot be created, deleted, renamed or re-pathed — only published/unpublished. `lead_capture_form.fields` is deliberately excluded from the update schema so `array_merge` preserves the seeded value. Anything structural is a backend seeder change.

**Uploads:** `MAX_UPLOAD_BYTES = 5 MB`, enforced client-side in `form-fields.jsx` before the request and hard-enforced by the server. `ImageField` also measures and reports width/height and warns above 2 MB. No compression or resizing happens anywhere — what's uploaded is what ships.

---

## 13. Suggested priorities

Cheap, high-value, in rough order:

1. Fix `handleUnauthorized` (#2) and the missing `pageId` on `trainin` Contacto (#3) — both are one-liners with real user impact.
2. Delete the stray `trainin` routes and `response.json` (#11, #12).
3. Add `.env` to the admin's `.gitignore` and ship a `.env.example` (#8).
4. Un-commit `dist/` (#7).
5. Ship real favicons (#13) — blocks the `tectuus` logo problem too.
6. Add `@theme` to the admin's `index.css` (§8.2) before any rebrand request arrives.
7. Give `gas-gnu`/`tectuus`/`trainin` real `README.md`s; add `src/config/seo.ts` to `trainin`.
8. Wire one CI job that builds all four sites on push, with the content smoke check from §6.3 — that alone would have caught most of what's in §11.
