# build-server

Tiny Node service (no dependencies) behind the admin's **"Reconstruir página"** button.

The Astro sites read the CMS only at build time, so content saved in `gnu-cms-admin` does not appear on a site until it is rebuilt. The admin is a browser app and cannot run `npm run build`, so it asks this service to do it.

```bash
cd build-server
cp .env.example .env   # adjust ALLOWED_ORIGINS / PUBLISH_ROOT for your server
npm start              # → http://localhost:4400
```

Then set `VITE_BUILD_SERVER_URL=http://localhost:4400` in `gnu-cms-admin/.env` (build-time var — rebuild the admin after changing it).

It must run on the machine that serves the sites. Server layout (`PUBLISH_ROOT=/var/www/html/sitios-cms`):

```
/var/www/html/sitios-cms/<folder>/
├── code/          ← Astro project, node_modules installed — the build runs here
├── _astro/        ┐
├── <routes>/      │ published build output (contents of code/dist/)
└── index.html     ┘
```

Without `PUBLISH_ROOT` (local dev) it builds the repo's projects under `SITES_ROOT` (default `..`) and publishes nothing.

## API

| Method | Path | Result |
| :-- | :-- | :-- |
| `GET` | `/builds/:site` | `{status, startedAt, finishedAt, error, log[]}` — `status` is `idle`, `running`, `success` or `error` |
| `POST` | `/builds/:site` | runs `npm run build` in `PUBLISH_ROOT/<folder>/code`, then replaces everything in `PUBLISH_ROOT/<folder>` except `code/` with `code/dist/`. `202`, or `409` if one is already running |

`:site` is the admin route prefix: `gnu`, `gas-natural`, `trainin`, `tectuus`.

Every request needs the admin's `Authorization: Bearer <jwt>`. The token is validated by forwarding it to `GET {CMS_BASE_URL}/api/admin/sections?site=<slug>`; anything but a 2xx is a `401`.

## Notes

- One build per site at a time; different sites can build in parallel.
- Status lives in memory and resets when the service restarts.
- A build fails if `dist/index.html` is missing or empty — `npm run build` itself exits 0 even when the CMS is unreachable.
- Publishing replaces the **contents** of the site folder, except `code/`, with the contents of `code/dist/` (no `dist/` folder is published). It only happens after the build succeeded and the `dist/index.html` check passed, so a failed build never touches the live site. A build whose `dist/` contains a `code/` route is refused rather than clobbering the project.
- Site folders under `PUBLISH_ROOT`:

  | `:site` | Repo project (= `code/`) | Server folder |
  | :-- | :-- | :-- |
  | `gnu` | `landing-gnu` | `gnu` |
  | `gas-natural` | `gas-gnu` | `gnu-gas-natural` |
  | `trainin` | `trainin` | `traninn-logistic` |
  | `tectuus` | `tectuus` | `tectuus` |

- The service user needs write access to the site folders (and to `code/` for `dist/` and `.astro/`).
- `code/` sits inside the web root, so it is publicly downloadable unless the web server blocks it (e.g. Nginx `location ~ ^/[^/]+/code/ { deny all; }`, or Apache `RedirectMatch 404 ^/[^/]+/code/`). That includes each project's `.env`.
