import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData, updateSection } from '../../../functions/fetch'
import { GlobalSectionsFields, StationsMapEditor } from '../../../components/page-sections-editor'
import StationsEditor from '../../../components/stations-editor'
import {
  inputClass,
  fieldError,
  Field,
  CharHint,
  ImageField,
  DynamicItem,
  AddButton,
  updateArrayItem,
} from '../../../components/form-fields'

const SECTION_LABELS = {
  banner_carousel: 'Carrusel de banners',
  savings_simulator: 'Simulador de ahorro',
  feature_grid: 'Cuadrícula de características',
  testimonials: 'Testimonios',
  stations_map: 'Mapa de estaciones',
  lead_capture_form: 'Formulario de contacto',
}

function BannerCarouselEditor({ content, onChange, errors }) {
  const slides = content.slides ?? []

  function updateSlide(i, key, value) {
    onChange({ ...content, slides: updateArrayItem(slides, i, key, value) })
  }

  function addSlide() {
    onChange({
      ...content,
      slides: [...slides, { image: '', title: '', subtitle: '', link_url: '', link_label: '' }],
    })
  }

  function removeSlide(i) {
    onChange({ ...content, slides: slides.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <DynamicItem key={i} title={`Banner ${i + 1}`} onRemove={() => removeSlide(i)}>
          <ImageField
            label="Imagen"
            hint="2400×1000 px aprox. (relación 2.4:1) · JPG · máx. 5 MB, ideal menos de 1 MB. Se recorta a pantalla completa: evita texto o rostros cerca de los bordes."
            value={slide.image}
            onChange={(value) => updateSlide(i, 'image', value)}
            error={fieldError(errors, `content.slides.${i}.image`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" error={fieldError(errors, `content.slides.${i}.title`)}>
              <input
                type="text"
                value={slide.title ?? ''}
                onChange={(e) => updateSlide(i, 'title', e.target.value)}
                className={inputClass}
              />
              <CharHint value={slide.title} recommended={45} max={60} />
            </Field>
            <Field label="Subtítulo" error={fieldError(errors, `content.slides.${i}.subtitle`)}>
              <input
                type="text"
                value={slide.subtitle ?? ''}
                onChange={(e) => updateSlide(i, 'subtitle', e.target.value)}
                className={inputClass}
              />
              <CharHint value={slide.subtitle} recommended={90} max={120} />
            </Field>
            <Field label="Enlace del botón" error={fieldError(errors, `content.slides.${i}.link_url`)}>
              <input
                type="text"
                placeholder="https://…"
                value={slide.link_url ?? ''}
                onChange={(e) => updateSlide(i, 'link_url', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Texto del botón"
              hint="2-4 palabras, ej. 'Cotiza ahora'"
              error={fieldError(errors, `content.slides.${i}.link_label`)}
            >
              <input
                type="text"
                value={slide.link_label ?? ''}
                onChange={(e) => updateSlide(i, 'link_label', e.target.value)}
                className={inputClass}
              />
              <CharHint value={slide.link_label} recommended={20} max={25} />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addSlide}>+ Agregar banner</AddButton>
    </div>
  )
}

function SavingsSimulatorEditor({ content, onChange, errors }) {
  const fuelPrices = content.fuel_prices ?? []

  function updateFuel(i, key, value) {
    onChange({ ...content, fuel_prices: updateArrayItem(fuelPrices, i, key, value) })
  }

  function addFuel() {
    onChange({
      ...content,
      fuel_prices: [...fuelPrices, { fuel: '', label: '', price_per_unit: '', unit: '', equivalence_factor: '' }],
    })
  }

  function removeFuel(i) {
    onChange({ ...content, fuel_prices: fuelPrices.filter((_, idx) => idx !== i) })
  }

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
          <CharHint value={content.title} recommended={50} max={70} />
        </Field>
        <Field label="Introducción" error={fieldError(errors, 'content.intro')}>
          <input
            type="text"
            value={content.intro ?? ''}
            onChange={(e) => onChange({ ...content, intro: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.intro} recommended={120} max={160} />
        </Field>
      </div>
      {fuelPrices.map((fuel, i) => (
        <DynamicItem
          key={i}
          title={fuel.fuel === 'gas-natural' ? 'Gas natural (base del comparativo)' : `Combustible ${i + 1}`}
          onRemove={() => removeFuel(i)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" required hint="Identificador, ej. gas-natural" error={fieldError(errors, `content.fuel_prices.${i}.fuel`)}>
              <input
                type="text"
                value={fuel.fuel ?? ''}
                onChange={(e) => updateFuel(i, 'fuel', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Nombre visible" required error={fieldError(errors, `content.fuel_prices.${i}.label`)}>
              <input
                type="text"
                value={fuel.label ?? ''}
                onChange={(e) => updateFuel(i, 'label', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Precio por unidad" required error={fieldError(errors, `content.fuel_prices.${i}.price_per_unit`)}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fuel.price_per_unit ?? ''}
                onChange={(e) => updateFuel(i, 'price_per_unit', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Unidad" required error={fieldError(errors, `content.fuel_prices.${i}.unit`)}>
              <input
                type="text"
                placeholder="litro, m³…"
                value={fuel.unit ?? ''}
                onChange={(e) => updateFuel(i, 'unit', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Factor de equivalencia"
              required
              hint={fuel.fuel === 'gas-natural' ? 'Siempre 1 para gas natural' : 'm³ de gas natural equivalentes a 1 unidad'}
              error={fieldError(errors, `content.fuel_prices.${i}.equivalence_factor`)}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={fuel.equivalence_factor ?? ''}
                onChange={(e) => updateFuel(i, 'equivalence_factor', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addFuel}>+ Agregar combustible</AddButton>
    </div>
  )
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

function TestimonialsEditor({ content, onChange, errors }) {
  const items = content.items ?? []

  function updateItem(i, key, value) {
    onChange({ ...content, items: updateArrayItem(items, i, key, value) })
  }

  function addItem() {
    onChange({ ...content, items: [...items, { quote: '', author: '', role: null, photo: null }] })
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
        <DynamicItem key={i} title={`Testimonio ${i + 1}`} onRemove={() => removeItem(i)}>
          <ImageField
            label="Foto"
            hint="400×400 px (cuadrado 1:1) · JPG · máx. 5 MB, ideal menos de 200 KB."
            value={item.photo}
            onChange={(value) => updateItem(i, 'photo', value)}
            error={fieldError(errors, `content.items.${i}.photo`)}
          />
          <Field label="Cita" required error={fieldError(errors, `content.items.${i}.quote`)}>
            <textarea
              rows={3}
              value={item.quote ?? ''}
              onChange={(e) => updateItem(i, 'quote', e.target.value)}
              className={inputClass}
            />
            <CharHint value={item.quote} recommended={140} max={220} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Autor" required error={fieldError(errors, `content.items.${i}.author`)}>
              <input
                type="text"
                value={item.author ?? ''}
                onChange={(e) => updateItem(i, 'author', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Cargo / rol" error={fieldError(errors, `content.items.${i}.role`)}>
              <input
                type="text"
                value={item.role ?? ''}
                onChange={(e) => updateItem(i, 'role', e.target.value || null)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addItem}>+ Agregar testimonio</AddButton>
    </div>
  )
}

function LeadCaptureFormEditor({ content, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" error={fieldError(errors, 'content.title')}>
          <input
            type="text"
            value={content.title ?? ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            className={inputClass}
          />
          <CharHint value={content.title} recommended={40} max={60} />
        </Field>
        <Field label="Texto del botón" hint="2-4 palabras" error={fieldError(errors, 'content.submit_label')}>
          <input
            type="text"
            value={content.submit_label ?? ''}
            onChange={(e) => onChange({ ...content, submit_label: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Introducción" error={fieldError(errors, 'content.intro')}>
        <input
          type="text"
          value={content.intro ?? ''}
          onChange={(e) => onChange({ ...content, intro: e.target.value })}
          className={inputClass}
        />
        <CharHint value={content.intro} recommended={120} max={160} />
      </Field>
      {Array.isArray(content.fields) && (
        <p className="text-xs text-white/40">
          Campos del formulario (bloqueado): {content.fields.join(', ')}
        </p>
      )}
    </div>
  )
}

const SECTION_EDITORS = {
  banner_carousel: BannerCarouselEditor,
  savings_simulator: SavingsSimulatorEditor,
  feature_grid: FeatureGridEditor,
  testimonials: TestimonialsEditor,
  stations_map: StationsMapEditor,
  lead_capture_form: LeadCaptureFormEditor,
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

      {section.type === 'stations_map' && <StationsEditor site="gnu-vehicular" siteId={section.site_id} />}
    </div>
  )
}

export default function GasNaturalInicio() {
  const [sections, setSections] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSections() {
      setLoading(true)
      setError('')

      const res = await fetchData('/api/admin/sections?site=gnu-vehicular&page=inicio')

      if (cancelled) return

      if (res?.status === 'success') {
        // Site-wide sections are rendered separately by GlobalSectionsFields, so
        // they are dropped here whether or not the `page` filter let them through.
        const pageSections = res.data.filter((s) => s.page_id != null)
        setSections(pageSections)
        setTotal(pageSections.length)
      } else {
        setError('No se pudieron cargar las secciones.')
      }

      setLoading(false)
    }

    loadSections()

    return () => {
      cancelled = true
    }
  }, [])

  function handleUpdated(updatedSection) {
    setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to="/gas-natural/select-page" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Landing Page — Gas natural vehicular</h1>
          <p className="mt-1 text-sm text-white/60">
            Secciones editables
            {total > 0 && <span className="text-white/40"> · {total} secciones</span>}
          </p>
        </header>

        {loading && <p className="text-sm text-white/60">Cargando secciones…</p>}
        {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

        {!loading && !error && (
          <div className="space-y-4">
            {sections.length === 0 && (
              <p className="text-sm text-white/50">No hay secciones para este sitio.</p>
            )}
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} onUpdated={handleUpdated} />
            ))}
          </div>
        )}

        <GlobalSectionsFields site="gnu-vehicular" />
      </div>
    </main>
  )
}
