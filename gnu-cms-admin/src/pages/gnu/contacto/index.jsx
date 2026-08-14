import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { fetchData } from '../../../functions/fetch'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = { lat: 25.6714, lng: -100.3094 }
const SITE_ID = 1

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#863bff]'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

function StationMapPicker({ latitude, longitude, onPick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    const map = L.map(containerRef.current).setView([latitude, longitude], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    map.on('click', (event) => {
      onPick(event.latlng.lat, event.latlng.lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude])
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(map)
    }
  }, [latitude, longitude])

  return <div ref={containerRef} className="h-72 w-full rounded-xl" />
}

function StationForm() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState(DEFAULT_CENTER.lat)
  const [longitude, setLongitude] = useState(DEFAULT_CENTER.lng)
  const [phone, setPhone] = useState('')
  const [schedule, setSchedule] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [logged, setLogged] = useState(null)

  function handlePick(lat, lng) {
    setLatitude(lat)
    setLongitude(lng)
  }

  function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      site_id: SITE_ID,
      name,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      phone: phone || null,
      schedule: schedule || null,
      is_active: isActive,
    }

    console.log('Nueva estación', payload)
    setLogged(payload)
  }

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold">Agregar estación</h2>
      <p className="mt-1 text-sm text-white/60">Haz clic en el mapa para ubicar la estación.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <StationMapPicker latitude={latitude} longitude={longitude} onPick={handlePick} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">
              Nombre<span className="ml-1 text-rose-400">*</span>
            </span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">
              Dirección<span className="ml-1 text-rose-400">*</span>
            </span>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Latitud</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Longitud</span>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Teléfono</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Horario</span>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/80">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ accentColor: '#863bff' }}
              className="h-4 w-4"
            />
            Estación activa
          </label>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110"
          >
            Guardar estación
          </button>
        </form>
      </div>

      {logged && (
        <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70">
          {JSON.stringify(logged, null, 2)}
        </pre>
      )}
    </div>
  )
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

        <StationForm />
      </div>
    </main>
  )
}
