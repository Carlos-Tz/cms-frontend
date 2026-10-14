# build-server

Tiny Node service (no dependencies) behind the admin's **"Reconstruir sitio"** button.

The Astro sites read the CMS only at build time, so content saved in `gnu-cms-admin` does not appear on a site until it is rebuilt. The admin is a browser app and cannot run `npm run build`, so it asks this service to do it.

```bash
cd build-server
cp .env.example .env   # fill in each site's CODE_PATH/PUBLIC_PATH, adjust ALLOWED_ORIGINS
npm start              # → http://localhost:4400
```

Then set `VITE_BUILD_SERVER_URL=http://localhost:4400` in `gnu-cms-admin/.env` (build-time var — rebuild the admin after changing it). Only that URL belongs in the admin's `.env`: it ships in the browser bundle, so real server filesystem paths never belong there — they stay here, in this service's own `.env`.

It must run on the machine that serves the sites. Per site, two independent directories (not nested — there is no shared parent folder):

```
<CODE_PATH>/            ← the Astro project, node_modules installed — the build runs here
├── src/
├── package.json
└── dist/                 ← produced by `npm run build`, then copied into PUBLIC_PATH

<PUBLIC_PATH>/           ← what the web server actually serves
├── _astro/              ┐
├── <routes>/             │ fully replaced with the contents of <CODE_PATH>/dist/
└── index.html            ┘
```

## API

| Method | Path | Result |
| :-- | :-- | :-- |
| `GET` | `/builds/:site` | `{status, startedAt, finishedAt, error, log[]}` — `status` is `idle`, `running`, `success` or `error` |
| `POST` | `/builds/:site` | runs `npm run build` in that site's `CODE_PATH`, then replaces the contents of its `PUBLIC_PATH` with `CODE_PATH/dist/`. `202`, or `409` if one is already running |

`:site` is the admin route prefix: `gnu`, `gas-natural`, `trainin`, `tectuus`.

Every request needs the admin's `Authorization: Bearer <jwt>`. The token is validated by forwarding it to `GET {CMS_BASE_URL}/api/admin/sections?site=<slug>`; anything but a 2xx is a `401`.

## Notes

- One build per site at a time; different sites can build in parallel.
- Status lives in memory and resets when the service restarts.
- A build fails if `dist/index.html` is missing or empty — `npm run build` itself exits 0 even when the CMS is unreachable.
- Publishing **fully replaces** the contents of `PUBLIC_PATH` with the contents of `CODE_PATH/dist/`. It only happens after the build succeeded and the `dist/index.html` check passed, so a failed build never touches the live site.
- **Safety guard:** a site whose `CODE_PATH`/`PUBLIC_PATH` is unset, blank, or resolves to the filesystem root (e.g. a literal `/`, which is what an unfilled `.env.example` entry looks like) is refused outright — the build fails closed with a clear error rather than risking `fs.rmSync` against something like `/`.
- Site → CMS slug (see DEVOPS.md §1 — the names do not match):

  | `:site` | CMS slug |
  | :-- | :-- |
  | `gnu` | `gnu` |
  | `gas-natural` | `gnu-vehicular` |
  | `trainin` | `traninn-logistic` |
  | `tectuus` | `tectuus` |

- The service user needs write access to each site's `CODE_PATH` (for `dist/` and `.astro/`) and `PUBLIC_PATH`.
- Make sure `CODE_PATH` is **not** under the web root (or is otherwise blocked from being served), since it contains the project's own `.env` and source.
