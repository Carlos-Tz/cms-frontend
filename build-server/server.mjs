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
// When a build fails, `data.error` carries everything known about it (the
// step that broke, message, exit code/signal, fs/spawn error fields, stack and
// the failing command's full stdout/stderr), and `meta.message` repeats the
// message, so the admin can show exactly what went wrong.
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
// The rolling `log` above is trimmed for the progress view; the failing
// command's full output is kept separately (up to this size) so the client
// gets the whole error, not just its tail.
const MAX_OUTPUT_CHARS = 2 * 1024 * 1024

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
    return { status: 'idle', startedAt: null, finishedAt: null, step: null, error: null, log: [] }
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

// Strip ANSI colors: logs are shown as plain text in the admin.
const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')

function capOutput(text) {
    return text.length > MAX_OUTPUT_CHARS
        ? `[... ${text.length - MAX_OUTPUT_CHARS} caracteres omitidos ...]\n` + text.slice(-MAX_OUTPUT_CHARS)
        : text
}

// Everything we know about a failure, as plain JSON for the admin: which step
// broke, the message, process exit info, Node's fs/spawn error fields (code,
// syscall, path) and the failing command's full output.
function describeError(error, step) {
    const details = {
        step,
        message: error?.message ?? String(error),
        name: error?.name ?? null,
    }
    for (const field of ['code', 'errno', 'syscall', 'path', 'dest', 'command', 'cwd', 'exitCode', 'signal', 'stdout', 'stderr', 'output']) {
        if (error?.[field] !== undefined) details[field] = error[field]
    }
    if (error?.cause) details.cause = describeError(error.cause, step)
    details.stack = error?.stack ?? null
    return details
}

function appendLog(state, chunk) {
    const lines = stripAnsi(chunk.toString()).split(/\r?\n/).filter((l) => l.trim() !== '')
    state.log.push(...lines)
    if (state.log.length > LOG_LINES) state.log.splice(0, state.log.length - LOG_LINES)
}

