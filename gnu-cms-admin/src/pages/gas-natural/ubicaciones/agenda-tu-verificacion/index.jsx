import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData, deleteAppointment } from '../../../../functions/fetch'
import { SectionsFields } from '../../../../components/page-sections-editor'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function stationName(appointment) {
  return appointment.station?.name ?? appointment.station_name ?? `Estación ${appointment.station_id}`
}

export default function AgendaTuVerificacion() {
  const [appointments, setAppointments] = useState([])
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, last_page: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelingId, setCancelingId] = useState(null)
  const [sectionsTotal, setSectionsTotal] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadAppointments() {
      setLoading(true)
      setError('')

      const res = await fetchData(`/api/admin/appointments?site=gnu-vehicular&page=${page}`)

      if (cancelled) return

      if (res?.status === 'success') {
        setAppointments(res.data)
        setMeta(res.meta ?? { page, per_page: res.data.length, total: res.data.length, last_page: 1 })
      } else {
        setError('No se pudieron cargar las citas.')
      }

      setLoading(false)
    }

    loadAppointments()

    return () => {
      cancelled = true
    }
  }, [page])

  async function handleCancel(appointment) {
    if (!window.confirm(`¿Cancelar la cita de ${appointment.name} el ${formatDate(appointment.date)}?`)) return

    setCancelingId(appointment.id)
    const res = await deleteAppointment(appointment.id)
    setCancelingId(null)

    if (res?.status === 'success') {
      setAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
    } else {
      alert(res?.meta?.message ?? 'No se pudo cancelar la cita.')
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link to="/gas-natural/ubicaciones" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Agenda tu verificación</h1>
          <p className="mt-1 text-sm text-white/60">
            Citas reservadas por visitantes.
            {meta.total > 0 && <span className="text-white/40"> · {meta.total} en total</span>}
          </p>
        </header>

        {loading && <p className="text-sm text-white/60">Cargando citas…</p>}
        {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

        {!loading && !error && (
          <>
            {appointments.length === 0 ? (
              <p className="text-sm text-white/50">No hay citas todavía.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Horario</th>
                      <th className="px-4 py-3 font-medium">Estación</th>
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Contacto</th>
                      <th className="px-4 py-3 font-medium">Vehículo</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap text-white">{formatDate(appointment.date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white/70">{appointment.slot}</td>
                        <td className="px-4 py-3 text-white/70">{stationName(appointment)}</td>
                        <td className="px-4 py-3 text-white/70">{appointment.name}</td>
                        <td className="px-4 py-3 text-white/70">
                          <div>{appointment.email}</div>
                          <div className="text-white/40">{appointment.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          <div>{appointment.vehicle_plate}</div>
                          <div className="text-white/40">{appointment.vehicle_description}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleCancel(appointment)}
                            disabled={cancelingId === appointment.id}
                            className="rounded-full border border-rose-400/40 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:border-rose-400/70 disabled:opacity-60"
                          >
                            {cancelingId === appointment.id ? 'Cancelando…' : 'Cancelar'}
                          </button>
                        </td>
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

        <section className="mt-10">
          <header className="mb-4">
            <h2 className="text-lg font-semibold">Secciones de la página</h2>
            <p className="mt-1 text-sm text-white/60">
              Encabezado y textos del widget de reserva. Los horarios no se editan aquí: viven en el código.
              {sectionsTotal > 0 && <span className="text-white/40"> · {sectionsTotal} secciones</span>}
            </p>
          </header>
          <SectionsFields site="gnu-vehicular" page="agenda-tu-verificacion" onTotalChange={setSectionsTotal} />
        </section>
      </div>
    </main>
  )
}
