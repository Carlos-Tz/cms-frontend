# GNU CMS Frontend — Monorepo doc

This repo holds the frontend half of the GNU headless CMS system: one **admin panel** that content editors log into, a set of **public marketing sites** that read whatever the admin publishes, and a small **build service** that rebuilds those sites on demand. Everything talks to the same Laravel headless CMS API over REST.

```
cms-frontend/
├── gnu-cms-admin/   # React + Vite admin panel (login required) — editors manage all four sites here
├── landing-gnu/     # Astro public site — GNU corporate (gnugas.mx)          — CMS slug `gnu`
├── gas-gnu/         # Astro public site — GNU Vehicular (gas natural vehicular) — CMS slug `gnu-vehicular`
├── tectuus/         # Astro public site — Tectuus (industrial equipment + product catalog) — CMS slug `tectuus`
├── trainin/         # Astro public site — Trainin Logistic                       — CMS slug `traninn-logistic`
├── build-server/    # Zero-dependency Node service behind the admin's "Reconstruir sitio" button
└── cms-backend/     # Laravel + SQLite headless CMS — a separate git repo (gitlink), not part of this repo's history
```

## How the pieces fit together

```
┌────────────────┐   editors log in, edit    ┌────────────────────┐
│  gnu-cms-admin  │ ────────────────────────▶ │  cms-backend        │
│  (React SPA)    │   REST + bearer token     │  (Laravel headless) │
└───────┬────────┘                            └─────────┬──────────┘
        │ "Reconstruir sitio"                           │ REST, no auth,
        ▼ (bearer token)                                │ read-only, at BUILD time
┌────────────────┐   runs `npm run build`     ┌─────────▼──────────┐
│  build-server   │ ────────────────────────▶ │  Astro sites        │
│  (Node)         │   then copies dist/ to    │  landing-gnu,       │
└────────────────┘   the served folder       │  gas-gnu, tectuus,  │
                                              │  trainin → dist/    │
                                              └─────────┬──────────┘
                                                        ▼
                                            published to the public,
                                            no login, no password
```

