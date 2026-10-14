# GNU Gas Natural — Landing

Astro static site for GNU Gas Natural. Content (page sections, menu, blog posts, contact info, social links, stations, etc.) is authored in the headless CMS (gnu-cms-admin) and pulled in over REST **at build time**, then rendered to plain HTML/CSS/JS.

## Project Structure

```text
/
├── public/                         # Static assets copied as-is (favicon, cursor, images)
├── src/
│   ├── assets/images/              # Images processed by Astro's asset pipeline (logos, seals, badges)
│   ├── components/
│   │   ├── CmsPage.astro           # Renders a CMS page (GET pages/{slug}) in its section order
│   │   ├── SectionRenderer.astro   # Maps a CMS section "type" to its component in sections/
│   │   ├── sections/               # One component per CMS section type, plus home-only bands
│   │   ├── BalancedGrid.astro      # Card grid with balanced rows + equal-height panels
│   │   ├── CardBadge.astro         # Arrow badge on card panels
│   │   ├── ServiceCards.astro      # "Explora …" poster cards on /nuestros-servicios and /sobre-nosotros
│   │   ├── ChildPageCards.astro    # Child-page cards on /desarrollo-sostenible
│   │   ├── BlogIndex.astro         # Blog listing (used by /blog and /blog/pagina/[page])
│   │   ├── CertificacionesContent.astro  # Frontend-only content for /sobre-nosotros/certificaciones
│   │   └── Simulator*.astro        # Savings simulator form/result and the floating button
│   ├── config/
│   │   ├── labelOverrides.ts       # Nav/tab labels that differ from the CMS page title
│   │   ├── menuOrder.ts            # Display order of menu children, per parent slug
│   │   └── seo.ts                  # Site-wide SEO defaults
│   ├── functions/fetch.ts          # Low-level REST client (fetchData/sendData/updateData, mediaUrl)
│   ├── lib/
│   │   ├── cms.ts                  # Typed, memoized CMS access (getPage, getMenu, getGlobals, childrenOf, …)
│   │   ├── richText.ts             # Cleans up pasted rich text from the CMS
│   │   ├── media.ts, social.ts, clientLogos.ts
│   ├── layouts/Layout.astro        # Shared shell: header, nav, footer, floating buttons, SEO tags
│   ├── pages/                      # File-based routing — each .astro file here is a route
│   │   ├── index.astro             # Home: curated order, not the raw CMS section list
│   │   ├── nuestros-servicios/     # + gnv, gnc, gnd
│   │   ├── sobre-nosotros/         # + nuestra-historia, proposito-empresarial, valores, certificaciones
│   │   ├── desarrollo-sostenible/  # + ecovadis, iniciativas-rse, voluntariado, distintivo-esr
│   │   ├── blog/                   # index, [slug], pagina/[page]
│   │   └── contacto/
│   ├── styles/                     # global.css, tokens.css (design tokens)
│   └── types/globals.ts
├── certificaciones_images/         # Source images + CAMPOS-BACKEND.md (fields the CMS still needs)
├── NEW-FIELDS.md                   # Fields the frontend already renders but the CMS doesn't have yet
├── astro.config.mjs
├── .env                            # CMS_API_URL (not committed)
└── package.json
```

