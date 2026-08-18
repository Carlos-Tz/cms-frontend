# GNU CMS Admin

Admin panel for the GNU headless CMS. A React + Vite single-page app that lets editors log in and manage the content (page sections, blog posts, contact leads, stations) that the public GNU sites read from the same backend over a REST API.

See [`CLAUDE.md`](./CLAUDE.md) for the coding conventions used in this repo and [`GUIDELINES.md`](./GUIDELINES.md) for the shared design language between this admin and the public sites it manages.

## Tech stack

- **React 19** + **Vite** (rolldown-powered `vite build`)
- **Tailwind CSS v4** via `@tailwindcss/vite` — no `tailwind.config.js`, utilities are used directly in JSX
- **react-router v8** (`import from "react-router"`, not `react-router-dom`)
- **zustand** (+ `persist` middleware) for the session store
- **Leaflet** for the station map picker

## Development

```bash
npm install
npm run dev       # starts Vite on http://localhost:5173 with HMR
```

Other scripts:

```bash
npm run lint       # oxlint
npm run build      # production build -> dist/
npm run preview    # serve the dist/ build locally, for a final smoke test
```

## Environment configuration (`.env`)

The app talks to a single backend origin, configured through one Vite env var:

```bash
# .env
VITE_BASE_URL=https://gnu-headless-cms.165.227.59.215.sslip.io
```

- Must be prefixed with `VITE_` for Vite to expose it to client code (`import.meta.env.VITE_BASE_URL`).
- No trailing slash — every API call in the app prepends a path starting with `/api/...`.
- Vite reads `.env` (and `.env.production`, `.env.development`, etc. if you add them) at build time — changing it requires restarting `npm run dev` or re-running `npm run build`.
- To point the admin at a different backend (staging, another environment), create a copy such as `.env.production.local` with a different `VITE_BASE_URL` before building.

## How the app talks to the backend (REST)

All HTTP calls live in **[`src/functions/fetch.jsx`](./src/functions/fetch.jsx)** — there is no separate API client library or codegen; every endpoint the admin needs gets a small exported `async` function there (`login`, `logout`, `fetchData`, `updateSection`, `uploadMedia`, `createBlogPost`, `updateBlogPost`, `deleteBlogPost`, …). Pages import only the functions they need from this file instead of calling `fetch` directly.

Request/response shape:

- Every backend response follows the envelope `{ status: "success" | "error", data, meta }`.
- The bearer token is read from the session store (see below) and attached as `Authorization: Bearer <token>` on every authenticated call.
- `fetchData(suffix)` is the generic authenticated `GET` helper — pass it a path like `` `/api/admin/sections?site=gnu&page=inicio` `` and it prefixes `VITE_BASE_URL` and the auth header for you.
- Mutating calls (`updateSection`, `createBlogPost`, etc.) are one function per endpoint, each building its own `fetch(..., { method, headers, body })` — copy this pattern when wiring up a new endpoint rather than introducing a generic `request()` wrapper.

**Auth & session persistence** — [`src/store/sessionStore.jsx`](./src/store/sessionStore.jsx) is a zustand store (`useSessionStore`) holding `accessToken` and `tenantDomain`, wrapped in zustand's `persist` middleware so the session survives a page reload (stored under the `gnu-cms-session` key in `localStorage`). `login()` populates it on success; `logout()` clears `accessToken` after calling the backend's logout endpoint.

## Folder structure

