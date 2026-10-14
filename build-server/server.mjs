// Build service for the public Astro sites.
//
// The Astro sites only read the CMS at build time, so an edit saved in
// gnu-cms-admin is invisible until the site is rebuilt. The admin is a browser
// SPA and cannot run `npm run build` itself — it calls this service instead.
//
//   GET  /builds/:site   → current/last build status for that site
//   POST /builds/:site   → run `npm run build` in that site's CODE_PATH, then
//                          replace the contents of its PUBLIC_PATH with dist/
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
const LOG_LINES = 200

// Admin route prefix → Astro project dir (CODE_PATH, where `npm run build`
// runs) + web root (PUBLIC_PATH, fully replaced with CODE_PATH/dist/ after a
// successful build) + CMS slug (see DEVOPS.md §1 — the names do not match).
// CODE_PATH and PUBLIC_PATH are two independent directories (not nested —
// there is no shared parent folder to carve a `code/` subfolder out of
// anymore), each read straight from its own env var so every site can be
// configured independently and a site with no real paths yet just fails
// closed instead of touching anything.
const SITES = {
    'gnu':         { codePath: process.env.VITE_GNU_CODE_PATH,         publicPath: process.env.VITE_GNU_PUBLIC_PATH,         slug: 'gnu' },
    'gas-natural': { codePath: process.env.VITE_GAS_NATURAL_CODE_PATH, publicPath: process.env.VITE_GAS_NATURAL_PUBLIC_PATH, slug: 'gnu-vehicular' },
    'trainin':     { codePath: process.env.VITE_TRANINN_CODE_PATH,     publicPath: process.env.VITE_TRANINN_PUBLIC_PATH,     slug: 'traninn-logistic' },
    'tectuus':     { codePath: process.env.VITE_TECTUUS_CODE_PATH,     publicPath: process.env.VITE_TECTUUS_PUBLIC_PATH,     slug: 'tectuus' },
}

// Guards against the obvious catastrophic case: an unset/placeholder path
// (empty, ".", or "/" — exactly what the example .env ships before someone
// fills in the real one) resolving to the filesystem root and `publish()`
// then wiping it. Doesn't try to be a general sandbox, just refuses the
// degenerate inputs that would otherwise nuke the server.
function isConfiguredPath(value) {
    if (!value || !value.trim()) return false
    const resolved = path.resolve(value.trim())
    return resolved !== path.parse(resolved).root
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

// CODE_PATH and PUBLIC_PATH are independent directories now (no shared parent
// to carve a `code/` subfolder out of), so publishing is a full replace:
// wipe PUBLIC_PATH's contents and copy dist/ straight in.
function publish(dist, target, state) {
    appendLog(state, `Publicando dist/ en ${target}`)
    fs.mkdirSync(target, { recursive: true })
    for (const entry of fs.readdirSync(target)) {
        fs.rmSync(path.join(target, entry), { recursive: true, force: true })
    }
    fs.cpSync(dist, target, { recursive: true })
}

async function startBuild(key) {
    const site = SITES[key]
    const state = { ...idleState(), status: 'running', startedAt: new Date().toISOString() }
    builds[key] = state

    if (!isConfiguredPath(site.codePath) || !isConfiguredPath(site.publicPath)) {
        state.status = 'error'
        state.error = `Rutas no configuradas para "${key}": define sus VITE_..._CODE_PATH y VITE_..._PUBLIC_PATH en build-server/.env.`
        state.finishedAt = new Date().toISOString()
        appendLog(state, state.error)
        return
    }

    const cwd = path.resolve(site.codePath)
    const target = path.resolve(site.publicPath)
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

        publish(dist, target, state)

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
    for (const [key, site] of Object.entries(SITES)) {
        console.log(
            isConfiguredPath(site.codePath) && isConfiguredPath(site.publicPath)
                ? `  ${key}: ${site.codePath} → ${site.publicPath}`
                : `  ${key}: sin configurar (faltan VITE_..._CODE_PATH/PUBLIC_PATH)`
        )
    }
    console.log(`  orígenes permitidos: ${ALLOWED_ORIGINS.join(', ')}`)
})
