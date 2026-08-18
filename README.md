# GNU CMS Frontend — Monorepo

This repo holds the frontend half of the GNU headless CMS system: one **admin panel** that content editors log into, and a set of **public marketing sites** that read whatever the admin publishes. There is no backend code here — everything below talks to the same external headless CMS API over REST.

```
cms-frontend/
├── gnu-cms-admin/   # React + Vite admin panel (login required) — editors manage content here
├── landing-gnu/     # Astro public site — GNU Gas Natural (gnugas.mx) — LIVE, fully built out
├── gas-gnu/         # Astro public site — Gas natural vehicular — scaffold, not yet built
├── tectuus/         # Astro public site — Tectuus — scaffold, not yet built
└── trainin/         # Astro public site — Trainnin Logistic — scaffold, not yet built
```

## How the pieces fit together

```
┌────────────────┐   editors log in, edit    ┌──────────────────┐
│  gnu-cms-admin  │ ────────────────────────▶ │  External headless│
│  (React SPA)    │   REST + bearer token     │  CMS backend       │
└────────────────┘                            └─────────┬────────┘
                                                          │ REST, no auth,
                                                          │ read-only, at BUILD time
                                                          ▼
                                                ┌───────────────────┐
                                                │  Astro sites       │
                                                │  (landing-gnu, …)  │
                                                │  → static dist/    │
                                                └───────────────────┘
                                                          │
                                                          ▼
                                              published to the public,
                                              no login, no password
```

- **`gnu-cms-admin`** is a password-protected React SPA. Editors log in, and every request carries a bearer token (see [`gnu-cms-admin/README.md`](./gnu-cms-admin/README.md)). This is the **only** part of the system that requires authentication.
- **The Astro sites** (`landing-gnu`, `gas-gnu`, `tectuus`, `trainin`) are **fully public, unauthenticated static sites**. They fetch content from the same CMS backend, but only **at build time** (`npm run build`), and only public/published data — there is no login, no admin UI, and no session on these sites. Treat anything an editor saves in the admin as something that will become visible to the world on the next rebuild; there is no "private preview" or draft gate on the public side.
- Because the Astro sites are static (no SSR adapter), **a content edit in the admin does not appear on the live site until someone rebuilds and redeploys that site.** This is the single most important operational fact for both developers and the webmaster — see [Publishing a content change](#publishing-a-content-change).

## Project status

| Project | Role | Status |
| :--- | :--- | :--- |
| [`gnu-cms-admin`](./gnu-cms-admin/README.md) | Admin panel (all sites, one login) | Active — manages the `gnu` site today; other sites scaffolded in `src/pages/gas-natural/` |
| [`landing-gnu`](./landing-gnu/README.md) | Public site — GNU Gas Natural | Fully built (pages, sections, CMS integration) |
| `gas-gnu` | Public site — Gas natural vehicular | Astro scaffold only — no CMS wiring yet |
| `tectuus` | Public site — Tectuus | Astro scaffold only — no CMS wiring yet |
| `trainin` | Public site — Trainnin Logistic | Astro scaffold only — no CMS wiring yet |

When building out `gas-gnu`, `tectuus`, or `trainin`, copy the pattern already working in `landing-gnu` (`src/functions/fetch.ts`, `SectionRenderer.astro`, the `Layout.astro` global-content fetch) rather than reinventing it — see [`landing-gnu/README.md`](./landing-gnu/README.md), which is the up-to-date reference implementation. All four Astro projects share one visual design language with the admin, documented once in each project's `GUIDELINES.md` (identical copy in all four repos — token colors, buttons, cards, form fields).

## For developers

Each project is independent (its own `package.json`, `.env`, `node_modules`) — there is no workspace/monorepo tooling (no Lerna/Turborepo/pnpm workspaces), so `cd` into a project before running any npm command.

| Project | Dev command | Env var | Build output |
| :--- | :--- | :--- | :--- |
| `gnu-cms-admin` | `npm run dev` → `localhost:5173` | `VITE_BASE_URL` (backend origin, no trailing slash) | `dist/` — SPA, needs a rewrite-to-`index.html` fallback when deployed |
| `landing-gnu` | `npm run dev` (or `astro dev --background` for automated/agent use) → `localhost:4321` | `CMS_API_URL` (backend origin, trailing slash) | `dist/` — plain static HTML/CSS/JS |
| `gas-gnu` / `tectuus` / `trainin` | same as `landing-gnu`, once CMS wiring is added | — not yet configured | `dist/` |

Full dev/build/deploy instructions (including Nginx/S3/CloudFront/Azure Static Web Apps configs) live in each project's own README — this file only covers what's shared:

- [`gnu-cms-admin/README.md`](./gnu-cms-admin/README.md) — REST client, session/auth store, folder structure, Nginx + S3/CloudFront deploy recipes
- [`landing-gnu/README.md`](./landing-gnu/README.md) — CMS section rendering, env config, Astro gotchas, Nginx/VPS + serverless deploy recipes

**Shared gotchas across all Astro projects** (see `landing-gnu/README.md#notes--gotchas` for the full writeup):
- Never name a custom `.env` var `BASE_URL` (or `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) — Astro/Vite reserve those names and will silently override them.
- Keep reusable non-UI logic (API clients, formatters) in plain `.ts` files under `src/functions/`, never inside a `.astro` file's frontmatter as an exported function — Astro scopes top-level `const`/`let` per-component in a way that breaks this.
- All four Astro repos and the admin use `astro dev --background` / equivalent when a dev server is needed for an automated or background task, not a foreground blocking process.

## For the webmaster

If you only edit content through `gnu-cms-admin` and don't touch code, here's what you need to know:

1. **Log in to `gnu-cms-admin`** and edit the section, page, or blog post you need to change. Saving in the admin updates the backend immediately.
2. **The public site does not update by itself.** Because the public sites (`landing-gnu`, etc.) are static, a saved change only becomes visible on the live site after a developer (or an automated job, if one is set up) **rebuilds and redeploys** that specific site. If nobody has wired up an automatic rebuild trigger yet, ask a developer to run the deploy for the site you edited.
3. **Follow the image/text size limits.** The admin does **not** validate image dimensions or text length before saving — it will let you save an oversized image or an overly long headline, but the live site's layout will look broken (cropped image, overflowing text). See [`DOCUMENTACION-CONTENIDO-LANDING-GNU.txt`](./DOCUMENTACION-CONTENIDO-LANDING-GNU.txt) for the per-section recommended image sizes and text lengths for `landing-gnu`.
4. **Images**: max 5 MB per file (hard server limit, no warning in the UI beforehand); JPG for photos, PNG for logos/icons with transparency; keep files well under 1 MB where possible since nothing is compressed automatically.
5. **Nothing you edit is private.** The public sites have no login — anything saved and published is visible to anyone who visits the site once it's rebuilt. Don't use the admin to stage content you don't want the public to eventually see.

## Publishing a content change

End-to-end, for any of the public sites:

1. Editor saves changes in `gnu-cms-admin` → stored in the CMS backend immediately.
2. A developer (or CI job) runs `npm run build` in the affected Astro project — this is the moment the new content is actually fetched and baked into static HTML.
3. The resulting `dist/` is deployed (copied to the server, synced to S3, or redeployed on the hosting platform) — see that project's README for the exact steps.
4. Only after step 3 is the change visible to site visitors.

There is currently no automatic webhook from the CMS to trigger a rebuild — until one exists, publishing is a manual step after every content change.
