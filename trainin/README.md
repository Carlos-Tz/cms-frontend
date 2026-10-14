# Traninn Logistic — Public site

Astro static site for Traninn Logistic (GNC transport, logistics and heavy cargo). Content (page sections, menu, blog posts, contact info, social links, WhatsApp button, stations) is authored in the headless CMS through [`gnu-cms-admin`](../gnu-cms-admin/README.md) and pulled in over REST **at build time**, then rendered to plain HTML/CSS/JS.

In the CMS this site's slug is **`traninn-logistic`** (double "n", single "i" — not `trainin`). In the admin its route prefix is `trainin`.

> This site does **not** use `landing-gnu`'s `CmsPage` / `SectionRenderer` / `src/lib/cms.ts` setup. It has its own, simpler equivalent (`PageSections.astro` + plain fetch helpers), described below.

## Project Structure

```text
/
├── public/                          # Static assets copied as-is (logo.png, favicons, custom cursors)
├── assets/images/noimg.jpg          # Only used by the unused Servicios.astro (see Notes)
├── src/
│   ├── components/
│   │   ├── PageSections.astro       # Maps each CMS section "type" to a component, in API order
│   │   ├── Hero.astro               # banner_carousel
│   │   ├── PageHero.astro           # page_hero (also used directly by /blog)
│   │   ├── Simulador.astro          # savings_simulator (live price fetch in the browser)
│   │   ├── RichText.astro           # rich_text
│   │   ├── FeatureGrid.astro        # feature_grid
│   │   ├── ImageGallery.astro       # image_gallery
│   │   ├── StationsMap.astro        # stations_map (Leaflet + OpenStreetMap, pins from GET stations)
│   │   ├── Clientes.astro           # clients_showcase
│   │   ├── Contacto.astro           # lead_capture_form (POSTs leads from the browser)
│   │   ├── Marquee.astro            # Keyword band under the home banner, built from the menu
│   │   ├── ChildPageCards.astro     # Child-page cards on hub pages, built from the menu
│   │   ├── Header.astro, Footer.astro, Logo.astro, WhatsAppButton.astro
│   │   └── Servicios.astro, Ubicaciones.astro   # Unused leftovers (see Notes)
│   ├── functions/
│   │   ├── fetch.ts                 # Low-level REST client (fetchData/sendData/updateData, mediaUrl)
│   │   ├── blog.ts                  # fetchBlogPosts (follows pagination), formatPublishedAt
│   │   └── globals.ts               # fetchGlobals, whatsappHref
│   ├── layouts/Layout.astro         # Shared shell: fonts, header, footer, WhatsApp button, scroll reveal
│   ├── pages/                       # File-based routing — each .astro file here is a route
│   │   ├── index.astro              # pages/inicio
│   │   ├── nuestros-servicios/      # index + transporte-de-gnc, logistica, carga-pesada
│   │   ├── sobre-nosotros/          # index + nuestra-historia, proposito-empresarial, que-hacemos
│   │   ├── ubicaciones/             # single page
│   │   ├── blog/                    # index, [slug]
│   │   ├── contacto/
│   │   ├── nosotros/, servicios/    # Placeholder stubs, not CMS pages (see Notes)
│   ├── styles/                      # tokens.css (design tokens), motion.css (scroll-reveal animations)
│   └── types/globals.ts
├── trainin-docs/                    # Implementation notes (Spanish) + the Loginet/O-Tech reference templates
├── response.json                    # Sample GET pages/inicio response, for reference
├── astro.config.mjs                 # Default config, no integrations or adapter
├── .env                             # CMS_API_URL (gitignored)
└── package.json
```

## Environment configuration

The site reads the CMS base URL from a single env var:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/traninn-logistic/
```

- Create `.env` in the project root before running dev or build. It is gitignored.
- `src/functions/fetch.ts` reads it via `import.meta.env.CMS_API_URL` and falls back to `http://localhost:3000/` if unset. Keep the trailing slash: paths like `pages/inicio` are appended directly.
- **This is a build-time value**, and it's also baked into the browser scripts of the lead form and the savings simulator (via `define:vars`). To point at a different CMS, edit `.env` and rebuild.
- Don't name a custom env var `BASE_URL`. Vite/Astro reserve that name and silently override it with `"/"`. The same applies to `MODE`, `DEV`, `PROD`, `SSR`, `SITE` and `ASSETS_PREFIX`. (`fetch.ts` *exports* a constant called `BASE_URL`; that's a plain JS name, not an env var, so it's fine.)