```
src/
├── App.jsx                 # <Routes> tree + the public landing page
├── main.jsx                 # React root, wraps <App /> in <BrowserRouter>
├── index.css                 # Tailwind entry point
├── assets/                   # images used by the landing page
├── components/
│   ├── card.jsx               # status-dot card used on the Home dashboard
│   ├── form-fields.jsx        # shared form primitives: Field, ImageField (with upload +
│   │                           # client-side size/dimension checks), DynamicItem, AddButton,
│   │                           # CharHint/WordHint, fieldError(), inputClass/buttonSecondaryClass
│   └── page-sections-editor.jsx  # <PageSectionsEditor site page title backTo /> — generic
│                               # "load + edit + create sections for one CMS page" component,
│                               # reused by every gnu/<page>/index.jsx below
├── functions/
│   └── fetch.jsx              # all REST calls (see above)
├── store/
│   └── sessionStore.jsx       # zustand session store (auth token, tenant domain)
└── pages/
    ├── login/index.jsx
    ├── home/index.jsx         # post-login dashboard, one card per managed site
    ├── gnu/                   # everything for the "Página web GNU" site
    │   ├── select-page.jsx     # page picker shown after clicking the GNU card on Home
    │   ├── editable-sections/index.jsx   # Landing Page sections (site=gnu&page=inicio&global=1)
    │   ├── blog/index.jsx      # blog post CRUD (list, create, edit, delete)
    │   ├── contacto/index.jsx  # leads table + "add station" Leaflet form
    │   ├── nuestros-servicios/index.jsx
    │   ├── sobre-nosotros/     # parent page + 4 sub-pages, each a thin
    │   │   ├── index.jsx        # wrapper around <PageSectionsEditor page="<slug>" />
    │   │   ├── portada/index.jsx
    │   │   ├── proposito-empresarial/index.jsx
    │   │   ├── valores/index.jsx
    │   │   ├── certificaciones/index.jsx
    │   │   └── nuestra-historia/index.jsx
    │   └── desarrollo-sostenible/   # same parent + sub-pages pattern
    │       ├── index.jsx
    │       ├── portada/index.jsx
    │       ├── distintivo-esr/index.jsx
    │       ├── ecovadis/index.jsx
    │       ├── voluntariado/index.jsx
    │       └── iniciativas-rse/index.jsx
    └── gas-natural/
        └── select-page.jsx     # scaffold for the next managed site
```

**Routing convention** (see `CLAUDE.md`): route components live under `src/pages/<name>/index.jsx` and are registered manually as `<Route>` elements in `App.jsx` — there is no filesystem-based router, so adding a page means adding both the file *and* a `<Route>` in `App.jsx`.

**Why `page-sections-editor.jsx` is shared**: most GNU pages are just "fetch this page's sections, render one editor per section `type`, let the editor PUT the full section content back." Rather than duplicating that per page, every `gnu/<page>/index.jsx` (except `editable-sections`, which predates the shared component and still has its own copy of the form editors) is a one-line wrapper: `<PageSectionsEditor page="<slug>" title="..." backTo="..." />`. Known section types with real forms: `page_hero`, `rich_text`, `feature_grid`, `clients_showcase`. Anything else falls back to a read-only JSON view until its schema is known.

## Building for production

```bash
npm run build
```

Outputs a static site to `dist/` — `index.html` plus a `assets/` folder (hashed JS/CSS bundles). This is a pure client-side SPA: **every route must fall back to `index.html`**, since `react-router`'s `BrowserRouter` resolves paths like `/gnu/blog` on the client. Both deployment options below account for that.

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

## Other relevant notes

- **No backend in this repo.** This project only talks to the headless CMS API over HTTP; there's no server code, database, or SSR here — it's a static bundle once built.
- **Image uploads** go through `POST /api/admin/media` (`uploadMedia()` in `fetch.jsx`), which returns a ready-to-use `url` that gets stored directly in section/post content — the UI never stores raw files.
- **Section updates are full replacements**, not patches: `PUT /api/admin/sections/{id}` expects the entire `content` object (arrays like `slides`/`items`/`logos` are replaced wholesale), which is why every section editor keeps the full content object in local state before submitting.
- **Creating a not-yet-existing section** is supported by the backend via `PUT` (it upserts), but the admin doesn't yet have a lookup table of reserved ids per page — the "+ Crear sección" control in `page-sections-editor.jsx` currently asks for the id manually.
- **Design system**: colors, buttons, and card/glass styles are documented in `CLAUDE.md`; keep new UI consistent with that palette rather than introducing new colors.
