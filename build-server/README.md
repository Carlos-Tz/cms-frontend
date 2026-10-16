# build-server

Tiny Node service (no dependencies) behind the admin's **"Reconstruir sitio"** button.

The Astro sites read the CMS only at build time, so content saved in `gnu-cms-admin` does not appear on a site until it is rebuilt. The admin is a browser app and cannot run `npm run build`, so it asks this service to do it.

```bash
cd build-server
cp .env.example .env   # fill in each site's CODE_PATH/PUBLIC_PATH, adjust ALLOWED_ORIGINS
npm start              # → http://localhost:4400
```

Then set `VITE_BUILD_SERVER_URL=http://localhost:4400` in `gnu-cms-admin/.env` for local development (build-time var — rebuild the admin after changing it; in production it must be a public HTTPS URL, see [Deployment](#deployment)). Only that URL belongs in the admin's `.env`: it ships in the browser bundle, so real server filesystem paths never belong there — they stay here, in this service's own `.env`.

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
| `GET` | `/builds/:site` | `{status, startedAt, finishedAt, step, error, log[]}` — `status` is `idle`, `running`, `success` or `error`. On failure `error` is `{step, message, name, code?, syscall?, path?, command?, cwd?, exitCode?, signal?, stdout?, stderr?, output?, cause?, stack}` (`step` is `config`, `build`, `verify` or `publish`; `output` is the failing command's full output, up to 2 MB) and `meta.message` repeats the message |
| `POST` | `/builds/:site` | runs `npm run build` in that site's `CODE_PATH`, then replaces the contents of its `PUBLIC_PATH` with `CODE_PATH/dist/`. `202`, or `409` if one is already running |

`:site` is the admin route prefix: `gnu`, `gas-natural`, `trainin`, `tectuus`.

Every request needs the admin's `Authorization: Bearer <jwt>`. The token is validated by forwarding it to `GET {CMS_BASE_URL}/api/admin/sections?site=<slug>`. A missing token or a CMS `401`/`403` is a `401` (session expired). If the CMS can't be reached or answers with any other error, the response is a `502` with the reason in `meta.message` and `error`, so the admin doesn't log the editor out for a CMS outage.

Every response is JSON: `{status: 'success' | 'error', data?, meta?: {message}, error?}`.

| Code | When |
| :-- | :-- |
| `200` / `202` | `GET` / `POST` accepted. **A failed build is still a `200`**: check `data.status === 'error'` and read `data.error` (`meta.message` repeats its message) |
| `401` | No token, or the CMS rejected it |
| `404` | Unknown `:site` |
| `405` | Method other than `GET`/`POST`/`OPTIONS` |
| `409` | `POST` while that site is already building (`data` is the running build) |
| `500` | Unexpected error inside the service (`error.step` is `internal`) |
| `502` | Couldn't validate the token with the CMS (`error.step` is `auth`) |

Builds run in the background: after a `POST`, poll `GET` until `data.status` is no longer `running`.

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

## Deployment

The service runs on the Linux server that hosts the sites (the machine where the `CODE_PATH`/`PUBLIC_PATH` directories exist), as a long-running process under systemd.

### 1. Configure

```bash
cd /home/frontend/cms-frontend/build-server
cp .env.example .env   # set each site's paths; ALLOWED_ORIGINS = the admin's real URL
npm start              # quick check: lists each site's paths, then Ctrl+C
```

- Node ≥ 22.12. The service has no dependencies, so it needs no `npm install`. Each `CODE_PATH` does need its own `node_modules` (`npm ci` there).
- The service user needs write access to every `CODE_PATH` and `PUBLIC_PATH`, e.g. `sudo chown -R frontend:frontend /var/www/html/sitios-cms/gnu`.

### 2. systemd unit

`/etc/systemd/system/build-server.service`:

```ini
[Unit]
Description=CMS build-server (Astro site rebuilds)
After=network.target

[Service]
User=frontend
WorkingDirectory=/home/frontend/cms-frontend/build-server
ExecStart=/usr/bin/node server.mjs
Restart=on-failure
Environment=NODE_ENV=production
# If Node comes from nvm, use its full path in ExecStart and put its bin/ on PATH,
# otherwise `npm run build` isn't found:
# Environment=PATH=/home/frontend/.nvm/versions/node/v22.x/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now build-server   # start now and on boot
sudo systemctl status build-server
journalctl -u build-server -f              # logs, including build failures
sudo systemctl restart build-server        # after changing .env or pulling new code
```

### 3. Expose it over HTTPS

The admin calls the service **from the editor's browser**, so `http://localhost:4400` would point at the editor's own machine (`ERR_CONNECTION_REFUSED`). An HTTPS admin also can't call a plain-`http://` URL. Proxy the service through the web server and keep port 4400 closed in the firewall.

nginx, inside the admin's (or any HTTPS) `server { }` block:

```nginx
location /build-server/ {
    proxy_pass http://127.0.0.1:4400/;   # trailing slash strips the /build-server prefix
    proxy_read_timeout 60s;
}
```

Apache equivalent: `ProxyPass /build-server/ http://127.0.0.1:4400/`.

Then set `VITE_BUILD_SERVER_URL=https://<admin-domain>/build-server` in `gnu-cms-admin/.env` and rebuild and redeploy the admin. If the admin is served from a different origin than the proxy, add that origin to `ALLOWED_ORIGINS`.

### 4. Check

```bash
curl -i http://127.0.0.1:4400/builds/gnu                       # on the server → 401 (no token)
curl -i https://<admin-domain>/build-server/builds/gnu         # from anywhere → 401
```

A `401` means the service is up and reachable. The admin's button sends the real token.