Reusable, non-component logic must live in a plain `.ts` file, not a `.astro` file. See [Notes & gotchas](#notes--gotchas).

## Environment configuration

The site reads the CMS base URL from a single env var:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/gnu/
```

- Create `.env` in the project root before running dev or build. It is **not** committed to git.
- `src/functions/fetch.ts` reads it via `import.meta.env.CMS_API_URL` and falls back to `http://localhost:3000/` if unset.
- **This is a build-time value.** The site builds to static output (no server adapter), so every CMS call happens during `npm run build`, and the HTML in `dist/` keeps whatever `CMS_API_URL` pointed to then. To point at a different CMS, edit `.env` and rebuild.
- Don't name a custom env var `BASE_URL`. Vite/Astro reserve that name and silently override it with `"/"`. The same applies to `MODE`, `DEV`, `PROD`, `SSR`, `SITE` and `ASSETS_PREFIX`.

## How the site talks to the CMS

Pages and components read the CMS through [src/lib/cms.ts](src/lib/cms.ts), which wraps the low-level client in [src/functions/fetch.ts](src/functions/fetch.ts):

| Function | Endpoint | Use |
| :------- | :------- | :-- |
| `getPage(slug)` | `GET pages/{slug}` | A page's sections (`{ type, content }[]`) |
| `getMenu()` | `GET menu` | Nav tree; children reordered per `config/menuOrder.ts` |
| `getGlobals()` | `GET globals` | Footer contact info, social links, WhatsApp button, testimonials |
| `getBlogList(page)`, `getAllBlogPosts()`, `getBlogPost(slug)` | `GET blog…` | Blog listing and posts |
| `childrenOf(slug)` | (from `menu`) | A hub's published child pages, used for hub cards |
| `sectionOf(page, type)`, `heroOf(page)` | — | Pick a section out of a loaded page |

Responses are memoized per endpoint, so a full build makes one request per endpoint no matter how many pages use it. `fetch.ts` also exposes `sendData`/`updateData` (POST/PUT, used by forms) and `mediaUrl(path)`, which resolves CMS media paths to absolute URLs.

Most routes are a single `<CmsPage slug="…" />`. [SectionRenderer.astro](src/components/SectionRenderer.astro) maps each section `type` to its component. To add a new CMS-driven block:

1. Create a component in `src/components/sections/`.
2. Add a case for its `type` in `SectionRenderer.astro`.
3. Have the CMS emit sections of that `type`.

The site also calls one endpoint live in the browser: the savings simulator fetches current prices from `GET savings-simulator?page=…` when a visitor calculates.

## Frontend-side overrides

Some display decisions live in this repo instead of the CMS. When something on the site doesn't match the admin, check here first.

| What | Where |
| :--- | :---- |
| Nav labels (e.g. Distintivo ESR → "Reconocimientos") | `src/config/labelOverrides.ts` |
| Menu child order for Sobre nosotros and Desarrollo sostenible | `src/config/menuOrder.ts` |
| Hide CMS sections on one page | `excludeTypes` on `<CmsPage>` (Propósito empresarial: `feature_grid`; GNC/GND: `savings_simulator`; Nuestros servicios: `clients_showcase`; Certificaciones: `feature_grid`) |
| Savings simulator shown only on GNV, borrowed from the GNC page in the CMS | `insertSection` in `src/pages/nuestros-servicios/gnv/index.astro` |
| Certificaciones page body (ISO 9001 block) | `src/components/CertificacionesContent.astro`, until the CMS fields in `certificaciones_images/CAMPOS-BACKEND.md` exist |
| Stations list shown in reverse of the API order | `src/components/sections/StationsMap.astro` |
| Hub section titles/subtitles ("Explora …" blocks) | The hub's own `src/pages/**/index.astro` |

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

## Deployment

`dist/` is a static bundle, so it can be hosted anywhere that serves static files. The site is deployed to AWS S3, Azure and a VPS with nginx; each is covered below.

Two things apply to every target:

- **Folder URLs**: each page is built as a folder with an `index.html` (e.g. `/sobre-nosotros/valores/` is `dist/sobre-nosotros/valores/index.html`). The host must serve `index.html` for a folder URL, not only at the root.
- **Cache headers**: HTML should be revalidated on every visit (`Cache-Control: no-cache`) so visitors get new builds right away. Files under `/_astro/` have content hashes in their names and can be cached for a year (`public, max-age=31536000, immutable`).

### AWS S3 (+ CloudFront)

1. **Build** locally or in CI with `CMS_API_URL` set: `npm ci && npm run build`.
2. **Upload** in two passes so each kind of file gets the right cache header, and `--delete` removes files from older builds:

   ```sh
   BUCKET=s3://your-bucket

   # Hashed assets: cache for a year.
   aws s3 sync dist/_astro "$BUCKET/_astro" --delete \
     --cache-control "public, max-age=31536000, immutable"

   # Everything else (HTML, public/ files): always revalidate.
   aws s3 sync dist "$BUCKET" --delete --exclude "_astro/*" \
     --cache-control "no-cache"
   ```

3. **Serve** it one of two ways:
   - **S3 static website hosting (no CloudFront)**: enable it on the bucket with index document `index.html` and error document `404.html` if you add one. The website endpoint resolves folder URLs on its own. It's HTTP only, and the bucket must allow public reads.
   - **CloudFront in front of a private bucket (recommended, HTTPS)**: use the bucket's REST endpoint as the origin with Origin Access Control, and set the default root object to `index.html`. The REST origin does **not** resolve folder URLs, so `/sobre-nosotros/` would return an error. Add this CloudFront Function on the *viewer request* event:

     ```js
     function handler(event) {
       var request = event.request;
       var uri = request.uri;
       if (uri.endsWith("/")) {
         request.uri += "index.html";
       } else if (!uri.split("/").pop().includes(".")) {
         request.uri += "/index.html";
       }
       return request;
     }
     ```

4. **After each deploy with CloudFront**, invalidate cached HTML so the edge serves the new build. `/_astro/*` files don't need it, since new builds use new file names:

   ```sh
   aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
   ```

### Azure

Two options:

**Azure Storage static website (Blob)**, the closest match to S3:

1. In the storage account, enable *Static website* with index document `index.html`. Azure creates a `$web` container, and the index document also applies to subfolders, so folder URLs work.
2. Upload in two passes, in this order. The first uploads everything with `no-cache`; the second re-uploads `_astro/` with the long cache header:

   ```sh
   ACCOUNT=yourstorageaccount

   az storage blob upload-batch --account-name "$ACCOUNT" -d '$web' -s dist \
     --overwrite --content-cache-control "no-cache"

   az storage blob upload-batch --account-name "$ACCOUNT" -d '$web' -s dist \
     --pattern "_astro/*" --overwrite \
     --content-cache-control "public, max-age=31536000, immutable"
   ```

   `upload-batch` doesn't delete files from older builds. Clear stale files with `az storage blob delete-batch` or `azcopy sync --delete-destination=true`.

3. For HTTPS on a custom domain, put **Azure Front Door** (or Azure CDN) in front, and purge it after each deploy.

**Azure Static Web Apps**, a managed build and hosting service:

1. Create the resource pointed at this repo/branch, with app location `/` and output location `dist`. Every push then builds and deploys automatically.
2. Add `CMS_API_URL` under *Configuration → Environment variables*. It's read at build time.
3. Folder URLs work out of the box. Set cache headers in a `staticwebapp.config.json` placed in `public/`, so it's copied into `dist/`:

   ```json
   {
     "globalHeaders": { "Cache-Control": "no-cache" },
     "routes": [
       {
         "route": "/_astro/*",
         "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
       }
     ]
   }
   ```

4. CMS content changes don't push to the repo, so trigger a redeploy from the Azure portal or a GitHub Actions `workflow_dispatch` after content edits.

### Other static hosts (Vercel, Netlify, Cloudflare Pages)

1. Set `CMS_API_URL` as a build-time environment variable in the platform's project settings.
2. Build command: `npm run build`; output directory: `dist`.
3. Trigger a new deploy whenever CMS content changes.

### VPS with nginx

1. Install Node `>=22.12.0` (per `package.json` engines), or build elsewhere and ship only `dist/`.
2. Set `.env` with the correct `CMS_API_URL`, then run `npm ci && npm run build`.
3. Serve `dist/` with nginx:

   ```nginx
   server {
       listen 80;
       server_name gnugas.mx www.gnugas.mx;

       root /var/www/landing-gnu/dist;
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

Without the `Cache-Control` header on HTML, browsers guess how long to keep pages and can show an older build after a deploy. The nginx server at `gnu.165.227.59.215.sslip.io` currently sends no such header.

## Notes & gotchas

- **Static output, build-time data**: every CMS fetch runs once at `astro build`, not per request in production. Env var changes on the server do nothing without a rebuild.
- **Reserved env var names**: never use `BASE_URL` (or `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) for a custom `.env` value.
- **No shared logic in `.astro` files**: keep reusable, non-UI functions in `.ts` files (`src/lib/`, `src/functions/`, `src/config/`). Astro scopes top-level `const`/`let` in a component's frontmatter differently from `export function` in the same frontmatter, so a plain constant can be `undefined` inside an exported function at runtime.
- **Media URLs**: CMS-relative media paths are resolved through `mediaUrl()` against the CMS origin under `/storage/<path>`. Don't hardcode the CMS host elsewhere.
- **Page heroes**: images are expected at 2048×768 and GIFs at 800×320. GIFs are shown whole (no crop, no zoom) over a blurred copy of themselves.
- **Missing CMS fields**: fields the frontend already supports but the CMS doesn't expose yet are listed in `NEW-FIELDS.md` and `certificaciones_images/CAMPOS-BACKEND.md`.
