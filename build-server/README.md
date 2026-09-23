# build-server

Tiny Node service (no dependencies) behind the admin's **"Reconstruir página"** button.

The Astro sites read the CMS only at build time, so content saved in `gnu-cms-admin` does not appear on a site until it is rebuilt. The admin is a browser app and cannot run `npm run build`, so it asks this service to do it.

```bash
cd build-server
cp .env.example .env   # adjust ALLOWED_ORIGINS / DEPLOY_CMD_* for your server
npm start              # → http://localhost:4400
```

Then set `VITE_BUILD_SERVER_URL=http://localhost:4400` in `gnu-cms-admin/.env` (build-time var — rebuild the admin after changing it).

It must run on the machine that holds the site folders (`SITES_ROOT`) with their `node_modules` installed.

## API

| Method | Path | Result |
| :-- | :-- | :-- |
| `GET` | `/builds/:site` | `{status, startedAt, finishedAt, error, log[]}` — `status` is `idle`, `running`, `success` or `error` |
| `POST` | `/builds/:site` | starts `npm run build` in that site (then `DEPLOY_CMD_<SITE>` if set). `202`, or `409` if one is already running |

`:site` is the admin route prefix: `gnu`, `gas-natural`, `trainin`, `tectuus`.

Every request needs the admin's `Authorization: Bearer <jwt>`. The token is validated by forwarding it to `GET {CMS_BASE_URL}/api/admin/sections?site=<slug>`; anything but a 2xx is a `401`.

## Notes

- One build per site at a time; different sites can build in parallel.
- Status lives in memory and resets when the service restarts.
- A build fails if `dist/index.html` is missing or empty — `npm run build` itself exits 0 even when the CMS is unreachable.
- Without a `DEPLOY_CMD_*`, the service only regenerates `dist/`. That is enough when the web server serves the site's `dist/` folder directly; otherwise set the deploy command.