- **`gnu-cms-admin`** is a password-protected React SPA. Editors log in once and manage page sections, blog posts, contact leads, stations, verification appointments and (Tectuus only) a product catalog for all four sites. Every request carries a bearer token; a `401` sends the editor back to `/login`. This is the **only** part of the system that requires authentication.
- **The Astro sites** are **fully public, unauthenticated static sites**. Each reads its own site's public API (`/api/public/<cms-slug>/`) **only at build time** (`npm run build`). There is no login, admin UI or session on these sites, and no draft gate: anything an editor saves becomes visible to the world on the next rebuild.
- Because the Astro sites are static (no SSR adapter), **a content edit in the admin does not appear on the live site until that site is rebuilt and redeployed.** This is the single most important operational fact for both developers and the webmaster — see [Publishing a content change](#publishing-a-content-change).
- **`build-server`** is the bridge: the admin can't run `npm run build` from a browser, so it asks this service to do it on the machine that serves the sites.

## Site identifiers — four names for the same four sites

The same site is addressed differently depending on the layer. Getting this wrong is the most common cause of a page that silently shows nothing.

| Site | Astro project | Admin route prefix | CMS `site` slug (API + `CMS_API_URL`) | `build-server` `:site` |
| :-- | :-- | :-- | :-- | :-- |
| GNU corporate | `landing-gnu` | `gnu` | `gnu` | `gnu` |
| GNU Vehicular | `gas-gnu` | `gas-natural` | `gnu-vehicular` | `gas-natural` |
| Trainin Logistic | `trainin` | `trainin` | `traninn-logistic` | `trainin` |
| Tectuus | `tectuus` | `tectuus` | `tectuus` | `tectuus` |

See [`gnu-cms-admin/README.md#site-identifiers--four-names-for-the-same-four-sites`](./gnu-cms-admin/README.md#site-identifiers--four-names-for-the-same-four-sites) for the admin-side details (`pageUrls` store keys, `build-server` env var prefixes).

## Project status

| Project | Role | Status |
| :--- | :--- | :--- |
| [`gnu-cms-admin`](./gnu-cms-admin/README.md) | Admin panel (all four sites, one login) | Active — section editors, blog, leads, stations, appointments, Tectuus catalog |
| [`landing-gnu`](./landing-gnu/README.md) | Public site — GNU corporate | Live, fully built — the **reference implementation** for the other Astro sites |
| `gas-gnu` | Public site — GNU Vehicular | CMS-wired (`CmsPage`/`SectionRenderer`, blog, contacto, nuestros-servicios, ubicaciones + agenda tu verificación) |
| `tectuus` | Public site — Tectuus | CMS-wired (inicio, sobre-nosotros, contacto, product catalog with `productos/[slug]`). No blog |
| `trainin` | Public site — Trainin Logistic | CMS-wired (inicio, nuestros-servicios, sobre-nosotros, ubicaciones, blog, contacto). Uses its own component layout (no `SectionRenderer`) |
| [`build-server`](./build-server/README.md) | Rebuild service for the "Reconstruir sitio" button | Active |
| `cms-backend` | Laravel headless CMS | Separate repo, checked out here for convenience |

When extending `gas-gnu`, `tectuus`, or `trainin`, follow the pattern already working in `landing-gnu` (`src/functions/fetch.ts`, `src/lib/cms.ts`, `CmsPage.astro` + `SectionRenderer.astro`, the `Layout.astro` global-content fetch) rather than reinventing it — [`landing-gnu/README.md`](./landing-gnu/README.md) is the up-to-date reference. All five frontend projects share one visual design language documented in their `GUIDELINES.md` (identical copy in each — token colors, buttons, cards, form fields).

## For developers

Each project is independent (its own `package.json`, `.env`, `node_modules`) — there is no workspace tooling (no Lerna/Turborepo/pnpm workspaces), so `cd` into a project before running any npm command. The Astro projects require Node `>=22.12.0`.

| Project | Dev command | Env var(s) | Build output |
| :--- | :--- | :--- | :--- |
| `gnu-cms-admin` | `npm run dev` → `localhost:5173` | `VITE_BASE_URL` (CMS origin, no trailing slash), `VITE_BUILD_SERVER_URL` (build-server origin) | `dist/` — SPA, needs a rewrite-to-`index.html` fallback when deployed |
| `landing-gnu`, `gas-gnu`, `tectuus`, `trainin` | `npm run dev` → `localhost:4321` (`astro dev --background` for automated/agent use) | `CMS_API_URL` = `<CMS origin>/api/public/<cms-slug>/` (trailing slash) | `dist/` — plain static HTML/CSS/JS, one folder + `index.html` per route |
| `build-server` | `npm start` → `localhost:4400` | its own `.env` (per-site `CODE_PATH`/`PUBLIC_PATH`, `ALLOWED_ORIGINS`) — see `.env.example` | — |

Example `.env` for an Astro site:

```env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/gnu-vehicular/
```

Full dev/build/deploy instructions (Nginx/VPS, S3 + CloudFront, Azure Blob / Static Web Apps, Vercel/Netlify/Cloudflare Pages) live in each project's own README — this file only covers what's shared:

- [`gnu-cms-admin/README.md`](./gnu-cms-admin/README.md) — REST client (`src/functions/fetch.jsx`), session/auth store, `PageSectionsEditor` and section-editing semantics, per-site content map, known limitations, deploy recipes
- [`landing-gnu/README.md`](./landing-gnu/README.md) — CMS access layer, `SectionRenderer`, frontend-side overrides, Astro gotchas, deploy recipes (these apply to `gas-gnu`, `tectuus` and `trainin` too, swapping the domain and `CMS_API_URL`)
- [`build-server/README.md`](./build-server/README.md) — setup, API, `CODE_PATH`/`PUBLIC_PATH` layout and safety notes

**Shared gotchas** (see [`landing-gnu/README.md#notes--gotchas`](./landing-gnu/README.md#notes--gotchas) for the full writeup):

- **Env vars are build-time everywhere.** Changing `CMS_API_URL` or `VITE_*` does nothing until you rebuild (or restart the dev server).
- **Anything `VITE_`-prefixed ships in the admin's public JS bundle.** Never put a secret or a server filesystem path in `gnu-cms-admin/.env` — that's why build paths live in `build-server/.env`. The admin's `.env` is tracked on purpose (it only holds public URLs); the Astro sites' `.env` files are not committed.
- **Reserved env var names**: never name a custom Astro var `BASE_URL` (or `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) — Astro/Vite silently override them.
- **No shared logic in `.astro` files**: keep reusable non-UI code (API clients, formatters, config) in plain `.ts` files under `src/functions/`, `src/lib/` or `src/config/`.
- **Restart the Astro dev server to see CMS edits** — `src/lib/cms.ts` memoizes responses for the life of the process. Code changes still hot-reload.
- **Admin `site=` props use the CMS slug**, not the route prefix (see the identifiers table above) — a mismatch silently empty-states the page.

## For the webmaster

If you only edit content through `gnu-cms-admin` and don't touch code, here's what you need to know:

1. **Log in to `gnu-cms-admin`**, pick the site, and edit the section, page, or blog post you need. Saving updates the backend immediately.
2. **The public site does not update by itself.** When you're done editing, press **Reconstruir sitio** at the top of that site's page list. The button shows when the rebuild finishes (or fails, with details). If it reports the service is unreachable or not configured, ask a developer to rebuild and deploy that site.
3. **Follow the image/text size guides.** The admin blocks images over 5 MB and shows each image's measured size, and some text fields show a recommended-length hint — but it won't stop you from saving an oversized headline or an image with the wrong proportions, which can look broken on the live site. Per-section recommended image sizes and text lengths are in:
   - [`DOCUMENTACION-CONTENIDO-LANDING-GNU.txt`](./DOCUMENTACION-CONTENIDO-LANDING-GNU.txt) — GNU corporate
   - [`DOCUMENTACION-CONTENIDO-GAS-GNU.txt`](./DOCUMENTACION-CONTENIDO-GAS-GNU.txt) — GNU Vehicular
   - [`DOCUMENTACION-CONTENIDO-TECTUUS.txt`](./DOCUMENTACION-CONTENIDO-TECTUUS.txt) — Tectuus
   - [`DOCUMENTACION-CONTENIDO-TRAININ.txt`](./DOCUMENTACION-CONTENIDO-TRAININ.txt) — Trainin Logistic
4. **Images**: JPG for photos, PNG for logos/icons with transparency; keep files well under 1 MB where possible since nothing is compressed automatically. Page hero images on `landing-gnu` are expected at 2048×768 (GIFs at 800×320).
5. **Some things aren't editable from the admin**: page titles/menu labels, adding new sections to a page, and browsing/deleting previously uploaded media. A few labels and orderings are also fixed in the site's code (see `landing-gnu/README.md#frontend-side-overrides`). Ask a developer for those.
6. **Nothing you edit is private.** The public sites have no login — anything saved is visible to anyone once the site is rebuilt. Don't use the admin to stage content you don't want the public to eventually see.

## Publishing a content change

End-to-end, for any of the public sites:

1. Editor saves changes in `gnu-cms-admin` → stored in the CMS backend immediately.
2. The affected Astro project is rebuilt with `npm run build` — this is the moment the new content is actually fetched and baked into static HTML.
3. The resulting `dist/` is deployed (copied to the served folder, synced to S3/Azure, or redeployed on the hosting platform) — see that project's README.
4. Only after step 3 is the change visible to site visitors.

There is no automatic webhook from the CMS. Steps 2–3 happen either:

- **From the admin**: the **Reconstruir sitio** button calls [`build-server`](./build-server/README.md), which runs `npm run build` in that site's `CODE_PATH` and replaces the contents of its `PUBLIC_PATH` with `dist/`. This works when the sites are served from the same machine that runs `build-server`; a site with unset/placeholder paths fails closed with a clear error.
- **Manually or via CI**, for any other host (S3/CloudFront, Azure, Vercel, …) — remember to invalidate CDN caches for HTML afterwards.