## How the site talks to the CMS

All calls go through [src/functions/fetch.ts](src/functions/fetch.ts). There is no typed wrapper layer and **no memoization**: every component that needs data calls `fetchData` itself.

| Who | Endpoint | Use |
| :-- | :------- | :-- |
| Each page in `src/pages/` | `GET pages/{slug}` | The page's `sections[]`, passed to `<PageSections>` |
| `Layout.astro` | `GET menu`, `GET globals` | Header/footer nav; contact info, social links, WhatsApp button |
| `ChildPageCards.astro` | `GET menu` | Cards for the children of the menu branch matching the current URL |
| `Marquee.astro` | `GET menu` | Words = titles of the first menu branch that has children (the services) |
| `StationsMap.astro` | `GET stations` | Station pins and list |
| `Contacto.astro` | `GET globals` | WhatsApp CTA next to the form |
| `blog/index.astro`, `blog/[slug].astro` | `GET blog?page=N`, `GET blog/{slug}` | Listing (all pages followed) and one route per post |
| Browser — `Contacto.astro` | `POST leads` | Lead submission, tagged with `source` = the page slug |
| Browser — `Simulador.astro` | `GET savings-simulator?…` | Current fuel prices when a visitor calculates |

`mediaUrl(path)` resolves CMS-relative media paths against the CMS origin under `/storage/<path>`; absolute URLs pass through untouched.

Every route is a ~20-line file: fetch `pages/{slug}`, wrap `<PageSections sections={…} slug={…} />` in `<Layout>`. [PageSections.astro](src/components/PageSections.astro) renders sections in the order the API returns them and supports:

`banner_carousel`, `page_hero`, `savings_simulator`, `rich_text`, `feature_grid`, `image_gallery`, `stations_map`, `clients_showcase`, `lead_capture_form`.

