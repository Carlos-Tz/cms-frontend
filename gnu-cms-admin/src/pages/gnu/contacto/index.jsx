import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData } from '../../../functions/fetch'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Contacto() {
  const [leads, setLeads] = useState([])
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, last_page: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadLeads() {
      setLoading(true)
      setError('')

      const res = await fetchData(`/api/admin/leads?site=gnu&page=${page}`)

      if (cancelled) return

      if (res?.status === 'success') {
        setLeads(res.data)
        setMeta(res.meta ?? { page, per_page: res.data.length, total: res.data.length, last_page: 1 })
      } else {
        setError('No se pudieron cargar los mensajes.')
      }

      setLoading(false)
    }

    loadLeads()

    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link to="/gnu/select-page" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Contacto — Sitio GNU</h1>
          <p className="mt-1 text-sm text-white/60">
            Mensajes recibidos desde el formulario de contacto.
            {meta.total > 0 && <span className="text-white/40"> · {meta.total} en total</span>}
          </p>
        </header>

        {loading && <p className="text-sm text-white/60">Cargando mensajes…</p>}
        {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            {leads.length === 0 ? (
              <p className="text-sm text-white/50">No hay mensajes todavía.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Teléfono</th>
                      <th className="px-4 py-3 font-medium">Mensaje</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 text-white">{lead.name}</td>
                        <td className="px-4 py-3 text-white/70">{lead.email}</td>
                        <td className="px-4 py-3 text-white/70">{lead.phone}</td>
                        <td className="px-4 py-3 text-white/70">{lead.message}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white/40">{formatDate(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {meta.last_page > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-white/60">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-full border border-white/15 px-4 py-2 font-medium text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                >
                  Anterior
                </button>
                <span>
                  Página {meta.page} de {meta.last_page}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page >= meta.last_page}
                  className="rounded-full border border-white/15 px-4 py-2 font-medium text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
