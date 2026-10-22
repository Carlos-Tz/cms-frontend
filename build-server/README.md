# build-server: install on the production server

## Real values on this server

| What | Value | Notes |
|---|---|---|
| Service folder | `/home/frontend/build-server` | Outside `/var/www/html`, so nginx never serves it |
| Service user | `frontend` | |
| Admin URL | `https://administracion-cms.165.227.59.215.sslip.io` | |
| nginx configs | `/etc/nginx/conf.d/*.conf` | There is **no** `sites-enabled/` on this server |
| gnu code | `/home/frontend/landing-gnu` | `CODE_PATH`: `npm run build` runs here |
| gnu web root | `/var/www/html/sitios-cms/gnu` | `PUBLIC_PATH`: emptied and refilled with `dist/` |

> [!IMPORTANT]
> **Golden rule:** the service runs as `frontend`. Anything you do by hand in a `CODE_PATH`
> (`npm ci`, `git pull`, `npm run build`) must also run as `frontend`, **not as root**:
>
> ```bash
> sudo -u frontend -i
> ```
>
> If root creates files there (`.astro/`, `node_modules/`, `dist/`), "Reconstruir sitio" fails with:
>
> ```
> EACCES: permission denied, open '/home/frontend/landing-gnu/.astro/content.d.ts'
> ```
>
> Fix it with the `chown` commands in [step 1](#1-copy-the-folder-and-configure-it).

---

## 1. Copy the folder and configure it

Copy this `build-server` folder (`server.mjs`, `.env.example`, …) to `/home/frontend/build-server`
(with `scp` or `rsync`), then on the server:

```bash
chown -R frontend:frontend /home/frontend/build-server
sudo -u frontend -i
cd /home/frontend/build-server
cp .env.example .env
nano .env
```

In `.env` set:

```ini
ALLOWED_ORIGINS=https://administracion-cms.165.227.59.215.sslip.io
VITE_GNU_CODE_PATH=/home/frontend/landing-gnu
VITE_GNU_PUBLIC_PATH=/var/www/html/sitios-cms/gnu
```

- `ALLOWED_ORIGINS` must be the real admin URL, not `localhost:5173`.
- Fill in the other sites' pairs once they exist. If a pair is empty, that site's build fails safely.

> [!CAUTION]
> **Never** set a `PUBLIC_PATH` to a folder that contains other things (e.g. `/var/www/html/sitios-cms`
> itself). Its whole content is replaced after every build.

Still as `frontend`, check:

```bash
node -v                                      # 22.12 or newer. build-server itself has no npm install.
which node                                   # write this down, it goes in the unit file (step 2)
cd /home/frontend/landing-gnu && npm ci      # each CODE_PATH needs its node_modules
```

Back as root (`exit`), give `frontend` ownership of every `CODE_PATH` and `PUBLIC_PATH`:

```bash
chown -R frontend:frontend /home/frontend/landing-gnu
chown -R frontend:frontend /var/www/html/sitios-cms/gnu
```

Test a build by hand, as `frontend` (this is exactly what the button does):

```bash
sudo -u frontend -i bash -c 'cd /home/frontend/landing-gnu && npm run build'
```

Test the service by hand:

```bash
sudo -u frontend -i bash -c 'cd /home/frontend/build-server && npm start'
```

You should see `build-server escuchando en http://localhost:4400` with the gnu paths listed.
Stop it with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

---

## 2. Run it as a systemd service

```bash
nano /etc/systemd/system/build-server.service
```

Paste **one** of these. Use the exact path `which node` printed in step 1.

### a) `which node` printed `/usr/bin/node`

```ini
[Unit]
Description=CMS build-server (Astro site rebuilds)
After=network.target

[Service]
User=frontend
WorkingDirectory=/home/frontend/build-server
ExecStart=/usr/bin/node server.mjs
Restart=on-failure
Environment=NODE_ENV=production
Environment=ASTRO_TELEMETRY_DISABLED=1

[Install]
WantedBy=multi-user.target
```

### b) `which node` printed an nvm path

For example `/home/frontend/.nvm/versions/node/vXX.X.X/bin/node`. Replace `v22.12.0` with your
real version on **both** lines.

> [!WARNING]
> The `PATH` line is required. systemd doesn't read `.bashrc`, so without it the build fails
> with `npm: not found`.

```ini
[Unit]
Description=CMS build-server (Astro site rebuilds)
After=network.target

[Service]
User=frontend
WorkingDirectory=/home/frontend/build-server
ExecStart=/home/frontend/.nvm/versions/node/v22.12.0/bin/node server.mjs
Restart=on-failure
Environment=NODE_ENV=production
Environment=ASTRO_TELEMETRY_DISABLED=1
Environment=PATH=/home/frontend/.nvm/versions/node/v22.12.0/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

### Start it

```bash
systemctl daemon-reload
systemctl enable --now build-server     # start now and on every boot
systemctl status build-server           # must say "active (running)"
journalctl -u build-server -f           # live logs, incl. build failures
```

If `status` says `failed`, run `journalctl -u build-server -n 50`. It's usually a wrong `ExecStart`
path or a missing `/home/frontend/build-server/.env`.

After editing `.env` or the unit file, or copying in a new `server.mjs`:

```bash
systemctl daemon-reload                 # only needed if the unit file changed
systemctl restart build-server
```

---

## 3. Make it reachable from the browser (nginx)

The admin calls the build-server from the editor's browser, so it must be a public HTTPS URL:

- `http://localhost:4400` would point at the editor's own computer (`ERR_CONNECTION_REFUSED`).
- An HTTPS admin can't call plain `http://` (mixed content).

The file is `/etc/nginx/conf.d/administracion-cms.conf`. Ignore `*.bak-*` and `*.disabled` files.

> [!WARNING]
> Back it up **outside** `conf.d`. nginx loads every `conf.d/*.conf`, so a backup named
> `something.conf` would load as a duplicate site.

```bash
cp /etc/nginx/conf.d/administracion-cms.conf /root/administracion-cms.conf.bak-$(date +%Y%m%d-%H%M)
```

Find the HTTPS server block (the one with `listen 443 ssl`):

```bash
grep -n "listen\|server_name\|location" /etc/nginx/conf.d/administracion-cms.conf
```

On this server it's the **first** block (`server_name` on line 2, `listen 443` on line 11).
The second block (`listen 80`) is Certbot's redirect. Don't touch it.

```bash
nano +2 /etc/nginx/conf.d/administracion-cms.conf
```

Right after the `server_name` line, at the same level as `location / {` (not inside it), add:

```nginx
location /build-server/ {
    proxy_pass http://127.0.0.1:4400/;   # keep BOTH trailing slashes
    proxy_read_timeout 60s;
}
```

Then:

```bash
nginx -t && systemctl reload nginx
```

In `gnu-cms-admin/.env` (no trailing slash):

```ini
VITE_BUILD_SERVER_URL=https://administracion-cms.165.227.59.215.sslip.io/build-server
```

It's read at build time, so rebuild and redeploy the admin afterwards.

Keep port `4400` closed in the firewall. It should only be reachable through nginx.

---

## 4. Check it

```bash
curl -i http://127.0.0.1:4400/builds/gnu
curl -i https://administracion-cms.165.227.59.215.sslip.io/build-server/builds/gnu
```

Both should return **401** (no token). That means the service is running and reachable. The
admin's button sends the real token.

| Result | Meaning |
|---|---|
| `401` | Working |
| `404` | The `location` block is in the wrong server block (port 80 or another domain) |
| `502` | The service isn't running: `systemctl status build-server` |
| `EACCES` in the button's error | Files owned by root: redo the `chown` in step 1 |

---

## 5. After changing `/home/frontend/build-server/.env`

`.env` is read only once, when the service starts. Saving the file changes nothing until you restart.

Edit it as `frontend`, so the file stays owned by `frontend`:

```bash
sudo -u frontend -i
nano /home/frontend/build-server/.env
exit
```

> [!CAUTION]
> Before restarting, make sure no build is running. Restarting kills a build in progress, and that
> site's web root can be left half-published. This must print nothing:
>
> ```bash
> pgrep -u frontend -af "astro build"
> ```

Restart and confirm:

```bash
systemctl restart build-server
systemctl status build-server              # must say "active (running)"
journalctl -u build-server -n 20           # startup lines list the paths it loaded
curl -i http://127.0.0.1:4400/builds/gnu   # expect 401
```

### Extra steps, depending on what you changed

**Added or changed a site's `CODE_PATH` / `PUBLIC_PATH`**

- The folders must already exist, and the code folder needs `node_modules`:
  ```bash
  sudo -u frontend -i bash -c 'cd <CODE_PATH> && npm ci'
  ```
- Give `frontend` ownership of both (as root):
  ```bash
  chown -R frontend:frontend <CODE_PATH> <PUBLIC_PATH>
  ```
- `PUBLIC_PATH` must be that site's own folder (e.g. `/var/www/html/sitios-cms/gnu`), never a
  parent folder like `/var/www/html/sitios-cms`. Its content is replaced on every build.
- Test the build by hand as `frontend` before using the button (see step 1).

**Changed `PORT`**

- Update the `proxy_pass` port in `/etc/nginx/conf.d/administracion-cms.conf` (step 3), then:
  ```bash
  nginx -t && systemctl reload nginx
  ```

**Changed `ALLOWED_ORIGINS` or `CMS_BASE_URL`**

- Nothing else: the restart is enough. The admin doesn't need a rebuild.

> [!NOTE]
> The admin's `VITE_BUILD_SERVER_URL` is **not** in this file. It lives in `gnu-cms-admin/.env` and
> needs an admin rebuild and redeploy (step 3), not a build-server restart.

---

## 6. Things DevOps / the webmaster should know

### How a rebuild works

When an editor clicks "Reconstruir sitio", the service:

1. Validates the editor's token by calling the CMS (`CMS_BASE_URL/api/admin/sections`).
2. Runs `npm run build` in the site's `CODE_PATH`.
3. Checks that `dist/index.html` exists and isn't empty.
4. **Deletes everything** in `PUBLIC_PATH` and copies `dist/` into it.

```mermaid
sequenceDiagram
    autonumber
    actor Editor as Editor (browser)
    participant Nginx as nginx<br/>administracion-cms…/build-server/
    participant BS as build-server<br/>127.0.0.1:4400 (user frontend)
    participant CMS as CMS API<br/>CMS_BASE_URL
    participant Code as CODE_PATH<br/>/home/frontend/landing-gnu
    participant Pub as PUBLIC_PATH<br/>/var/www/html/sitios-cms/gnu

    Editor->>Nginx: POST /build-server/builds/gnu<br/>Authorization: Bearer token
    Nginx->>BS: POST /builds/gnu
    BS->>CMS: GET /api/admin/sections?site=gnu
    alt token rejected
        CMS-->>BS: 401 / 403
        BS-->>Editor: 401 "Tu sesión expiró"
    else build already running for this site
        BS-->>Editor: 409
    else token OK
        CMS-->>BS: 200
        BS-->>Editor: 202 (build started)
        BS->>Code: npm run build
        Code->>CMS: astro build reads the site content
        Code-->>BS: dist/ written
        BS->>Code: check dist/index.html exists and isn't empty
        BS->>Pub: delete everything, then copy dist/ in
        Note over Pub: live site is empty/partial<br/>for a moment here
    end
    loop every few seconds until success / error
        Editor->>Nginx: GET /build-server/builds/gnu
        Nginx->>BS: GET /builds/gnu
        BS-->>Editor: status, step, last log lines, error
    end
```

> [!NOTE]
> The diagram is Mermaid. GitHub and GitLab draw it automatically; in VS Code, install the
> "Markdown Preview Mermaid Support" extension to see it in the preview.

What follows from that:

- **The live site is whatever code is in `CODE_PATH`.** To deploy a code change, update `CODE_PATH`
  (`git pull` as `frontend`), then rebuild with the button or by hand. Anything uncommitted or
  half-pulled there goes live on the next click.
- **Never edit files directly in `PUBLIC_PATH`.** They're wiped on the next rebuild. Anything that has
  to survive (e.g. `robots.txt`, verification files, `.well-known/`) belongs in the site's `public/` folder.
- **Publishing is not atomic.** For a moment during step 4 the folder is empty or partial, so visitors can
  get a 404 for a second. If the process dies mid-copy, the site stays half-published until the next
  successful rebuild.
- **There's no automatic rollback.** The previous version isn't kept. To roll back, check out the previous
  commit in `CODE_PATH` and rebuild, or keep your own backup of `PUBLIC_PATH`.
- **A build that "succeeds" isn't always correct.** If the CMS is down during the build, the site can still
  produce an `index.html` with missing content, and it gets published. Check the site after a rebuild
  that happened during a CMS outage.
- **Build status lives in memory.** A restart clears the progress/last-error shown in the admin. Real logs
  are in `journalctl -u build-server`.
- **One build per site at a time** (a second click gets a 409), but **different sites can build at the
  same time.** Each Astro build can use 1 GB+ of RAM. On a small server, add swap or ask editors not to
  rebuild several sites at once. An out-of-memory kill shows as `terminó con código 137` or `señal SIGKILL`;
  confirm with `dmesg | grep -i oom`.

### Security

- **The service listens on all interfaces**, not only `127.0.0.1`. The firewall is what keeps port `4400`
  private. Check it's closed from outside: `curl -m 5 http://<server-ip>:4400/builds/gnu` from your own
  computer must time out.
- **Anyone who can log in to the admin can trigger rebuilds.** There's no rate limit. That's fine for a
  handful of editors. If it becomes a problem, add nginx `limit_req` to the `/build-server/` location.
- **Settings in the unit file win over `.env`.** If a variable is set with `Environment=` in the unit file,
  the `.env` value for it is ignored. Keep site settings in `.env` only.
- **Error messages in the admin include server paths and build output.** Fine for trusted editors; keep it
  in mind before giving admin access to outsiders.

### This server (RHEL-family Linux with SELinux)

The server uses `/etc/nginx/conf.d/`, which points to a RHEL/CentOS/Rocky/Alma system. Check with
`cat /etc/os-release` and `getenforce`. If `getenforce` prints `Enforcing`:

- **nginx may not be allowed to proxy to port 4400.** Symptom: 502, and `/var/log/nginx/error.log` shows
  `connect() to 127.0.0.1:4400 failed (13: Permission denied)`. Fix:
  ```bash
  setsebool -P httpd_can_network_connect 1
  ```
- **nginx may not be allowed to read published files.** Symptom: 403 on the public site after a rebuild.
  Fix the labels:
  ```bash
  restorecon -Rv /var/www/html/sitios-cms
  ```
- The firewall is `firewalld`. List what's open with `firewall-cmd --list-all`. `4400` must not appear.

### Maintenance

- **Upgrading Node with nvm changes its path.** Update `ExecStart` and `PATH` in the unit file, then
  `systemctl daemon-reload && systemctl restart build-server`. Otherwise the service keeps the old Node, or
  fails if the old version was removed. Also re-run `npm ci` in every `CODE_PATH`.
- **Certbot renewals don't remove the `location /build-server/` block**, but re-check it after running
  `certbot --nginx` again for that domain.
- **Disk space:** each `CODE_PATH` holds `node_modules/` and `dist/`. Check with `df -h` and
  `du -sh /home/frontend/*`.
- **Logs** go to journald, which rotates them on its own. Size: `journalctl --disk-usage`.
- **Adding a new site** isn't just `.env`: the site list (`gnu`, `gas-natural`, `trainin`, `tectuus`) is
  fixed in `server.mjs` (`SITES`). Note the variable spelling for trainin is `VITE_TRANINN_*`.

---

## 7. Deploying on Azure

The build-server needs three things on **the same machine**: the site's source code with `node_modules`
(`CODE_PATH`), a folder the web server serves (`PUBLIC_PATH`), and a long-running Node process that can run
`npm run build`. That rules out most "serverless" options, so here are the choices from simplest to most
involved.

### Option A: Azure Linux VM (recommended)

The same setup as this README, on a VM:

1. **Create the VM.** Ubuntu 24.04 LTS, at least 2 vCPU / 4 GB RAM (e.g. `Standard_B2s`) because of the Astro
   builds. Give it a static public IP and a DNS name.
2. **Network Security Group:** allow inbound `22` (SSH, ideally only from your office IP), `80` and `443`.
   **Don't open `4400`.** Inside the VM, also enable `ufw`:
   ```bash
   ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
   ```
3. **Install the software:**
   ```bash
   apt update && apt install -y nginx git certbot python3-certbot-nginx
   adduser frontend
   sudo -u frontend -i   # then install nvm and Node 22 for this user
   ```
4. **Follow steps 1–5 of this README**, with these Ubuntu differences:

   | This server (RHEL) | Ubuntu on Azure |
   |---|---|
   | `/etc/nginx/conf.d/<site>.conf` | `/etc/nginx/sites-available/<site>`, enabled with `ln -s` into `sites-enabled/` |
   | Back up outside `conf.d` | Back up outside `sites-enabled/` (same reason) |
   | nginx runs as `nginx` | nginx runs as `www-data` |
   | SELinux (`setsebool`, `restorecon`) | AppArmor, nothing to do |
   | `firewalld` | `ufw` + the Azure NSG |

5. **HTTPS:** `certbot --nginx -d admin.yourdomain.com -d gnu.yourdomain.com`. Point the DNS records at the
   VM's public IP first.
6. **Backups:** enable Azure Backup for the VM, or at least snapshot the OS disk before big changes.

### Option B: VM for builds + Azure Storage static website for the public sites

Use this if you want the public sites on Azure Storage (`$web` container), optionally behind Azure Front
Door, instead of nginx. The build-server still runs on a VM (Option A). Only `PUBLIC_PATH` changes: mount
the `$web` container on the VM with **BlobFuse2** and point `PUBLIC_PATH` at the mount.

1. Create a Storage account (StorageV2), enable **Static website**, and note its `$web` container.
2. On the VM, install BlobFuse2 and mount the container, e.g. at `/mnt/gnu-web`
   (see Microsoft's "Mount an Azure Blob Storage container on Linux with BlobFuse2" guide). Make the mount
   permanent (systemd or `/etc/fstab`) and readable/writable by `frontend`.
3. In `.env`: `VITE_GNU_PUBLIC_PATH=/mnt/gnu-web`, then `systemctl restart build-server`.
4. One storage account per site: `PUBLIC_PATH` gets fully wiped, so it must hold only that site.

> [!WARNING]
> - Publishing over BlobFuse2 is slower than to a local disk, and the "empty for a moment" window is longer.
> - If Azure Front Door caches the site, new content won't show until the cache expires or you purge it:
>   ```bash
>   az afd endpoint purge --resource-group <rg> --profile-name <profile> --endpoint-name <endpoint> --content-paths '/*'
>   ```
>   The build-server doesn't do this for you. Use short cache times for HTML, or purge by hand after a rebuild.

### Option C: Azure App Service / Container Apps (not recommended)

Possible, but it fights how the service works:

- Build status is kept in memory, so it needs **exactly one instance** (no scale-out).
- `CODE_PATH`, `PUBLIC_PATH` and `node_modules` must be on persistent storage (`/home` on App Service), and
  something has to serve `PUBLIC_PATH` as a website.
- Restarts and platform updates kill any running build.

Only consider it if a VM is not allowed.

### Admin and CORS on Azure

- If the admin is hosted on a **different domain** from the `/build-server/` proxy (e.g. the admin on Azure
  Static Web Apps, the build-server on a VM), put the admin's exact origin in `ALLOWED_ORIGINS`
  (`https://<name>.azurestaticapps.net` and/or its custom domain, comma-separated).
- `VITE_BUILD_SERVER_URL` must always be the public HTTPS URL of the proxy, never `localhost` or the VM's
  private IP.
- The VM must be able to reach `CMS_BASE_URL` over HTTPS (outbound is open by default in Azure; check it if
  your NSG restricts outbound traffic). Every rebuild and every token check depends on it.
