# GNU CMS Admin

Admin panel for **four independent public sites that share one Laravel headless CMS backend**: `gnu` (GNU corporate site), `gas-natural` (GNU Vehicular / gas-gnu), `trainin` (Trainin Logistic), and `tectuus` (industrial equipment + product catalog). A single React + Vite SPA lets editors log in once and manage page sections, blog posts, contact leads, stations, verification appointments, and (for Tectuus) a product catalog, across all four sites.

See [`CLAUDE.md`](./CLAUDE.md) for coding conventions and the production server layout, and [`GUIDELINES.md`](./GUIDELINES.md) for the design language shared with the public sites.

## Tech stack

- **React 19** + **Vite** (rolldown-powered `vite build`)
- **Tailwind CSS v4** via `@tailwindcss/vite` — no `tailwind.config.js`, utilities used directly in JSX
- **react-router v8** (`import from "react-router"`, not `react-router-dom`)
- **zustand** (+ `persist` middleware) for two stores: session (auth token) and per-site public URLs
- **Leaflet** for the station map pickers (`stations_map` sections and the station editor)

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173 with HMR
```

Other scripts:

```bash
npm run lint       # oxlint
npm run build      # production build -> dist/
npm run preview    # serve the dist/ build locally, for a final smoke test
```

## Environment configuration (`.env`)

```bash
# .env
VITE_BASE_URL=https://gnu-headless-cms.165.227.59.215.sslip.io
VITE_BUILD_SERVER_URL=http://localhost:4400
```

| Var | Required | Purpose |
| :-- | :-- | :-- |
| `VITE_BASE_URL` | yes | The CMS API origin, no trailing slash. Every call in `fetch.jsx` prepends this to a path starting with `/api/...`. |
| `VITE_BUILD_SERVER_URL` | only for the "Reconstruir sitio" button | Origin of the separate `build-server` service (see [Rebuilding a site](#rebuilding-a-site-reconstruir-sitio) below). Without it, the rebuild button shows a clear "not configured" error instead of failing silently. |

- Both must be `VITE_`-prefixed for Vite to expose them to client code (`import.meta.env.VITE_*`) — **anything with that prefix ships inside the public JS bundle**, readable by anyone with dev tools open. Never put a secret or a server filesystem path in this file for that reason (see the rebuild section for why `build-server` keeps its own, separate `.env`).
- Read at build time: changing a value requires restarting `npm run dev` or re-running `npm run build`.
- `.env` **is tracked in this repo** (not gitignored) — by design, since today it holds no secrets, only a public API origin and a service URL. To point at a different backend (staging, another environment) without touching the tracked file, create `.env.production.local` / `.env.development.local` with an override; Vite picks those up automatically and they're gitignored by Vite's default pattern.

## Authentication & sessions

[`src/store/sessionStore.jsx`](./src/store/sessionStore.jsx) is a zustand store (`useSessionStore`) holding `accessToken` and `tenantDomain`, wrapped in `persist` so the session survives a reload (`localStorage` key `gnu-cms-session`; only `accessToken` is persisted — `tenantDomain` always comes fresh from `VITE_BASE_URL` on load, so an old session can't silently pin the app to a stale API host).

- `login(email, password)` populates the store on success.
- `logout()` calls the backend's logout endpoint, then always clears `accessToken` (in a `finally`), even if the request fails.
- **Every other authenticated call** checks for a `401` response and, if it gets one, calls the module-private `handleUnauthorized()`: clears `accessToken` and redirects to `/login` (guarded so it won't loop if already there). A backend JWT's default TTL is an hour, so this is the normal way a long-open tab gets kicked back to login, not just a logout path.

## Site identifiers — four names for the same four sites

This is the single most confusing thing in the codebase, so it gets its own table. The same site is addressed differently depending on which layer you're in:

| Site | Admin route prefix (`src/pages/<this>`, `App.jsx`) | CMS `site` slug (`?site=` in every API call) | `pageUrls` store key | `build-server` env var prefix |
| :-- | :-- | :-- | :-- | :-- |
| GNU corporate | `gnu` | `gnu` | `gnu` | `VITE_GNU_` |
| GNU Vehicular | `gas-natural` | `gnu-vehicular` | `gas-gnu` | `VITE_GAS_NATURAL_` |
| Trainin Logistic | `trainin` | `traninn-logistic` | `trainin` | `VITE_TRANINN_` |
| Tectuus | `tectuus` | `tectuus` | `tectuus` | `VITE_TECTUUS_` |

Three of the four have a **different** CMS slug than their admin route prefix — a page component's `site="..."` prop (passed to `PageSectionsEditor`/`SectionsFields`) must be the CMS slug (middle column), not the route prefix, or every fetch for that page silently 404s/empty-states. Double-check this specifically when adding a page to `gas-natural`, `trainin`, or `tectuus`.

## How the app talks to the backend (REST)

All HTTP calls live in **[`src/functions/fetch.jsx`](./src/functions/fetch.jsx)** — there is no separate API client library or codegen; every endpoint gets a small exported `async` function there. Pages import only the functions they need instead of calling `fetch` directly, and every mutating call follows the same hand-written pattern (own headers, own 401 check, own catch) rather than a shared `request()` wrapper — copy the nearest existing function when wiring up a new endpoint.

Every backend response follows the envelope `{ status: "success" | "error", data, meta }`; a network failure or a `401` is normalized into that same shape so every caller can just read `res.status`/`res.data` without a `try`/`catch` of its own.

| Function | Endpoint | Notes |
| :-- | :-- | :-- |
| `login(email, password)` | `POST /api/admin/auth/login` | Populates the session store on success |
| `logout()` | `POST /api/admin/auth/logout` | Clears the token regardless of the response |
| `fetchData(suffix)` | `GET <suffix>` | Generic authenticated GET — pass e.g. `` `/api/admin/sections?site=gnu&page=inicio` `` |
| `updateSection(id, content)` | `PUT /api/admin/sections/{id}` | Full-replace of `content` (see [Section editing semantics](#section-editing-semantics)) |
| `createBlogPost` / `updateBlogPost` / `deleteBlogPost` | `/api/admin/blog-posts` | gnu, gas-natural, trainin only — Tectuus has no blog |
| `createProductCategory` / `updateProductCategory` / `deleteProductCategory` | `/api/admin/product-categories` | Tectuus only |
| `createProduct` / `updateProduct` / `deleteProduct` | `/api/admin/products` | Tectuus only |
| `createStation` / `updateStation` / `deleteStation` | `/api/admin/stations` | Backs every `stations_map` section's station list (see `stations-editor.jsx`) |
| `deleteAppointment(id)` | `DELETE /api/admin/appointments/{id}` | Read via `fetchData`; no create/update — an appointment is only ever generated by a site visitor |
| `uploadMedia(file)` | `POST /api/admin/media` (multipart) | Returns `{path, url}`; the `url` is what gets stored in section/post content — the UI never stores raw files |
| `rebuildSite(site)` / `getRebuildStatus(site)` | `build-server`'s `POST`/`GET /builds/:site` | Separate service, see below |

## Routing & folder structure

- `src/App.jsx` owns the top-level `<Routes>` tree and renders the public landing page directly.
- Route components live under `src/pages/<site>/<page>/index.jsx` and are routed at `/<site>/<page>` — there is no filesystem-based router, so adding a page means adding both the file **and** a `<Route>` in `App.jsx`.
- `BrowserRouter` wraps `<App />` in `src/main.jsx`.

```
src/
├── App.jsx                    # <Routes> tree + the public landing page
├── main.jsx                    # React root, wraps <App /> in <BrowserRouter>
├── index.css                   # Tailwind entry point
├── assets/                     # images used by the landing page
├── components/
│   ├── card.jsx                  # status-dot card used on the Home dashboard
│   ├── form-fields.jsx           # shared primitives: Field, ImageField (upload + client-side
│   │                              # size/dimension checks), DynamicItem, AddButton, CharHint/
│   │                              # WordHint, fieldError(), inputClass/buttonSecondaryClass
│   ├── map-picker.jsx             # <MapPicker lat lng onPick zoom /> — click-to-place Leaflet marker
│   ├── stations-editor.jsx        # <StationsEditor site siteId /> — CRUD for a site's stations
│   │                              # (name/address/phone/schedule/lat-lng/active), embedded under
│   │                              # every `stations_map` section card
│   ├── site-url-link.jsx          # <SiteUrlLink site /> — click-through + pencil-to-edit for a
│   │                              # site's public URL (backed by the pageUrls store)
│   ├── rebuild-site-button.jsx    # <RebuildSiteButton site /> — the "Reconstruir sitio" button
│   └── page-sections-editor.jsx   # the shared section-editing machinery (see below)
├── functions/
│   └── fetch.jsx                 # all REST calls (see above)
├── store/
│   ├── sessionStore.jsx           # zustand: auth token, tenant domain
│   └── pageUrls.jsx                # zustand+persist: site -> public URL map
└── pages/
    ├── login/, home/                       # pre- and post-login shell
    ├── gnu/                                 # GNU corporate site
    ├── gas-natural/                          # GNU Vehicular (CMS slug gnu-vehicular)
    ├── trainin/                              # Trainin Logistic (CMS slug traninn-logistic)
    └── tectuus/                              # Tectuus
