// Build service for the public Astro sites.
//
// The Astro sites only read the CMS at build time, so an edit saved in
// gnu-cms-admin is invisible until the site is rebuilt. The admin is a browser
// SPA and cannot run `npm run build` itself — it calls this service instead.
//
//   GET  /builds/:site   → current/last build status for that site
//   POST /builds/:site   → run `npm run build`, then publish dist/ into the
//                          site's folder under PUBLISH_ROOT
//
// `:site` is the admin route prefix (gnu, gas-natural, trainin, tectuus).
// Every request must carry the admin's bearer token; it is validated by
// forwarding it to the CMS, so no extra secret has to be shared with editors.
//
// Zero dependencies — run with `node server.mjs` (Node >= 22).

import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

loadEnvFile(path.join(HERE, '.env'))

const PORT = Number(process.env.PORT ?? 4400)
const CMS_BASE_URL = (process.env.CMS_BASE_URL ?? 'https://gnu-headless-cms.165.227.59.215.sslip.io').replace(/\/+$/, '')
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',').map((s) => s.trim()).filter(Boolean)
// Folder the web server serves the sites from (production:
// /var/www/html/sitios-cms). Each site folder there holds the published build
// plus the Astro project itself in `code/`, so that is where the build runs.
// Unset (local dev) → build the repo's projects under SITES_ROOT, don't publish.
const PUBLISH_ROOT = process.env.PUBLISH_ROOT ? path.resolve(process.env.PUBLISH_ROOT) : null
const SITES_ROOT = path.resolve(HERE, process.env.SITES_ROOT ?? '..')
const CODE_DIR = 'code'
const LOG_LINES = 200

// Admin route prefix → repo project folder, published folder under
// PUBLISH_ROOT, and CMS slug (see DEVOPS.md §1 — the names do not match).
const SITES = {
    'gnu':         { folder: 'landing-gnu', publish: 'gnu',              slug: 'gnu' },
    'gas-natural': { folder: 'gas-gnu',     publish: 'gnu-gas-natural',  slug: 'gnu-vehicular' },
    'trainin':     { folder: 'trainin',     publish: 'traninn-logistic', slug: 'traninn-logistic' },
    'tectuus':     { folder: 'tectuus',     publish: 'tectuus',          slug: 'tectuus' },
}

// In-memory state, one entry per site. Lost on restart, which is fine: it only
// drives the admin's progress indicator.
const builds = Object.fromEntries(Object.keys(SITES).map((key) => [key, idleState()]))

function idleState() {
    return { status: 'idle', startedAt: null, finishedAt: null, error: null, log: [] }
}

function loadEnvFile(file) {
    if (!fs.existsSync(file)) return
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
        if (match && process.env[match[1]] === undefined) {
            process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
        }
    }
}

function appendLog(state, chunk) {
    // Strip ANSI colors: the log is shown as plain text in the admin.
    const lines = chunk.toString().replace(/\x1b\[[0-9;]*m/g, '').split(/\r?\n/).filter((l) => l.trim() !== '')
    state.log.push(...lines)
    if (state.log.length > LOG_LINES) state.log.splice(0, state.log.length - LOG_LINES)
}

function run(command, cwd, state) {
    return new Promise((resolve, reject) => {
        appendLog(state, `$ ${command}`)
        const child = spawn(command, { cwd, shell: true, env: process.env })
        child.stdout.on('data', (d) => appendLog(state, d))
        child.stderr.on('data', (d) => appendLog(state, d))
        child.on('error', reject)
        child.on('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`"${command}" terminó con código ${code}`)))
    })
}

// The published folders hold the build output directly (index.html, _astro/,
// one folder per route), so replace their contents with dist/'s — everything
// except `code/`, which is the project being built.
function publish(dist, target, state) {
    if (fs.existsSync(path.join(dist, CODE_DIR))) {
        throw new Error(`dist/ contiene "${CODE_DIR}/", que choca con la carpeta del proyecto`)
    }
    appendLog(state, `Publicando dist/ en ${target}`)
    for (const entry of fs.readdirSync(target)) {
        if (entry === CODE_DIR) continue
        fs.rmSync(path.join(target, entry), { recursive: true, force: true })
    }
    fs.cpSync(dist, target, { recursive: true })
}

async function startBuild(key) {
    const site = SITES[key]
    const state = { ...idleState(), status: 'running', startedAt: new Date().toISOString() }
    builds[key] = state

    const target = PUBLISH_ROOT && path.join(PUBLISH_ROOT, site.publish)
    const cwd = target ? path.join(target, CODE_DIR) : path.join(SITES_ROOT, site.folder)
    try {
        await run('npm run build', cwd, state)

        // `npm run build` exits 0 even when the CMS is unreachable (fetchData
        // swallows the error), so at least make sure something was emitted
        // before it replaces the live site.
        const dist = path.join(cwd, 'dist')
        const index = path.join(dist, 'index.html')
        if (!fs.existsSync(index) || fs.statSync(index).size === 0) {
            throw new Error('La compilación no generó dist/index.html')
        }

        if (target) publish(dist, target, state)

        state.status = 'success'
    } catch (error) {
        state.status = 'error'
        state.error = error.message
        appendLog(state, error.message)
    } finally {
        state.finishedAt = new Date().toISOString()
    }
}

// A token is accepted if the CMS accepts it for an admin read on that site.
async function isAuthorized(req, site) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return false
    try {
        const res = await fetch(`${CMS_BASE_URL}/api/admin/sections?site=${encodeURIComponent(site.slug)}`, {
            headers: { Authorization: auth, Accept: 'application/json' },
        })
        return res.ok
    } catch (error) {
        console.error('No se pudo validar el token con el CMS:', error)
        return false
    }
}

function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Vary', 'Origin')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    }
    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        return res.end()
    }

    const match = req.url.match(/^\/builds\/([a-z-]+)\/?(?:\?.*)?$/)
    const key = match?.[1]
    const site = key && SITES[key]
    if (!site) return send(res, 404, { status: 'error', meta: { message: 'Sitio no encontrado' } })

    if (!(await isAuthorized(req, site))) {
        return send(res, 401, { status: 'error', meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } })
    }

    if (req.method === 'GET') {
        return send(res, 200, { status: 'success', data: builds[key] })
    }

    if (req.method === 'POST') {
        if (builds[key].status === 'running') {
            return send(res, 409, { status: 'error', data: builds[key], meta: { message: 'Ya hay una reconstrucción en curso para este sitio.' } })
        }
        startBuild(key)
        return send(res, 202, { status: 'success', data: builds[key] })
    }

    send(res, 405, { status: 'error', meta: { message: 'Método no permitido' } })
})

server.listen(PORT, () => {
    console.log(`build-server escuchando en http://localhost:${PORT}`)
    console.log(PUBLISH_ROOT
        ? `  compilando <sitio>/${CODE_DIR} y publicando en ${PUBLISH_ROOT}`
        : `  compilando en ${SITES_ROOT} (sin publicar)`)
    console.log(`  orígenes permitidos: ${ALLOWED_ORIGINS.join(', ')}`)
})
