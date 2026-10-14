# GNU Gas Natural Vehicular — Site

Astro static site for GNU Gas Natural Vehicular (GNV conversions, stations, verification appointments). Content (page sections, menu, blog posts, contact info, social links, stations) is authored in the headless CMS through [`gnu-cms-admin`](../gnu-cms-admin/README.md) and pulled in over REST **at build time**, then rendered to plain HTML/CSS/JS.

In the admin this site lives under the **`gas-natural`** route; in the CMS API its slug is **`gnu-vehicular`**. It follows the same architecture as [`landing-gnu`](../landing-gnu/README.md), the reference implementation.

## Project Structure

```text
/
├── public/                         # Static assets copied as-is (favicons, logo, cursor pointer)
├── src/
│   ├── assets/images/noimg.jpg     # Placeholder for cards/posts without an image
│   ├── components/
│   │   ├── CmsPage.astro           # Renders a CMS page (GET pages/{slug}) in its section order
│   │   ├── SectionRenderer.astro   # Maps a CMS section "type" to its component in sections/
│   │   ├── sections/               # One component per CMS section type, plus home-only blocks
│   │   ├── ChildPageCards.astro    # Hub cards built from the menu + each child's page_hero
│   │   ├── BlogIndex.astro         # Blog listing (used by /blog and /blog/pagina/[page])
│   │   └── nav/                    # NavItem / NavItemMobile (desktop + mobile menu)
│   ├── config/seo.ts               # Site-wide SEO defaults (site name, domain, locale)
│   ├── functions/fetch.ts          # Low-level REST client (fetchData/sendData/updateData, mediaUrl, BASE_URL)
│   ├── lib/cms.ts                  # Typed, memoized CMS access (getPage, getMenu, getGlobals, childrenOf, …)
│   ├── layouts/Layout.astro        # Shared shell: header, nav, footer, WhatsApp + floating simulator, SEO tags
│   ├── pages/                      # File-based routing — each .astro file here is a route
│   │   ├── index.astro             # Home: curated order, not the raw CMS section list
│   │   ├── nuestros-servicios/     # + flotillas-empresariales, estaciones-moviles,
│   │   │                           #   instala-tu-equipo-de-gnv (+ cotiza-tu-equipo, financiamiento)
│   │   ├── ubicaciones/            # + estaciones-morelia, estacion-uruapan, agenda-tu-verificacion, talleres
│   │   ├── blog/                   # index, [slug], pagina/[page]
│   │   └── contacto/
│   ├── styles/                     # global.css, tokens.css (design tokens)
│   └── types/                      # globals.ts, menu.ts
├── gnu-vehicular-docs/             # Backend/admin docs per CMS area (Portada, Contacto, Ubicaciones, Servicios, Blog)
├── manual/                         # Brand identity manual images (gitignored)
├── GUIDELINES.md                   # Shared design language (same copy in every frontend project)
├── astro.config.mjs                # Default config, no adapter → static output
├── .env                            # CMS_API_URL (not committed)
└── package.json
```