```

Each site folder follows the same shape: a `select-page.jsx` (the card grid shown after clicking that site's card on Home — also hosts `<SiteUrlLink>` and `<RebuildSiteButton>`), then one subfolder per top-level nav item. A nav item with its own children (e.g. `nuestros-servicios`) is itself a `select-page`-style folder with an `index.jsx` listing its children plus a `portada/index.jsx` that edits the **parent item's own** sections — the parent's `index.jsx` is pure navigation, it holds no CMS content itself.

## Shared components

**`page-sections-editor.jsx`** is the core abstraction almost every page is built from: "fetch this page's sections, render one editor per section `type`, let the editor `PUT` the full section content back." It exports:

- **`PageSectionsEditor`** (default) — full page chrome (back link, title, section count) + `SectionsFields`. Used as a one-line wrapper by most pages: `<PageSectionsEditor site="..." page="..." title="..." backTo="..." includeGlobals? />`.
- **`SectionsFields`** — headless version (no back link/title), for embedding inline alongside other content (e.g. the Contacto pages embed it below their leads table).
- **`GlobalSectionsFields`** — just the site-wide sections (`contact_info`, `social_icons`, `whatsapp_button`, and `testimonials` where a site has it) — these have `page_id: null` server-side, so they're fetched and rendered separately, not mixed into a specific page's list. Pass `includeGlobals` on `PageSectionsEditor`/`SectionsFields` only from the one page meant to surface them (each site's landing page), or embed `<GlobalSectionsFields site="..." />` directly, like `gnu/editable-sections` does (a page that predates this shared component and still keeps its own local copy of several editors for historical reasons).

**Known non-obvious behavior**: `GET /api/admin/sections?site&page=` has been observed on at least one site (`traninn-logistic`) returning *every* section of the site regardless of the `page` filter. To stay correct regardless of which backend behaves this way, `loadPageSections`/`loadGlobalSections` resolve the real numeric `page_id` from `GET /api/admin/pages?site=` and narrow the result client-side rather than trusting the server's `page` filter — so every page is defensively self-correcting even when the backend's filter is a no-op.

### Section editing semantics

- `PUT /api/admin/sections/{id}` is a **full replacement** of `content`, not a patch — arrays like `slides`/`items`/`logos` are replaced wholesale. Every editor keeps the whole `content` object in local state and submits it entirely on save.
- Some fields are server-side "fijo" (locked) per section type — e.g. `lead_capture_form.fields[]` — the backend drops them from validation and merges the previous value back in, so the admin doesn't need to (and can't) change them; the editor just displays them read-only.
- A section `type` with no matching editor renders as a read-only, pretty-printed JSON block instead of a form, so a newly-seeded section type never looks broken in the admin — it's just not editable from the UI yet.

### Section types with a real editor

| Type | What it edits |
| :-- | :-- |
| `page_hero` | Title, subtitle, image |
| `rich_text` | Title, HTML body, video URL |
| `feature_grid` | Section title + cards (icon, title, text) |
| `clients_showcase` | Section title + logos (image, name, link, description, quote, quote author) |
| `stations_map` | Title, map center/zoom (click-to-place) — **plus** the embedded `StationsEditor` for that site's actual station pins |
| `lead_capture_form` | Title, intro, submit label (the `fields[]` list is locked) |
| `service_scheduling` | Title, intro, confirmation message (the bookable time slots are hardcoded backend-side, not content) |
| `banner_carousel` | Slides (image, title, subtitle, link URL/label) |
| `savings_simulator` | Title, intro, fuel price comparison rows |
| `contact_info` | Address, phone, email, schedule, extra info |
| `social_icons` | Network + URL list |
| `whatsapp_button` | Phone, prefilled message |
| `image_gallery` | Section title + images (image, caption, alt) |
| `testimonials` | Section title + quotes (photo, quote, author, role) |

## Site-by-site content map

| Site | Blog | Contacto | Site-specific extras |
| :-- | :-- | :-- | :-- |
| `gnu` | yes | leads + sections | `desarrollo-sostenible` (parent + 4 children), `sobre-nosotros` (parent + 4 children), `nuestros-servicios` (parent + GNC/GND/GNV) |
| `gas-natural` | yes | leads + sections | `nuestros-servicios` (parent + 5 service pages), `ubicaciones` (parent + 2 stations + `agenda-tu-verificacion` with its own appointments list + `talleres`) |
| `trainin` | yes | leads + sections | `nuestros-servicios` (parent + 3 children), `sobre-nosotros` (parent + 3 children), `ubicaciones` (single flat page) |
| `tectuus` | **no** | leads (with an "Origen" column — this site's lead form exists on more than one page) + sections | `sobre-nosotros` (single flat page, no children), `productos` (its own `page_hero` section **plus** full category/product catalog CRUD — a separate data resource, not CMS sections) |

Every site's landing page (`inicio`/`editable-sections`) renders with `includeGlobals`, so it's also where `contact_info`/`social_icons`/`whatsapp_button`/`testimonials` get edited.

## Per-site public URL quick-links

`src/store/pageUrls.jsx` + `<SiteUrlLink site="..." />` (top of every `select-page.jsx`) lets an editor click straight through to that site's live public URL, with a pencil icon to update the stored URL inline. Purely a convenience bookmark in `localStorage` — it has no effect on routing, the CMS, or the build; `site` here must be the **`pageUrls` store key** column from the identifiers table above, not the admin route or CMS slug.

## Rebuilding a site ("Reconstruir sitio")

The Astro sites only read the CMS **at build time**, so a saved edit is invisible on the public site until it's rebuilt — and a browser SPA can't run `npm run build` or touch a server filesystem itself. `<RebuildSiteButton site="..." />` (admin route prefix) calls a **separate** zero-dependency Node service, `../build-server`, via `rebuildSite`/`getRebuildStatus` in `fetch.jsx`.

- Configure it with `VITE_BUILD_SERVER_URL` in **this** repo's `.env` — just the URL, nothing else belongs here.
- Everything else — each site's `CODE_PATH` (where `npm run build` runs) and `PUBLIC_PATH` (what the web server serves, fully replaced with `CODE_PATH/dist/` after a successful build) — lives in `build-server`'s own `.env`, never in this one, since this repo's `.env` ships inside the public browser bundle and those are real server filesystem paths.
- A site with unset/placeholder paths fails the build closed with a clear error rather than risking a destructive filesystem operation.
- Full setup, API, and safety notes: **[`../build-server/README.md`](../build-server/README.md)**.

## Building for production

```bash
npm run build
```

Outputs a static site to `dist/` — `index.html` plus an `assets/` folder (hashed JS/CSS bundles). This is a pure client-side SPA: **every route must fall back to `index.html`**, since `react-router`'s `BrowserRouter` resolves paths like `/gnu/blog` on the client. Both deployment options below account for that.

### Deploying `dist/` to Nginx

1. Copy the contents of `dist/` to the server, e.g. `/var/www/gnu-cms-admin`.
2. Nginx server block:

   ```nginx
   server {
       listen 80;
       server_name admin.example.com;

       root /var/www/gnu-cms-admin;
       index index.html;

       # SPA fallback: any unknown path serves index.html, react-router takes it from there
       location / {
           try_files $uri $uri/ /index.html;
       }

       # long-cache hashed build assets; index.html itself must NOT be cached
       location /assets/ {
           access_log off;
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       location = /index.html {
           add_header Cache-Control "no-cache";
       }
   }
   ```

3. Put TLS in front of it (e.g. `certbot --nginx`) — the admin sends a bearer token on every request, so it should only ever be served over HTTPS.
4. Reload: `nginx -t && systemctl reload nginx`.

### Deploying `dist/` to Amazon S3

1. Create a bucket (bucket name doesn't need to match the domain unless you're using it as the apex/CNAME target).
2. Enable **Static website hosting** on the bucket:
   - Index document: `index.html`
   - **Error document: `index.html`** — this is the SPA-fallback equivalent of the Nginx `try_files` rule above. Without it, refreshing on `/gnu/blog` returns S3's 404 page instead of the app.
3. Upload the build, replacing whatever was there before:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```
4. Set the bucket policy to allow public `s3:GetObject` (or keep it private and put CloudFront's Origin Access Control in front — recommended for HTTPS + a custom domain anyway).
5. **Recommended**: put a CloudFront distribution in front of the bucket:
   - Origin: the bucket (via OAC, not the public website endpoint)
   - Add a **custom error response**: HTTP 403 and 404 → response page `/index.html`, HTTP code `200` — this is the CloudFront-level SPA fallback (needed because an OAC-backed S3 origin doesn't apply the bucket's own "error document" setting).
   - Attach an ACM certificate for HTTPS and your domain.
6. Re-deploys: re-run the `aws s3 sync` command, then invalidate CloudFront's cache for `/index.html` (`aws cloudfront create-invalidation --distribution-id <id> --paths "/index.html"`) so clients don't keep the old build cached.

### Deploying `dist/` to Azure Static Web Apps

The simplest Azure option for this app: a static host with built-in SPA fallback, free managed TLS on a custom domain, and (if you link it to this repo) a CI pipeline Azure sets up for you.

1. Add `staticwebapp.config.json` at the **repo root** (Azure looks for it next to the app, or inside `dist/` if you commit it there instead):

   ```json
   {
     "navigationFallback": {
       "rewrite": "/index.html",
       "exclude": ["/assets/*", "/favicon.svg", "/*.{png,jpg,svg,ico}"]
     },
     "globalHeaders": {
       "Cache-Control": "no-cache"
     },
     "mimeTypes": {
       ".json": "application/json"
     }
   }
   ```

   `navigationFallback` is the SPA-fallback equivalent of the Nginx `try_files`/S3 "error document" rules above — any unknown path serves `index.html` and `react-router` takes it from there, while the `exclude` list keeps real asset requests (and genuine 404s for them) from being swallowed by the rewrite.

2. **Env vars are build-time, not runtime** — same caveat as everywhere else in this README. Azure Static Web Apps has no server to read "Application settings" from at request time for a static build like this one; `VITE_BASE_URL`/`VITE_BUILD_SERVER_URL` must be set as pipeline/CI variables (or in a committed `.env.production`) *before* `npm run build` runs, not configured in the Azure portal after deploying.
3. Deploy either:
   - **Via the Azure Static Web Apps CLI**, pointing it straight at the already-built output: `swa deploy ./dist --env production` (after `swa login`), or
   - **Via GitHub Actions**: creating the Static Web App resource in the Azure portal and linking it to this repo scaffolds a workflow using `Azure/static-web-apps-deploy@v1`. Set `app_location` to the repo root, `output_location` to `dist`, and add a build step (`npm ci && npm run build`) before the deploy step — don't let the action's own Oryx build step run `npm run build` for you unless the pipeline's env vars are set at that stage too.
4. Custom domain + TLS: attach the domain in the Static Web App's **Custom domains** blade — Azure provisions and renews the certificate automatically, no `certbot` step needed.
5. Re-deploys: re-run `swa deploy` (CLI) or just push to the linked branch (GitHub Actions) — Azure Static Web Apps replaces the previous deployment and handles cache invalidation for you.

If you'd rather use the same bucket-plus-CDN shape as the S3 section above instead of Static Web Apps, Azure's equivalent is **Blob Storage static website hosting + Azure CDN/Front Door** in front of it, with the CDN's custom error response (404 → `/index.html`, 200) standing in for CloudFront's.

## Known limitations

- **No page-title/menu editor.** A page's own `title` (used e.g. as the badge label on `ServiceCards`-style preview cards on the public sites) is blueprint/seed data — `UpdatePageRequest` only accepts `is_published`, and nothing in the admin exposes a page-settings screen. Changing a page's title requires a backend change.
- **No section-creation UI.** The backend upserts a section by `(page_id, type)` via `PUT`, but the admin has no "add a new section to this page" control — sections are seeded server-side; the admin only edits existing ones.
- **No media library browse/manage UI.** `uploadMedia()` (`POST /api/admin/media`) is used everywhere a file is picked, but there's no screen for `GET /api/admin/media` (list previously-uploaded files for reuse) or `DELETE /api/admin/media/{name}` (remove an old upload) — the backend supports both already.

## Other relevant notes

- **No backend in this repo.** This project only talks to the headless CMS API (and the separate `build-server`) over HTTP; there's no server code, database, or SSR here — it's a static bundle once built.
- **Design system**: colors, buttons, and card/glass styles are documented in `CLAUDE.md`; keep new UI consistent with that palette rather than introducing new colors.

## Sorting categories and products at Tectuus site
- **Ordering**: the CMS has no sort field for categories or products, so editors order them with a numeric prefix on the name (`1 - EDRM`, `2 - Compresores`; `1 - EDRM-500`). The prefix only sets the order and is never shown on the site. Keep the `N - Name` format (number, dash).
  - **Categories** are sorted by the prefix in `fetchCategories()`, so the chips, shelves and Productos submenu all share one order. Categories without a prefix keep API order after the numbered ones.
  - **Products** are sorted within their category by `orderByPrefix()`, on the catalog shelves and on the product page (title, "Más de …" list). A category is only reordered when **every** product in it has a prefix and no two share a number. Otherwise the whole category keeps the server's order and names unchanged, prefixes included.