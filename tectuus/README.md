# Tectuus — Site

Astro static site for Tectuus, the industrial-equipment line of GNU Gas Natural (EDRM, compressors, valves). Content (page sections, menu, contact info, social links, WhatsApp button) and the **product catalog** (categories and products) are managed in the headless CMS through [gnu-cms-admin](../gnu-cms-admin/README.md), and pulled in over REST **at build time**, then rendered to plain HTML/CSS/JS.

Tectuus has **no blog**. In the admin and the CMS the site is addressed as `tectuus` everywhere (admin route prefix, CMS slug and `build-server` site name are all the same).

## Project Structure

```text
/
├── public/                         # Copied as-is: favicon.svg/.ico, placeholder-plate.svg (image fallback)
├── src/
│   ├── assets/images/              # Images processed by Astro's asset pipeline
│   ├── components/
│   │   ├── SectionRenderer.astro   # Maps a CMS section "type" to its component in sections/
│   │   ├── sections/               # One component per CMS section type
│   │   ├── ProductCatalog.astro    # Catalog grid + category chips + search, filtered in the browser
│   │   └── nav/                    # NavItem / NavItemMobile (dropdowns for menu children)
│   ├── config/seo.ts               # Site-wide SEO defaults (site name, default title/description, siteUrl)
│   ├── functions/
│   │   ├── fetch.ts                # Low-level REST client (fetchData/sendData/updateData, mediaUrl, FALLBACK_IMAGE)
│   │   └── catalog.ts              # Catalog access (fetchCategories, fetchAllProducts, fetchProduct, orderByPrefix, formatPrice)
│   ├── layouts/Layout.astro        # Shared shell: header, nav, footer, WhatsApp button, SEO tags
│   ├── pages/                      # File-based routing — each .astro file here is a route
│   │   ├── index.astro             # Inicio (CMS page `inicio`, with a curated offline fallback)
│   │   ├── sobre-nosotros/         # CMS page `sobre-nosotros`
│   │   ├── productos/              # index (CMS hero + catalog) and [slug] (one page per product)
│   │   └── contacto/               # CMS page `contacto`
│   ├── styles/                     # global.css, tokens.css (design tokens)
│   └── types/                      # page.ts, menu.ts, globals.ts, catalog.ts — API response shapes
├── tectuus-docs/                   # Functional docs for each page (Inicio, Quiénes somos, catálogo, leads)
├── GUIDELINES.md                   # Design language shared with the admin and the other sites
├── astro.config.mjs                # Default config (static output, no adapter)
├── .env                            # CMS_API_URL (not committed)
└── package.json
```

Reusable, non-component logic must live in a plain `.ts` file, not a `.astro` file. See [Notes & gotchas](#notes--gotchas).

## Environment configuration

The site reads the CMS base URL from a single env var:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/tectuus/
```

- Create `.env` in the project root before running dev or build. It is **not** committed to git.
- `src/functions/fetch.ts` reads it via `import.meta.env.CMS_API_URL` and falls back to `http://localhost:3000/` if unset. Keep the trailing slash: endpoints are appended directly (`BASE_URL + "pages/inicio"`).
- **This is a build-time value.** The site builds to static output (no server adapter), so every CMS call happens during `npm run build`, and the HTML in `dist/` keeps whatever `CMS_API_URL` pointed to then. To point at a different CMS, edit `.env` and rebuild. The one exception is the lead form, which POSTs to the same base URL from the visitor's browser.
- Don't name a custom env var `BASE_URL`. Vite/Astro reserve that name and silently override it with `"/"`. The same applies to `MODE`, `DEV`, `PROD`, `SSR`, `SITE` and `ASSETS_PREFIX`. (`fetch.ts` *exports* a constant called `BASE_URL`; that's a plain JS name, not an env var, and is fine.)

## How the site talks to the CMS