Reusable, non-component logic must live in a plain `.ts` file, not a `.astro` file. See [Notes & gotchas](#notes--gotchas).

## Environment configuration

The site reads the CMS base URL from a single env var:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/gnu-vehicular/
```

- Create `.env` in the project root before running dev or build. It is **not** committed to git.
- `src/functions/fetch.ts` reads it via `import.meta.env.CMS_API_URL` and falls back to `http://localhost:3000/` if unset. Keep the trailing slash: endpoints are appended directly (`BASE_URL + "menu"`).
- **This is a build-time value.** The site builds to static output, so every build-time CMS call happens during `npm run build`. The same URL is also baked into the browser scripts that call the API live (see below), so pointing at a different CMS means editing `.env` and rebuilding.
- Don't name a custom env var `BASE_URL`. Vite/Astro reserve that name and silently override it with `"/"`. The same applies to `MODE`, `DEV`, `PROD`, `SSR`, `SITE` and `ASSETS_PREFIX`. (`BASE_URL` in `fetch.ts` is just an exported constant, not an env var.)

## How the site talks to the CMS

Pages and components read the CMS through [src/lib/cms.ts](src/lib/cms.ts), which wraps the low-level client in [src/functions/fetch.ts](src/functions/fetch.ts):

| Function | Endpoint | Use |
| :------- | :------- | :-- |
| `getPage(slug)` | `GET pages/{slug}` | A page's sections (`{ type, content }[]`) |
| `getMenu()` | `GET menu` | Nav tree, footer "Servicios" links, header CTA targets |
| `getGlobals()` | `GET globals` | Footer contact info, social links, WhatsApp button, Organization JSON-LD |
| `getBlogList(page)`, `getAllBlogPosts()`, `getBlogPost(slug)` | `GET blog…` | Blog listing and posts |
| `childrenOf(slug)`, `findMenuItem(slug)` | (from `menu`) | A hub's published child pages, used for hub cards |
| `sectionOf(page, type)`, `heroOf(page)` | — | Pick a section out of a loaded page |
| `whatsappHref(globals)` | — | `wa.me` link from `whatsapp_button`, or `null` when there's no number |

Responses from `cms.ts` are memoized per endpoint, so a full build makes one request per endpoint no matter how many pages use it. Exception: `StationsMap` and `ServiceScheduling` call `fetchData("stations")` directly, so `GET stations` is not memoized.

Most routes are a single `<CmsPage slug="…" fallbackTitle="…" />`. `CmsPage` uses the page's `page_hero` as its SEO summary (subtitle → meta description, image → social preview) and renders anything passed as children after the sections. [SectionRenderer.astro](src/components/SectionRenderer.astro) maps each section `type` to its component:

| Section `type` | Component |
| :------------- | :-------- |
| `page_hero` | `PageHero` |
| `banner_carousel` | `HeroCarousel` |
| `rich_text` | `RichText` |
| `feature_grid` | `FeatureGrid` |
| `lead_capture_form` | `LeadCaptureForm` (with `source` = page slug) |
| `stations_map` | `StationsMap` |
| `clients_showcase` | `ClientsShowcase` |
| `service_scheduling` | `ServiceScheduling` |
| `savings_simulator` | `SavingsSimulator` (priced against the page slug) |
| `image_gallery` | `ImageGallery` |
| `testimonials` | `Testimonials` |
| `contact_info` | `ContactInfo` |

Unknown types render nothing. `social_icons` and `whatsapp_button` are site-wide and rendered by the layout from `globals`. To add a new CMS-driven block:

1. Create a component in `src/components/sections/`.
2. Add a case for its `type` in `SectionRenderer.astro`.
3. Have the CMS emit sections of that `type`.

### Live calls from the browser

Three components call the public API from the visitor's browser, using the `CMS_API_URL` baked in at build time:

| Component | Endpoint | When |
| :-------- | :------- | :--- |
| `LeadCaptureForm` | `POST leads` | Form submit. Sends `name`/`email`/`phone`/`message` plus `source` (page slug); any other field goes under `details`. |
| `SavingsSimulator` | `GET savings-simulator?fuel=&quantity=&page=` | When a visitor calculates, so prices are current rather than build-time. |
| `ServiceScheduling` | `GET appointments/availability?station=&date=`, `POST appointments` | Booking a verification on `/ubicaciones/agenda-tu-verificacion`. The station list itself is fetched at build time from `GET stations`. |

## Frontend-side overrides

Some display decisions live in this repo instead of the CMS. When something on the site doesn't match the admin, check here first.

| What | Where |
| :--- | :---- |
| Home page block order and layout (reads sections by type from `pages/inicio`) | `src/pages/index.astro` |
| Home "hero stats" (+5,000 equipos instalados, 60% ahorro promedio, 24/7) | Hardcoded in `src/pages/index.astro` |
| Home "Programa de recompensas" reuses the page's `feature_grid` section | `src/pages/index.astro` |
| Home contact block heading/text ("Hablemos de tu conversión a GNV") | Hardcoded in `src/pages/index.astro`; only the form fields/title/intro come from `lead_capture_form` |
| Contacto: the `lead_capture_form` is pulled out and shown next to `globals.contact_info`; form title is fixed to "Cotiza sin compromiso" | `src/pages/contacto/index.astro` |
| Floating "Calcula tu ahorro" panel on every page uses the **home page's** `savings_simulator` section | `src/layouts/Layout.astro` |
| Header CTAs (agenda, cotiza, ubicaciones) resolve to the menu entries `agenda-tu-verificacion`, `cotiza-tu-equipo`, `ubicaciones` | `src/layouts/Layout.astro` |
| Hub section titles ("Explora …" blocks) on nuestros-servicios, instala-tu-equipo-de-gnv, ubicaciones | The hub's own `src/pages/**/index.astro` |
| Site name, default title/description, production domain, locale | `src/config/seo.ts` |

### Offline fallbacks

When the CMS is unreachable at build time the site still builds, using hardcoded fallbacks: a fixed top-level menu and footer service links (`Layout.astro`), a fallback hero per page (`fallbackTitle`/`fallbackSubtitle` on `CmsPage`), fixed child lists for each hub, and on the home page placeholder services, rewards benefits, testimonials and location cards. A build that ran without the CMS will therefore look populated but show placeholder content — check the build log for `Error fetching data` before deploying.

## 🧞 Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Fetch content from the CMS and build static output to `./dist/` |
| `npm run preview` | Serve the built `./dist/` locally, exactly as it will be deployed |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro check` |

## Development

1. `npm install` (Node `>=22.12.0`)
2. Create `.env` with `CMS_API_URL` pointing at a reachable CMS (local or remote), ending in `/api/public/gnu-vehicular/`.
3. `npm run dev`

**Restart the dev server to see CMS edits.** The memo cache in `src/lib/cms.ts` lives as long as the dev server process, so pages keep showing the content fetched on the first request until you restart. Frontend code changes still hot-reload.

To check a production build without touching `dist/`, build to a temporary folder: `npx astro build --outDir <temp-dir>`.

When starting the dev server for an automated/background task, use `astro dev --background`, and manage it with `astro dev status`, `astro dev logs` and `astro dev stop`.

## Building for production

```sh
npm run build
npm run preview   # verify locally before deploying
```

This produces a fully static site in `dist/`, with no server runtime required. Content is fetched at build time, so **any CMS content change needs a new build and deploy** to appear on the live site.

Before the first production deploy, confirm `siteUrl` in `src/config/seo.ts` is the real domain: canonical links, `og:url` and blog JSON-LD are built from it.

## Deployment

`dist/` is a static bundle and deploys exactly like `landing-gnu`. Two things apply to every target:

- **Folder URLs**: each page is built as a folder with an `index.html` (e.g. `/ubicaciones/talleres/` is `dist/ubicaciones/talleres/index.html`). The host must serve `index.html` for a folder URL, not only at the root.
- **Cache headers**: HTML should be revalidated on every visit (`Cache-Control: no-cache`) so visitors get new builds right away. Files under `/_astro/` have content hashes in their names and can be cached for a year (`public, max-age=31536000, immutable`).

### VPS with nginx

```nginx
server {
    listen 80;
    server_name example.com www.example.com;   # this site's domain

    root /var/www/gas-gnu;                      # the folder that receives dist/
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
        add_header Cache-Control "no-cache";
    }

    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Reload with `sudo nginx -t && sudo systemctl reload nginx`. To redeploy, rebuild and copy the new `dist/` over the old one; no restart is needed.

For AWS S3 + CloudFront, Azure (Blob static website or Static Web Apps) and Vercel/Netlify/Cloudflare Pages, follow [`landing-gnu/README.md#deployment`](../landing-gnu/README.md#deployment), using this site's `CMS_API_URL` and domain.

### Rebuilding from the admin

Editors can rebuild this site with the **Reconstruir sitio** button on the `gas-natural` page list in `gnu-cms-admin`. It calls [`build-server`](../build-server/README.md) (site `gas-natural`), which runs `npm run build` in this project's `CODE_PATH` and replaces the served folder (`PUBLIC_PATH`) with `dist/`. This only works when the site is served from the machine running `build-server`; for other hosts, rebuild and deploy manually or via CI.

## Notes & gotchas

- **Static output, build-time data**: every CMS fetch in a page's frontmatter runs once at `astro build`, not per request in production. Env var changes on the server do nothing without a rebuild.
- **Reserved env var names**: never use `BASE_URL` (or `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) for a custom `.env` value.
- **No shared logic in `.astro` files**: keep reusable, non-UI functions in `.ts` files (`src/lib/`, `src/functions/`, `src/config/`). Astro scopes top-level `const`/`let` in a component's frontmatter differently from `export function` in the same frontmatter, so a plain constant can be `undefined` inside an exported function at runtime.
- **Media URLs**: CMS-relative media paths are resolved through `mediaUrl()` against the CMS origin under `/storage/<path>`. Don't hardcode the CMS host elsewhere.
- **Hub cards have no content of their own**: each card on a hub reuses its child page's `page_hero` (image + subtitle). Unpublishing a page in the admin drops it from the menu, and therefore from its hub, on the next build.
- **CORS**: the lead form, simulator and appointment booking call the CMS from the browser, so the CMS must allow this site's origin.
- **Content guide**: recommended image sizes and text lengths per section are in [`../DOCUMENTACION-CONTENIDO-GAS-GNU.txt`](../DOCUMENTACION-CONTENIDO-GAS-GNU.txt).
