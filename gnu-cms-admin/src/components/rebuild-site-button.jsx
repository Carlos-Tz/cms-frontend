import React, { useCallback, useEffect, useRef, useState } from 'react'

import { getRebuildStatus, rebuildSite } from '../functions/fetch'

const POLL_MS = 3000

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

// Rebuilds the public Astro site for `site` (admin route prefix: gnu,
// gas-natural, trainin, tectuus) so edits saved in the panel go live.
export default function RebuildSiteButton({ site }) {
  const [build, setBuild] = useState(null)
  const [message, setMessage] = useState('')
  const [showLog, setShowLog] = useState(false)
  const timer = useRef(null)

  const refresh = useCallback(async () => {
    const res = await getRebuildStatus(site)
    if (res.status !== 'success') {
      setMessage(res.meta?.message ?? 'No se pudo obtener el estado de la reconstrucción.')
      return
    }
    setBuild(res.data)
    setMessage('')
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
  }

  let statusLine = null
  if (running) {
    statusLine = <span className="text-amber-300">Reconstruyendo… esto puede tardar unos minutos.</span>
  } else if (build?.status === 'success') {
    statusLine = <span className="text-emerald-300">Sitio actualizado · {formatTime(build.finishedAt)}</span>
  } else if (build?.status === 'error') {
    statusLine = <span className="text-rose-300">Falló la reconstrucción · {formatTime(build.finishedAt)}</span>
  }

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Publicar cambios</h2>
          <p className="mt-1 text-sm text-white/60">
            Los cambios guardados no aparecen en el sitio público hasta reconstruirlo.
          </p>
          {statusLine && <p className="mt-2 text-sm">{statusLine}</p>}
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

      {build?.status === 'error' && build.log?.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowLog((v) => !v)}
            className="text-xs text-white/50 transition hover:text-white/80"
          >
            {showLog ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
          {showLog && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70">
              {build.log.join('\n')}
            </pre>
          )}
        </div>
      )}
    </section>
  )
}
