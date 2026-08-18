# GNU Gas Natural — Landing

Astro static site for GNU Gas Natural. Content (page sections, blog posts, contact info, social links, etc.) is authored in a headless CMS and pulled in over REST **at build time**, then rendered to plain HTML/CSS/JS.

## 🚀 Project Structure

```text
/
├── public/                     # Static assets copied as-is (favicon, etc.)
├── src/
│   ├── assets/                 # Images processed by Astro's asset pipeline
│   ├── components/
│   │   ├── SectionRenderer.astro   # Maps a CMS section "type" to its Astro component
│   │   └── sections/                # One component per CMS section type
│   │       ├── PageHero.astro
│   │       ├── RichText.astro
│   │       ├── FeatureGrid.astro
│   │       ├── LeadCaptureForm.astro
│   │       ├── StationsMap.astro
│   │       └── ClientsShowcase.astro
│   ├── functions/
│   │   └── fetch.ts            # REST client for the CMS (fetchData/sendData/updateData, mediaUrl)
│   ├── layouts/
│   │   └── Layout.astro        # Shared shell: header, footer, nav — fetches global content (contact info, social links, WhatsApp button)
│   ├── pages/                  # File-based routing — each .astro/.html here is a route
│   │   ├── index.astro
│   │   ├── inicio/
│   │   ├── nuestros-servicios/
│   │   ├── sobre-nosotros/     # + valores, proposito-empresarial, certificaciones, nuestra-historia
│   │   ├── desarrollo-sostenible/  # + distintivo-esr, ecovadis, voluntariado, iniciativas-rse
│   │   ├── blog/               # index + [slug] dynamic route
│   │   └── contacto/
│   └── styles/                 # global.css, tokens.css (design tokens)
├── astro.config.mjs
├── .env                        # CMS_API_URL (not committed)
└── package.json
```

Astro turns every `.astro`/`.md` file under `src/pages/` into a route based on its filename. Reusable, non-component logic (like the CMS client) must live in a plain `.ts` file, not a `.astro` file — see [Notes & gotchas](#notes--gotchas).

## Environment configuration

The site reads the CMS base URL from a single env var:

```env
# .env
CMS_API_URL=https://your-cms-host/api/public/gnu/
```

- Copy `.env` (or create it) in the project root before running dev or build — it is **not** committed to git.
- `src/functions/fetch.ts` reads it via `import.meta.env.CMS_API_URL` and falls back to `http://localhost:3000/` if unset.
- **This is a build-time value, not a runtime one.** Because this project builds to static output (no server adapter configured in `astro.config.mjs`), every page's CMS calls happen once, while running `npm run build`. The resulting HTML in `dist/` is baked with whatever `CMS_API_URL` pointed to at build time. Changing the env var on a server afterwards does nothing — you must edit `.env` and rebuild/redeploy to point at a different CMS instance.
- Don't name a custom env var `BASE_URL` — Vite/Astro reserve that name for their own `base` config and will silently override it with `"/"`. Same applies to `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`.

## How the site talks to the CMS (REST)

All CMS access goes through [src/functions/fetch.ts](src/functions/fetch.ts):

| Function | Method | Use |
| :------- | :----- | :-- |
| `fetchData(suffix)` | GET | Load page sections, blog posts, global content |
| `sendData(suffix, data)` | POST | Submit forms (e.g. lead capture) |
| `updateData(suffix, data)` | PUT | Update existing records |
| `mediaUrl(path)` | — | Resolve a CMS-relative media path (`storage/...`) to an absolute URL, or pass through if already absolute |

Pages and layouts call `fetchData("pages/<slug>")` in their frontmatter, which returns `{ status, data: { sections: [...] } }`. Each section has a `type` (e.g. `page_hero`, `rich_text`, `feature_grid`) and a `content` object; [SectionRenderer.astro](src/components/SectionRenderer.astro) maps `type` to the matching component under `src/components/sections/`. [Layout.astro](src/layouts/Layout.astro) additionally fetches the `inicio` page once per request to populate footer contact info, social icons, and the WhatsApp button that appear on every page.

To add a new CMS-driven block: add a case in `SectionRenderer.astro`, create a matching component in `src/components/sections/`, and have the CMS emit a section with that `type`.

## 🧞 Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Fetch content from the CMS and build static output to `./dist/` |
| `npm run preview` | Serve the built `./dist/` locally, exactly as it will be deployed |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro check` |

## Development

1. `npm install`
2. Create `.env` with `CMS_API_URL` pointing at a reachable CMS (local or remote).
3. `npm run dev` — the dev server re-fetches CMS content on each request, so CMS edits show up on refresh without restarting.

If asked to start the dev server for an automated/background task, use `astro dev --background`, and manage it with `astro dev status`, `astro dev logs`, `astro dev stop`.

## Building for production

```sh
npm run build
```

This produces a fully static site in `dist/` — plain HTML, CSS, and JS with no server runtime required. Verify it locally before deploying:

```sh
npm run preview
```

Since content is fetched at build time, **any CMS content change requires a new build** to appear on the live site (rebuild + redeploy, or wire up a CI job/webhook from the CMS that triggers a rebuild).

## Deployment

`dist/` is a static bundle, so it can be hosted anywhere that serves static files — a serverless/static host, a CDN, or a plain VPS.

### Serverless / static hosting (Vercel, Netlify, Cloudflare Pages, Azure Static Web Apps)

1. Set `CMS_API_URL` as a build-time environment variable in the platform's project settings.
2. Build command: `npm run build`; output directory: `dist`.
3. The platform serves `dist/` on every deploy. Trigger a new deploy whenever CMS content changes.

Azure specifics: create an **Azure Static Web Apps** resource, point it at this repo/branch, set the app location to `/`, output location to `dist`, and add `CMS_API_URL` under the resource's Configuration → Environment variables (used at build time by the Static Web Apps build pipeline).

### VPS (e.g. DigitalOcean droplet)

1. On the server, install Node (`>=22.12.0`, per `package.json` engines) or build the site elsewhere and only ship `dist/`.
2. Set `.env` with the correct `CMS_API_URL` and run `npm ci && npm run build`.
3. Serve the `dist/` folder with any static file server. Nginx example:

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

4. Reload nginx (`sudo nginx -t && sudo systemctl reload nginx`), then point DNS at the droplet.
5. To redeploy after CMS content changes: pull latest code (if any), rebuild, and `rsync`/copy the new `dist/` over the old one — no server restart needed since it's static files.

A minimal alternative to nginx on a VPS is any static file server (`npx serve dist`, `caddy file-server`, etc.) behind a reverse proxy or directly on port 80/443 with TLS.

## Notes & gotchas

- **Static output, build-time data**: there's no SSR adapter configured, so every CMS fetch in page/layout frontmatter runs once at `astro build`, not per-request in production. Don't expect runtime env var changes to take effect without a rebuild.
- **Reserved env var names**: never use `BASE_URL` (or `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) for a custom `.env` value — Astro/Vite own those and will silently resolve them to their own defaults instead of erroring.
- **No shared logic in `.astro` files**: keep reusable, non-UI functions (API clients, formatters, etc.) in `.ts` files under `src/functions/`. Astro's compiler scopes top-level `const`/`let` in a component's frontmatter differently from `export function` in the same frontmatter, which can cause a plain constant to be `undefined` inside an exported function at runtime.
- **Media URLs**: CMS-relative media paths (anything not already `http(s)://`) are resolved through `mediaUrl()` against the CMS's own origin, under `/storage/<path>` — don't hardcode the CMS host elsewhere.