Unknown types (including `testimonials`, which this site doesn't render) are skipped, so seeding a new section type never breaks the build. Sections with empty content (no slides, no items, no logos) render nothing. To add a new CMS-driven block:

1. Create a component in `src/components/`.
2. Add a `case` for its `type` in `PageSections.astro`.
3. Have the CMS emit sections of that `type`.

To add a new CMS page, copy any existing route file and change the slug in `fetchData("pages/…")`. The file's location must match the page's CMS `path` (e.g. `transporte-de-gnc` lives at `/nuestros-servicios/transporte-de-gnc`), since that's where the CMS menu links.

## Frontend-side overrides

Some display decisions live in this repo instead of the CMS. When something on the site doesn't match the admin, check here first.

| What | Where |
| :--- | :---- |
| "Blog" nav item (the CMS menu doesn't list it) | Appended in `src/components/Header.astro` |
| Fallback nav (Inicio, Nuestros servicios, Sobre nosotros, Ubicaciones) if `GET menu` fails | `src/components/Header.astro` |
| Fallback social links (`#`) if the CMS has none; only facebook/instagram/linkedin have icons | `src/layouts/Layout.astro` |
| Marquee band shown only under a `banner_carousel` that is the page's **first** section | `src/components/PageSections.astro` |
| Later `banner_carousel`s render in compact mode | `src/components/PageSections.astro` |
| Alternating plain/tinted section bands (banners/heroes excluded) | `src/components/PageSections.astro` |
| Hub card titles: "Nuestros servicios", "Conoce Traninn Logistic" | `src/pages/nuestros-servicios/index.astro`, `src/pages/sobre-nosotros/index.astro` |
| Hub card icons, chosen by keywords in the child's slug | `src/components/ChildPageCards.astro` |
| Default `<title>`/description (home page) | `src/layouts/Layout.astro` |
| Blog page heading ("Blog") | `src/pages/blog/index.astro` |

Recommended image sizes and text lengths for each section are in [`../DOCUMENTACION-CONTENIDO-TRAININ.txt`](../DOCUMENTACION-CONTENIDO-TRAININ.txt).

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
2. Create `.env` with `CMS_API_URL` pointing at a reachable CMS (local or remote).
3. `npm run dev`

Because nothing is memoized, the dev server re-fetches on every page load, so CMS edits show up on refresh without a restart (unlike `landing-gnu`).

When starting the dev server for an automated/background task, use `astro dev --background`, and manage it with `astro dev status`, `astro dev logs` and `astro dev stop`.

To check a production build without touching `dist/`, build to a temporary folder: `npx astro build --outDir <temp-dir>`.

## Building for production

```sh
npm run build
npm run preview   # verify locally before deploying
```

This produces a fully static site in `dist/`, with no server runtime required. Content is fetched at build time, so **any CMS content change needs a new build and deploy** to appear on the live site. A failed fetch is logged and the page renders empty rather than failing the build, so check the build output for `Error fetching data` before deploying.

## Deployment

`dist/` is a static bundle, so it can be hosted anywhere that serves static files. Two things apply to every target:

- **Folder URLs**: each page is built as a folder with an `index.html` (e.g. `/sobre-nosotros/que-hacemos/` is `dist/sobre-nosotros/que-hacemos/index.html`). The host must serve `index.html` for a folder URL, not only at the root.
- **Cache headers**: HTML should be revalidated on every visit (`Cache-Control: no-cache`). Files under `/_astro/` have content hashes in their names and can be cached for a year (`public, max-age=31536000, immutable`).

### VPS with nginx

```nginx
server {
    listen 80;
    server_name <your-domain>;

    root /var/www/trainin/dist;
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

Reload with `sudo nginx -t && sudo systemctl reload nginx`. To redeploy, rebuild and copy the new `dist/` over the old one.

### Other hosts

For AWS S3 (+ CloudFront), Azure Storage / Static Web Apps, and Vercel/Netlify/Cloudflare Pages, follow [`../landing-gnu/README.md#deployment`](../landing-gnu/README.md#deployment) — the recipes are identical, with this site's domain and `CMS_API_URL`.

### Rebuilding from the admin

Editors can rebuild this site with the **Reconstruir sitio** button on the Traninn page list in `gnu-cms-admin`. It calls [`../build-server`](../build-server/README.md) with site `trainin`, which runs `npm run build` in `VITE_TRANINN_CODE_PATH` and replaces the contents of `VITE_TRANINN_PUBLIC_PATH` with `dist/`. Both paths go in `build-server/.env`; if they're unset the rebuild fails with a clear error.

## Notes & gotchas

- **Static output, build-time data**: every CMS fetch (except the lead form and simulator) runs once at `astro build`, not per request in production.
- **No memoization**: `GET menu` is requested by `Layout`, `ChildPageCards` and `Marquee`, and `GET globals` by `Layout` and `Contacto`, on every page. A build therefore makes several requests per page. Fine at this site's size, but worth caching (like `landing-gnu/src/lib/cms.ts`) if the page count grows.
- **Stub routes**: `src/pages/nosotros/index.astro` and `src/pages/servicios/index.astro` contain only placeholder text ("sobre nosotros", "serv") with no layout. Nothing links to them, but they're still built and published at `/nosotros/` and `/servicios/`. The real pages are `/sobre-nosotros/` and `/nuestros-servicios/`.
- **Unused components**: `Servicios.astro` and `Ubicaciones.astro` aren't imported anywhere. `Servicios.astro` is the only user of `assets/images/noimg.jpg`.
- **No blog in the menu**: the CMS menu doesn't include the blog, so `Header.astro` appends it. Blog posts have no CMS `pages/` entry.
- **Unhandled section types**: `testimonials` (from `globals`) isn't rendered anywhere on this site.
- **No shared logic in `.astro` files**: keep reusable, non-UI functions in `.ts` files under `src/functions/`.
- **Media URLs**: always go through `mediaUrl()`. Don't hardcode the CMS host elsewhere.
- **External assets**: Google Fonts (Noto Sans, Outfit), Font Awesome 6.7.2 from cdnjs, and Leaflet 1.9.4 from unpkg (map page only) load at runtime.
- **`dist/` is tracked in git** (it isn't in `.gitignore`), so a local build changes tracked files. Build to a temp folder when you're only checking the output.
- **Background on implementation decisions**: see `trainin-docs/Frontend Astro - consumo del CMS.md`.
