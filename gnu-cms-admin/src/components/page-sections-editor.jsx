import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { fetchData, updateSection } from '../functions/fetch'
import {
  inputClass,
  fieldError,
  Field,
  CharHint,
  ImageField,
  DynamicItem,
  AddButton,
  updateArrayItem,
} from './form-fields'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_MAP_CENTER = { lat: 25.6714, lng: -100.3094 }

const SECTION_LABELS = {
  page_hero: 'Encabezado de página',
  feature_grid: 'Cuadrícula de características',
  rich_text: 'Texto enriquecido',
  clients_showcase: 'Clientes',
  stations_map: 'Mapa de estaciones',
}

function parseCenter(center) {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(center ?? '')
  if (!match) return null
  return { lat: Number(match[1]), lng: Number(match[2]) }
}

function FeatureGridEditor({ content, onChange, errors }) {
  const items = content.items ?? []

  function updateItem(i, key, value) {
    onChange({ ...content, items: updateArrayItem(items, i, key, value) })
  }

  function addItem() {
    onChange({ ...content, items: [...items, { icon: null, title: '', text: '' }] })
  }

  function removeItem(i) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Título de la sección" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      {items.map((item, i) => (
        <DynamicItem key={i} title={`Tarjeta ${i + 1}`} onRemove={() => removeItem(i)}>
          <ImageField
            label="Icono"
            hint="96×96 px (cuadrado 1:1) · PNG con fondo transparente · máx. 5 MB, ideal menos de 50 KB. Es un glifo simple, se muestra muy pequeño (24×24 px)."
            value={item.icon}
            onChange={(value) => updateItem(i, 'icon', value)}
            error={fieldError(errors, `content.items.${i}.icon`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" required error={fieldError(errors, `content.items.${i}.title`)}>
              <input
                type="text"
                value={item.title ?? ''}
                onChange={(e) => updateItem(i, 'title', e.target.value)}
                className={inputClass}
              />
              <CharHint value={item.title} recommended={30} max={40} />
            </Field>
            <Field label="Texto" error={fieldError(errors, `content.items.${i}.text`)}>
              <input
                type="text"
                value={item.text ?? ''}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                className={inputClass}
              />
              <CharHint value={item.text} recommended={140} max={180} />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addItem}>+ Agregar tarjeta</AddButton>
    </div>
  )
}

function ClientsShowcaseEditor({ content, onChange, errors }) {
  const logos = content.logos ?? []

  function updateLogo(i, key, value) {
    onChange({ ...content, logos: updateArrayItem(logos, i, key, value) })
  }

  function addLogo() {
    onChange({ ...content, logos: [...logos, { image: '', name: '', url: '' }] })
  }

  function removeLogo(i) {
    onChange({ ...content, logos: logos.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Título de la sección" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      {logos.map((logo, i) => (
        <DynamicItem key={i} title={`Cliente ${i + 1}`} onRemove={() => removeLogo(i)}>
          <ImageField
            label="Logo"
            hint="800×500 px (relación 16:10) · PNG con fondo transparente · máx. 5 MB, ideal menos de 300 KB."
            value={logo.image}
            onChange={(value) => updateLogo(i, 'image', value)}
            error={fieldError(errors, `content.logos.${i}.image`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required error={fieldError(errors, `content.logos.${i}.name`)}>
              <input
                type="text"
                value={logo.name ?? ''}
                onChange={(e) => updateLogo(i, 'name', e.target.value)}
                className={inputClass}
              />
              <CharHint value={logo.name} recommended={30} max={40} />
            </Field>
            <Field label="Enlace" error={fieldError(errors, `content.logos.${i}.url`)}>
              <input
                type="text"
                placeholder="https://…"
                value={logo.url ?? ''}
                onChange={(e) => updateLogo(i, 'url', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addLogo}>+ Agregar cliente</AddButton>
    </div>
  )
}

function PageHeroEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" required error={fieldError(errors, 'content.title')}>
          <input
            type="text"
            value={content.title ?? ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.title} recommended={40} max={55} />
        </Field>
        <Field label="Subtítulo" error={fieldError(errors, 'content.subtitle')}>
          <input
            type="text"
            value={content.subtitle ?? ''}
            onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.subtitle} recommended={90} max={110} />
        </Field>
      </div>
      <ImageField
        label="Imagen"
        hint="2400×900 px aprox. (relación 2.6:1) · JPG · máx. 5 MB, ideal menos de 1 MB. Se muestra oscurecida detrás del texto: usa tonos medios/oscuros para mantener el contraste."
        value={content.image}
        onChange={(value) => onChange({ ...content, image: value })}
        error={fieldError(errors, 'content.image')}
      />
    </div>
  )
}

function RichTextEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <Field label="Título" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value || null })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={50} max={70} />
      </Field>
      <Field
        label="Contenido (HTML)"
        hint="Se guarda tal como se escribe. Recomendado 300-1500 caracteres (1-4 párrafos); el contenedor tiene un ancho máximo de ~736 px."
        error={fieldError(errors, 'content.body')}
      >
        <textarea
          rows={15}
          value={content.body ?? ''}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Video (URL)" error={fieldError(errors, 'content.video_url')}>
        <input
          type="text"
          placeholder="https://…"
          value={content.video_url ?? ''}
          onChange={(e) => onChange({ ...content, video_url: e.target.value || null })}
          className={inputClass}
        />
      </Field>
    </div>
  )
}