Pages call [src/functions/fetch.ts](src/functions/fetch.ts) and [src/functions/catalog.ts](src/functions/catalog.ts) directly; there is no memoizing wrapper like `landing-gnu`'s `src/lib/cms.ts`.

| Function | Endpoint | Use |
| :------- | :------- | :-- |
| `fetchData("pages/{slug}")` | `GET pages/{slug}` | A page's sections (`{ type, content }[]`), rendered in API order by `SectionRenderer` |
| `fetchData("menu")` | `GET menu` | Nav tree (in `Layout.astro`) |
| `fetchData("globals")` | `GET globals` | Footer contact info, social links, WhatsApp button (in `Layout.astro`) |
| `fetchCategories()` | `GET product-categories` | Catalog filter chips and the Productos submenu |
| `fetchAllProducts()` | `GET products?page=N` | Every active product, walking all pages (12 per page, capped at 25 pages) |
| `fetchProduct(slug)` | `GET products/{slug}` | A product's full detail (description, all images); 404s for inactive products |
| `sendData("leads", …)` | `POST leads` | Lead form submission, sent **from the browser** at runtime |

All requests return the envelope `{ status, data, meta }`. A failed request is logged and returns `undefined`, and every page has a fallback for that case (see below). `mediaUrl(path)` resolves CMS-relative media paths to `<CMS origin>/storage/<path>`; absolute and root-relative paths pass through unchanged.

### Section types

[SectionRenderer.astro](src/components/SectionRenderer.astro) maps each section `type` to a component. Unknown types are skipped, so a new CMS section type never breaks a page.

| `type` | Component | Rendered only if |
| :-- | :-- | :-- |
| `banner_carousel` | `BannerCarousel` | it has slides. Only a carousel that is the page's first section gets the `<h1>` |
| `page_hero` | `PageHero` | it has a title |
| `rich_text` | `RichText` | always (title, HTML body, optional video) |
| `feature_grid` | `FeatureGrid` | it has items |
| `image_gallery` | `ImageGallery` | it has images |
| `clients_showcase` | `ClientsShowcase` | it has logos |
| `lead_capture_form` | `LeadCaptureForm` | always. Sits on the dark ("ink") band unless it's one of the first two sections |

To add a new CMS-driven block:

1. Create a component in `src/components/sections/`.
2. Add a case for its `type` in `SectionRenderer.astro`.
3. Have the CMS emit sections of that `type`.

### Lead forms

`LeadCaptureForm` posts to `POST leads` with the page slug as `source`, which is how the admin's Contacto inbox ("Origen" column) tells the homepage, `/contacto` and product-page forms apart. `source` must match a published page of the site or the API answers `422`. `name`, `email`, `phone` and `message` are columns of `leads`; any other field the CMS declares in the section's `fields[]` is sent inside `details`. The route is throttled (`429` after 10 requests per minute).

Product pages always use `source: "productos"`.

## Product catalog

The catalog is a data domain, not a set of page sections: categories and products are their own collections in the CMS, created and deleted in the admin's Tectuus → Productos screen.

- **`/productos`** renders the `productos` page's own sections (its hero) and then `ProductCatalog`, which receives **every** category and active product at build time. Category chips and the search box filter the cards **in the browser**, since a static page can't forward `?category=`/`?q=` to the API. This also makes the search accent-insensitive, which the API's plain `LIKE` search isn't (`medicion` finds `medición`).
- Filters are kept in the URL (`/productos?category=edrm`), so filtered views can be shared. The Productos submenu links to these URLs.
- Every category gets a chip, even one with no products yet, and selecting it shows an empty state.
- **`/productos/[slug]`** is generated by `getStaticPaths()` from `fetchAllProducts()`: one static page per **active** product. Each page then calls `fetchProduct(slug)` for the description and full image gallery, falling back to the listing data (first image, no description) if that call fails. Pages include a breadcrumb, a thumbnail gallery and a "Solicita una cotización" lead form.
- **Ordering**: the CMS has no sort field for categories or products, so editors order them with a numeric prefix on the name (`1 - EDRM`, `2 - Compresores`; `1 - EDRM-500`). The prefix only sets the order and is never shown on the site. Keep the `N - Name` format (number, dash).
  - **Categories** are sorted by the prefix in `fetchCategories()`, so the chips, shelves and Productos submenu all share one order. Categories without a prefix keep API order after the numbered ones.
  - **Products** are sorted within their category by `orderByPrefix()`, on the catalog shelves and on the product page (title, "Más de …" list). A category is only reordered when **every** product in it has a prefix and no two share a number. Otherwise the whole category keeps the server's order and names unchanged, prefixes included.
