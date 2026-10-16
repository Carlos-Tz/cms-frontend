import React, { useCallback, useEffect, useRef, useState } from 'react'

import { getRebuildStatus, rebuildSite } from '../functions/fetch'

const POLL_MS = 3000

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

// Compact one-liner for a failed BuildState's `error` (step/exitCode/signal/
// code) — the full message and output already get their own spots below.
function summarizeBuildError(error) {
  if (!error) return ''
  const parts = []
  if (error.step) parts.push(`paso: ${error.step}`)
  if (error.exitCode != null) parts.push(`código de salida: ${error.exitCode}`)
  if (error.signal) parts.push(`señal: ${error.signal}`)
  if (error.code) parts.push(`código: ${error.code}`) // fs/spawn errors: EACCES, EBUSY, ENOENT…
  return parts.join(' · ')
}

// Rebuilds the public Astro site for `site` (admin route prefix: gnu,
// gas-natural, trainin, tectuus) so edits saved in the panel go live.
export default function RebuildSiteButton({ site }) {
  const [build, setBuild] = useState(null)
  const [message, setMessage] = useState('')
  // Envelope-level `error` (502 CMS-probe failure, 500 internal exception,
  // etc.) — distinct from `build.error`, which is a *build's* failure detail.
  // `message` already shows the friendly `meta.message` for these; this just
  // keeps the raw object around so "Ver detalles" can show the full picture.
  const [requestError, setRequestError] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const timer = useRef(null)

  const refresh = useCallback(async () => {
    const res = await getRebuildStatus(site)
    if (res.status !== 'success') {
      setMessage(res.meta?.message ?? 'No se pudo obtener el estado de la reconstrucción.')
      setRequestError(res.error ?? null)
      return
    }
    setBuild(res.data)
    setMessage('')
    setRequestError(null)
  }, [site])

  useEffect(() => {
    refresh()
    return () => clearTimeout(timer.current)
  }, [refresh])

  const running = build?.status === 'running'

  useEffect(() => {
    if (!running) return
    timer.current = setTimeout(refresh, POLL_MS)
    return () => clearTimeout(timer.current)
  }, [running, build, refresh])

  async function handleClick() {
    setShowLog(false)
    const res = await rebuildSite(site)
    if (res.data) setBuild(res.data)
    setMessage(res.status === 'success' ? '' : (res.meta?.message ?? 'No se pudo iniciar la reconstrucción.'))
    setRequestError(res.status === 'success' ? null : (res.error ?? null))
  }

  let statusLine = null
  if (running) {
    statusLine = <span className="text-amber-300">Reconstruyendo… esto puede tardar unos minutos.</span>
  } else if (build?.status === 'success') {
    statusLine = <span className="text-emerald-300">Sitio actualizado · {formatTime(build.finishedAt)}</span>
  } else if (build?.status === 'error') {
    statusLine = <span className="text-rose-300">Falló la reconstrucción · {formatTime(build.finishedAt)}</span>
  }

  const buildErrorSummary = build?.status === 'error' ? summarizeBuildError(build.error) : ''

  // build-server keeps the failing command's full output in `error.output`;
  // `log` is only the trimmed progress tail, so prefer the full output. When
  // the failure wasn't a build at all but the request itself (502/500/etc.),
  // fall back to the full envelope-level error so nothing gets lost.
  const errorDetails = build?.status === 'error'
    ? (build.error?.output || build.log?.join('\n') || '')
    : requestError
      ? JSON.stringify(requestError, null, 2)
      : ''

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Publicar cambios</h2>
          <p className="mt-1 text-sm text-white/60">
            Los cambios guardados no aparecen en el sitio público hasta reconstruirlo.
          </p>
          {statusLine && <p className="mt-2 text-sm">{statusLine}</p>}
          {build?.status === 'error' && build.error?.message && (
            <p className="mt-1 text-sm text-rose-300/90">{build.error.message}</p>
          )}
          {buildErrorSummary && <p className="mt-1 text-xs text-white/40">{buildErrorSummary}</p>}
          {message && <p className="mt-2 text-sm text-rose-300">{message}</p>}
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={running}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
        >
          {running && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          )}
          {running ? 'Reconstruyendo…' : 'Reconstruir sitio'}
        </button>
      </div>

      {errorDetails && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowLog((v) => !v)}
            className="text-xs text-white/50 transition hover:text-white/80"
          >
            {showLog ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
          {showLog && (
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70">
              {errorDetails}
            </pre>
          )}
        </div>
      )}
    </section>
  )
}