function StationsMapPicker({ latitude, longitude, onPick }) {
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
      markerRef.current = null
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

  return <div ref={containerRef} className="h-64 w-full rounded-xl" />
}

function StationsMapEditor({ content, onChange, errors }) {
  const parsed = parseCenter(content.center) ?? DEFAULT_MAP_CENTER

  function handlePick(lat, lng) {
    onChange({ ...content, center: `${lat.toFixed(6)},${lng.toFixed(6)}` })
  }

  const embedSrc = content.center
    ? `https://www.google.com/maps?q=${encodeURIComponent(content.center)}&z=${content.zoom || 12}&output=embed`
    : null

  return (
    <div className="space-y-4">
      <Field label="Título" error={fieldError(errors, 'content.title')}>
        <input
          type="text"
          value={content.title ?? ''}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.title} recommended={40} max={60} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Centro del mapa"
          hint="Dirección o coordenadas 'lat,lng'. Puedes escribirlo o hacer clic en el mapa de abajo."
          error={fieldError(errors, 'content.center')}
        >
          <input
            type="text"
            placeholder="25.671400,-100.309400"
            value={content.center ?? ''}
            onChange={(e) => onChange({ ...content, center: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Zoom" hint="10-14 es un buen valor para una ciudad" error={fieldError(errors, 'content.zoom')}>
          <input
            type="number"
            min="1"
            max="20"
            value={content.zoom ?? ''}
            onChange={(e) => onChange({ ...content, zoom: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <div>
        <span className="mb-1 block text-sm text-white/70">
          Haz clic en el mapa para ubicar el centro
        </span>
        <StationsMapPicker latitude={parsed.lat} longitude={parsed.lng} onPick={handlePick} />
      </div>
      {embedSrc && (
        <div>
          <span className="mb-1 block text-sm text-white/70">Vista previa (como se ve en el sitio)</span>
          <iframe
            src={embedSrc}
            loading="lazy"
            title="Vista previa del mapa"
            className="h-56 w-full rounded-xl border border-white/10"
          />
        </div>
      )}
    </div>
  )
}

const SECTION_EDITORS = {
  page_hero: PageHeroEditor,
  feature_grid: FeatureGridEditor,
  rich_text: RichTextEditor,
  clients_showcase: ClientsShowcaseEditor,
  stations_map: StationsMapEditor,
}

function SectionCard({ section, onUpdated }) {
  const [content, setContent] = useState(section.content ?? {})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ message: '', error: false })

  const Editor = SECTION_EDITORS[section.type]

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setStatus({ message: '', error: false })

    const res = await updateSection(section.id, content)

    setSaving(false)

    if (res?.status === 'success') {
      setContent(res.data.content)
      setStatus({ message: res.meta?.message ?? 'Sección actualizada correctamente', error: false })
      onUpdated?.(res.data)
    } else if (res?.errors) {
      setErrors(res.errors)
      setStatus({ message: res.message ?? 'Revisa los campos marcados.', error: true })
    } else {
      setStatus({ message: res?.meta?.message ?? 'No se pudo actualizar la sección.', error: true })
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{SECTION_LABELS[section.type] ?? section.type}</h3>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/60">
          Posición {section.position}
        </span>
      </div>

      {Editor ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Editor content={content} onChange={setContent} errors={errors} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {status.message && (
              <span className={`text-sm ${status.error ? 'text-rose-400' : 'text-emerald-300'}`}>{status.message}</span>
            )}
          </div>
        </form>
      ) : (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70">
          {JSON.stringify(content, null, 2)}
        </pre>
      )}
    </div>
  )
}

// Headless: the section cards, without page chrome (header/back link).
// Lets a host page (e.g. the Contacto admin page) embed section editing inline
// alongside its own content instead of duplicating a "Back" link and title.
export function SectionsFields({ site = 'gnu', page, onTotalChange }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSections() {
      setLoading(true)
      setError('')

      const query = page
        ? `/api/admin/sections?site=${site}&page=${page}`
        : `/api/admin/sections?site=${site}`
      const res = await fetchData(query)

      if (cancelled) return

      if (res?.status === 'success') {
        setSections(res.data)
        onTotalChange?.(res.meta?.total ?? res.data.length)
      } else {
        setError('No se pudieron cargar las secciones.')
      }

      setLoading(false)
    }

    loadSections()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, page])

  function handleUpdated(updatedSection) {
    setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  if (loading) return <p className="text-sm text-white/60">Cargando secciones…</p>
  if (error) return <p className="text-sm text-rose-400">{error}</p>

  return (
    <div className="space-y-4">
      {sections.length === 0 && <p className="text-sm text-white/50">No hay secciones para esta página.</p>}
      {sections.map((section) => (
        <SectionCard key={section.id} section={section} onUpdated={handleUpdated} />
      ))}
    </div>
  )
}

export default function PageSectionsEditor({ site = 'gnu', page, title, backTo }) {
  const [total, setTotal] = useState(0)

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to={backTo} className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-white/60">
            Secciones editables
            {total > 0 && <span className="text-white/40"> · {total} secciones</span>}
          </p>
        </header>

        <SectionsFields site={site} page={page} onTotalChange={setTotal} />
      </div>
    </main>
  )
}
