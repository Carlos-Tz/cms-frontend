import React, { useEffect, useState } from 'react'
import { createStation, deleteStation, fetchData, updateStation } from '../functions/fetch'
import { inputClass, fieldError, Field, CharHint, AddButton, buttonSecondaryClass } from './form-fields'
import MapPicker, { DEFAULT_MAP_CENTER } from './map-picker'

const EMPTY_STATION = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  phone: '',
  schedule: '',
  is_active: true,
}

// `GET /api/admin/stations` is paginated (20 per page): walk every page so a
// site with many stations still shows them all.
async function loadStations(site) {
  const stations = []
  let page = 1
  let lastPage = 1

  do {
    const res = await fetchData(`/api/admin/stations?site=${site}&page=${page}`)
    if (res?.status !== 'success') return null
    stations.push(...res.data)
    lastPage = res.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage)

  return stations
}

function toPayload(station) {
  return {
    name: station.name,
    address: station.address,
    latitude: station.latitude === '' ? null : Number(station.latitude),
    longitude: station.longitude === '' ? null : Number(station.longitude),
    phone: station.phone || null,
    schedule: station.schedule || null,
    is_active: Boolean(station.is_active),
  }
}

function StationCard({ station, siteId, onSaved, onDeleted, onDiscard }) {
  const isNew = station.id == null
  const [form, setForm] = useState({ ...EMPTY_STATION, ...station })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState({ message: '', error: false })

  const lat = Number(form.latitude)
  const lng = Number(form.longitude)
  const hasPoint = form.latitude !== '' && form.longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng)

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handlePick(pickedLat, pickedLng) {
    setForm((prev) => ({ ...prev, latitude: pickedLat.toFixed(6), longitude: pickedLng.toFixed(6) }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    setStatus({ message: '', error: false })

    const payload = toPayload(form)
    const res = isNew ? await createStation({ ...payload, site_id: siteId }) : await updateStation(station.id, payload)

    setBusy(false)

    if (res?.status === 'success') {
      setForm({ ...EMPTY_STATION, ...res.data })
      setStatus({ message: res.meta?.message ?? 'Estación guardada correctamente', error: false })
      onSaved(res.data)
    } else if (res?.errors) {
      setErrors(res.errors)
      setStatus({ message: res.message ?? 'Revisa los campos marcados.', error: true })
    } else {
      setStatus({ message: res?.meta?.message ?? 'No se pudo guardar la estación.', error: true })
    }
  }

  async function handleDelete() {
    if (isNew) {
      onDiscard()
      return
    }

    // Appointments cascade-delete with their station, so say so before it happens.
    const confirmed = window.confirm(
      `¿Eliminar «${station.name}»? También se borrarán las citas de verificación agendadas en esta estación. ` +
        'Si solo quieres ocultarla del sitio, desmarca «Activa» y guarda.',
    )
    if (!confirmed) return

    setBusy(true)
    const res = await deleteStation(station.id)
    setBusy(false)

    if (res?.status === 'success') {
      onDeleted(station.id)
    } else {
      setStatus({ message: res?.meta?.message ?? 'No se pudo eliminar la estación.', error: true })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-dashed border-white/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-[#c9a3ff]">{isNew ? 'Nueva estación' : station.name}</strong>
        <div className="flex items-center gap-3">
          {!isNew && (
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className={`h-2 w-2 rounded-full ${station.is_active ? 'bg-emerald-400' : 'bg-white/40'}`} />
              {station.is_active ? 'Visible en el sitio' : 'Oculta'}
            </span>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-medium text-rose-300 transition hover:border-rose-400/70 disabled:opacity-60"
          >
            {isNew ? 'Descartar' : 'Eliminar'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" required error={fieldError(errors, 'name')}>
          <input type="text" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className={inputClass} />
          <CharHint value={form.name} recommended={30} max={45} />
        </Field>
        <Field label="Dirección" required error={fieldError(errors, 'address')}>
          <input
            type="text"
            value={form.address ?? ''}
            onChange={(e) => set('address', e.target.value)}
            className={inputClass}
          />
          <CharHint value={form.address} recommended={60} max={90} />
        </Field>
        <Field label="Teléfono" error={fieldError(errors, 'phone')}>
          <input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Horario" hint="Ej. Lunes a sábado, 7:00 a 22:00" error={fieldError(errors, 'schedule')}>
          <input
            type="text"
            value={form.schedule ?? ''}
            onChange={(e) => set('schedule', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Latitud" required error={fieldError(errors, 'latitude')}>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={form.latitude ?? ''}
            onChange={(e) => set('latitude', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Longitud" required error={fieldError(errors, 'longitude')}>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={form.longitude ?? ''}
            onChange={(e) => set('longitude', e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <span className="mb-1 block text-sm text-white/70">Haz clic en el mapa para ubicar la estación</span>
        <MapPicker
          latitude={hasPoint ? lat : DEFAULT_MAP_CENTER.lat}
          longitude={hasPoint ? lng : DEFAULT_MAP_CENTER.lng}
          zoom={hasPoint ? 15 : 11}
          onPick={handlePick}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={Boolean(form.is_active)}
          onChange={(e) => set('is_active', e.target.checked)}
          className="h-4 w-4 accent-[#863bff]"
        />
        Activa (se muestra en el sitio público)
      </label>
      {fieldError(errors, 'is_active') && (
        <span className="block text-xs text-rose-400">{fieldError(errors, 'is_active')}</span>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Guardando…' : isNew ? 'Crear estación' : 'Guardar estación'}
        </button>
        {status.message && (
          <span className={`text-sm ${status.error ? 'text-rose-400' : 'text-emerald-300'}`}>{status.message}</span>
        )}
      </div>
    </form>
  )
}

// The location cards listed next to a `stations_map` section. They are rows of
// the `stations` table, not section content, so every map of a site shows the
// same list — editing it here changes it everywhere the map appears.
export default function StationsEditor({ site, siteId }) {
  const [stations, setStations] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      const data = await loadStations(site)
      if (cancelled) return
      if (data === null) setError('No se pudieron cargar las estaciones.')
      else setStations(data)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [site, open])

  function addDraft() {
    setDrafts((prev) => [...prev, { key: `draft-${Date.now()}` }])
  }

  function handleCreated(draftKey, created) {
    setDrafts((prev) => prev.filter((d) => d.key !== draftKey))
    setStations((prev) => [...prev, created])
  }

  function handleSaved(saved) {
    setStations((prev) => prev.map((s) => (s.id === saved.id ? saved : s)))
  }

  function handleDeleted(id) {
    setStations((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Estaciones (tarjetas junto al mapa)</h4>
          <p className="mt-1 text-xs text-white/50">
            Son las mismas en todos los mapas del sitio. Las inactivas no se muestran en el sitio público.
          </p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className={buttonSecondaryClass}>
          {open ? 'Ocultar estaciones' : 'Editar estaciones'}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {loading && <p className="text-sm text-white/60">Cargando estaciones…</p>}
          {!loading && error && <p className="text-sm text-rose-400">{error}</p>}
          {!loading && !error && (
            <>
              {stations.length === 0 && drafts.length === 0 && (
                <p className="text-sm text-white/50">Este sitio aún no tiene estaciones.</p>
              )}
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  siteId={siteId}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                />
              ))}
              {drafts.map((draft) => (
                <StationCard
                  key={draft.key}
                  station={EMPTY_STATION}
                  siteId={siteId}
                  onSaved={(created) => handleCreated(draft.key, created)}
                  onDiscard={() => setDrafts((prev) => prev.filter((d) => d.key !== draft.key))}
                />
              ))}
              {siteId != null ? (
                <AddButton onClick={addDraft}>+ Agregar estación</AddButton>
              ) : (
                <p className="text-xs text-white/40">No se pudo determinar el sitio para crear estaciones nuevas.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