- **Prices**: `price` is a decimal string in MXN. `null` (or anything non-numeric) shows **"Precio a cotizar"**, which is normal for industrial equipment. Formatting is `es-MX` currency.
- **Adding, renaming, deactivating or deleting a product (or category) in the admin requires a rebuild**, like any other content change. Until then, a new product has no page, and a removed one still has its old page in `dist/`.

## Frontend-side overrides

Some display decisions live in this repo instead of the CMS. When something on the site doesn't match the admin, check here first.

| What | Where |
| :--- | :---- |
| Productos submenu built from the catalog categories (the CMS menu always returns Productos with no children) | `src/layouts/Layout.astro` |
| Category and product order taken from a `N - ` name prefix, which is then hidden (see [Product catalog](#product-catalog)) | `fetchCategories()` / `orderByPrefix()` in `src/functions/catalog.ts` |
| Fallback menu (Inicio, Sobre nosotros, Productos, Contacto) when `menu` is unreachable | `src/layouts/Layout.astro` |
| Fallback social links (`#`) when `globals` has none; only facebook, instagram, linkedin, youtube and twitter have icons, others are dropped | `src/layouts/Layout.astro` |
| Footer email fallback `contacto@tectuus.com`, footer tagline and copyright line | `src/layouts/Layout.astro` |
| WhatsApp button hidden entirely when no phone number comes from `globals` | `src/layouts/Layout.astro` |
| Homepage copy shown when `pages/inicio` is unreachable (carousel, clients, feature grid, form) | `src/pages/index.astro` |
| Hero (and, on Contacto, a form) shown when a page's CMS data is missing | `src/pages/{sobre-nosotros,productos,contacto}/index.astro` |
| Product page fallback description and quote-form copy | `src/pages/productos/[slug].astro` |
| Missing or broken CMS images replaced by `public/placeholder-plate.svg` | `FALLBACK_IMAGE` in `fetch.ts` + an inline `error` listener in `Layout.astro` |
| Site name, default title/description, canonical domain (`siteUrl`) | `src/config/seo.ts` |

## 🧞 Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Fetch content and the catalog from the CMS and build static output to `./dist/` |
| `npm run preview` | Serve the built `./dist/` locally, exactly as it will be deployed |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro check` |

## Development

1. `npm install`
2. Create `.env` with `CMS_API_URL` pointing at a reachable CMS (local or remote), ending in `/api/public/tectuus/`.
3. `npm run dev`

In dev, pages fetch from the CMS on every request (there's no memo cache), so CMS edits show up on reload.

To check a production build without touching `dist/`, build to a temporary folder: `npx astro build --outDir <temp-dir>`.

When starting the dev server for an automated/background task, use `astro dev --background`, and manage it with `astro dev status`, `astro dev logs` and `astro dev stop`.

## Building for production

```sh
npm run build
npm run preview   # verify locally before deploying
```

This produces a fully static site in `dist/`, with no server runtime required. Content and the catalog are fetched at build time, so **any CMS content change needs a new build and deploy** to appear on the live site.

## Deployment

`dist/` is a static bundle, so it can be hosted anywhere that serves static files. Two things apply to every target:

- **Folder URLs**: each page is built as a folder with an `index.html` (e.g. `/productos/<slug>/` is `dist/productos/<slug>/index.html`). The host must serve `index.html` for a folder URL, not only at the root.
- **Cache headers**: HTML should be revalidated on every visit (`Cache-Control: no-cache`) so visitors get new builds right away. Files under `/_astro/` have content hashes in their names and can be cached for a year (`public, max-age=31536000, immutable`).

For AWS S3 + CloudFront, Azure (Blob or Static Web Apps) and Vercel/Netlify/Cloudflare Pages, follow the recipes in [`../landing-gnu/README.md#deployment`](../landing-gnu/README.md#deployment), using this site's `CMS_API_URL` and domain.

### VPS with nginx

1. Install Node `>=22.12.0` (per `package.json` engines), or build elsewhere and ship only `dist/`.
2. Set `.env` with the correct `CMS_API_URL`, then run `npm ci && npm run build`.
3. Serve `dist/` with nginx (replace the domain and path with yours):

   ```nginx
   server {
       listen 80;
       server_name tectuus.example.com;

       root /var/www/tectuus/dist;
       index index.html;

       location / {
           try_files $uri $uri/ $uri.html =404;
           # Always revalidate HTML so visitors get new builds (cheap 304s via ETag).
           add_header Cache-Control "no-cache";
       }

       # Hashed build assets never change under the same name.
       location /_astro/ {
           add_header Cache-Control "public, max-age=31536000, immutable";
       }
   }
   ```

4. Reload nginx: `sudo nginx -t && sudo systemctl reload nginx`.
5. To redeploy, rebuild and copy the new `dist/` over the old one. No restart is needed.

### Rebuilding from the admin

Editors can rebuild the site themselves with the **Reconstruir sitio** button on the Tectuus page list in `gnu-cms-admin`. It calls [`../build-server`](../build-server/README.md) (site name `tectuus`), which runs `npm run build` in this project's `CODE_PATH` and replaces the served `PUBLIC_PATH` with the new `dist/`. This only works when the site is served from the machine running `build-server`; for other hosts, rebuild and deploy manually or from CI.

## Content guide

Recommended image sizes and text lengths per section, for editors: [`../DOCUMENTACION-CONTENIDO-TECTUUS.txt`](../DOCUMENTACION-CONTENIDO-TECTUUS.txt). Functional notes on each page (Inicio, Quiénes somos, catálogo, lead capture) are in [`tectuus-docs/`](./tectuus-docs/).

## Notes & gotchas

- **Static output, build-time data**: every CMS fetch (pages, menu, globals, catalog) runs at `astro build`, not per request in production. Env var changes on the server do nothing without a rebuild.
- **No request memoization**: `Layout.astro` fetches `menu`, `globals` and `product-categories` for every page it renders, so a build makes those requests once per page (including once per product page). Fine at the current catalog size; worth a cache like `landing-gnu`'s `src/lib/cms.ts` if the catalog grows.
- **A failed catalog request doesn't fail the build**: `fetchAllProducts()` returns whatever it collected so far, so an API outage during a build can publish a partial (or empty) catalog and drop product pages. Check the build log for `Error fetching data` before deploying.
- **Reserved env var names**: never use `BASE_URL` (or `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) for a custom `.env` value.
- **No shared logic in `.astro` files**: keep reusable, non-UI functions in `.ts` files (`src/functions/`, `src/config/`). Astro scopes top-level `const`/`let` in a component's frontmatter differently from `export function` in the same frontmatter, so a plain constant can be `undefined` inside an exported function at runtime.
- **Media URLs**: CMS-relative media paths go through `mediaUrl()`. Don't hardcode the CMS host elsewhere. Seeded `media/placeholder-*` paths 404 and are swapped for the placeholder plate in the browser.
- **Canonical URLs** are built from `seo.siteUrl` (`https://www.tectuus.mx`). Update it in `src/config/seo.ts` if the production domain is different.
- **`dist/` is tracked in git** (the `dist/` line in `.gitignore` is commented out). Build to a temp folder when you only want to check a build, so you don't churn tracked files.