function run(command, cwd, state) {
    return new Promise((resolve, reject) => {
        appendLog(state, `$ ${command}`)
        let stdout = ''
        let stderr = ''
        let output = ''
        const child = spawn(command, { cwd, shell: true, env: process.env })
        child.stdout.on('data', (d) => {
            const text = stripAnsi(d.toString())
            stdout = capOutput(stdout + text)
            output = capOutput(output + text)
            appendLog(state, d)
        })
        child.stderr.on('data', (d) => {
            const text = stripAnsi(d.toString())
            stderr = capOutput(stderr + text)
            output = capOutput(output + text)
            appendLog(state, d)
        })
        child.on('error', (error) => {
            reject(Object.assign(error, { command, cwd, stdout, stderr, output }))
        })
        child.on('close', (code, signal) => {
            if (code === 0) return resolve()
            const error = new Error(signal
                ? `"${command}" fue terminado por la señal ${signal}`
                : `"${command}" terminó con código ${code}`)
            reject(Object.assign(error, { command, cwd, exitCode: code, signal, stdout, stderr, output }))
        })
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

    try {
        state.step = 'config'
        if (!isConfiguredPath(site.codePath) || !isConfiguredPath(site.publicPath)) {
            throw new Error(`Rutas no configuradas para "${key}": define sus VITE_..._CODE_PATH y VITE_..._PUBLIC_PATH en build-server/.env.`)
        }

        const cwd = path.resolve(site.codePath)
        const target = path.resolve(site.publicPath)

        // With `shell: true` a missing cwd surfaces as a misleading
        // "spawn cmd.exe ENOENT", so check it up front and say what's wrong.
        if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
            throw Object.assign(new Error(`CODE_PATH no existe o no es una carpeta: ${cwd}`), { path: cwd })
        }
        if (!fs.existsSync(path.join(cwd, 'package.json'))) {
            throw Object.assign(new Error(`CODE_PATH no contiene package.json: ${cwd}`), { path: cwd })
        }

        state.step = 'build'
        await run('npm run build', cwd, state)

        // `npm run build` exits 0 even when the CMS is unreachable (fetchData
        // swallows the error), so at least make sure something was emitted
        // before it replaces the live site.
        state.step = 'verify'
        const dist = path.join(cwd, 'dist')
        const index = path.join(dist, 'index.html')
        if (!fs.existsSync(index) || fs.statSync(index).size === 0) {
            throw Object.assign(new Error('La compilación no generó dist/index.html'), { path: index })
        }

        state.step = 'publish'
        publish(dist, target, state)

        state.step = null
        state.status = 'success'
    } catch (error) {
        state.status = 'error'
        state.error = describeError(error, state.step)
        appendLog(state, `Error en el paso "${state.step}": ${state.error.message}`)
        console.error(`[${key}] la reconstrucción falló en "${state.step}":`, error)
    } finally {
        state.finishedAt = new Date().toISOString()
    }
}

const SESSION_EXPIRED = { status: 401, body: { status: 'error', meta: { message: 'Tu sesión expiró. Inicia sesión de nuevo.' } } }

// A token is accepted if the CMS accepts it for an admin read on that site.
// Returns null when authorized, otherwise the {status, body} to reply with —
// a CMS that is down or misbehaving is reported as such (502), not as an
// expired session, so the admin doesn't log the editor out for no reason.
async function checkAuthorization(req, site) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return SESSION_EXPIRED

    const url = `${CMS_BASE_URL}/api/admin/sections?site=${encodeURIComponent(site.slug)}`
    let res
    try {
        res = await fetch(url, { headers: { Authorization: auth, Accept: 'application/json' } })
    } catch (error) {
        console.error('No se pudo validar el token con el CMS:', error)
        return {
            status: 502,
            body: {
                status: 'error',
                meta: { message: `No se pudo contactar al CMS para validar la sesión (${CMS_BASE_URL}): ${error.message}` },
                error: describeError(error, 'auth'),
            },
        }
    }

    if (res.ok) return null
    if (res.status === 401 || res.status === 403) return SESSION_EXPIRED

    const responseBody = await res.text().catch(() => '')
    return {
        status: 502,
        body: {
            status: 'error',
            meta: { message: `El CMS respondió HTTP ${res.status} al validar la sesión.` },
            error: { step: 'auth', message: `HTTP ${res.status} ${res.statusText}`, url, httpStatus: res.status, responseBody: capOutput(responseBody) },
        },
    }
}

function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
}

// Build state as returned to the admin. A failed build also gets its message
// in `meta.message`, so callers that only read the envelope still see it.
function buildBody(key) {
    const data = builds[key]
    return data.status === 'error'
        ? { status: 'success', data, meta: { message: data.error?.message ?? 'La reconstrucción falló.' } }
        : { status: 'success', data }
}

async function handle(req, res) {
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
    if (!site) return send(res, 404, { status: 'error', meta: { message: `Sitio no encontrado: ${req.url}` } })

    const denied = await checkAuthorization(req, site)
    if (denied) return send(res, denied.status, denied.body)

    if (req.method === 'GET') {
        return send(res, 200, buildBody(key))
    }

    if (req.method === 'POST') {
        if (builds[key].status === 'running') {
            return send(res, 409, { status: 'error', data: builds[key], meta: { message: 'Ya hay una reconstrucción en curso para este sitio.' } })
        }
        startBuild(key).catch((error) => {
            // startBuild handles its own errors; this only fires on a bug in it.
            console.error(`[${key}] error inesperado:`, error)
            Object.assign(builds[key], { status: 'error', error: describeError(error, 'internal'), finishedAt: new Date().toISOString() })
        })
        return send(res, 202, buildBody(key))
    }

    send(res, 405, { status: 'error', meta: { message: `Método no permitido: ${req.method}` } })
}

// Any unexpected exception in a request still answers with a JSON error
// instead of leaving the connection hanging or crashing the process.
const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
        console.error(`${req.method} ${req.url} falló:`, error)
        if (res.headersSent) return res.end()
        send(res, 500, {
            status: 'error',
            meta: { message: `Error interno del servicio de reconstrucción: ${error.message}` },
            error: describeError(error, 'internal'),
        })
    })
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
