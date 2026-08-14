import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData, updateSection, uploadMedia } from '../../../functions/fetch'

const SECTION_LABELS = {
  banner_carousel: 'Carrusel de banners',
  savings_simulator: 'Simulador de ahorro',
  clients_showcase: 'Clientes',
  lead_capture_form: 'Formulario de contacto',
  contact_info: 'Datos de contacto',
  social_icons: 'Redes sociales',
  whatsapp_button: 'Botón de WhatsApp',
}

const NETWORK_OPTIONS = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#863bff]'

const buttonSecondaryClass =
  'rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white'

function fieldError(errors, path) {
  const messages = errors?.[path]
  return Array.isArray(messages) ? messages[0] : undefined
}

function Field({ label, required, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-white/70">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-white/40">{hint}</span>
      ) : null}
    </label>
  )
}

function ImageField({ label, value, onChange, error }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setUploading(true)
    const res = await uploadMedia(file)
    setUploading(false)
    if (res?.status === 'success') {
      onChange(res.data.url)
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-4">
      <span className="block text-sm text-white/70">{label}</span>
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg bg-white/5 text-sm text-white/40">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>Sin imagen</span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-90"
              />
            </svg>
            <span className="text-xs">Subiendo…</span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="block w-full text-xs text-white/60"
      />
      {error && <span className="block text-xs text-rose-400">{error}</span>}
    </div>
  )
}

function DynamicItem({ title, onRemove, children }) {
  return (
    <div className="space-y-4 rounded-xl border border-dashed border-white/15 p-4">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#c9a3ff]">{title}</strong>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-medium text-rose-300 transition hover:border-rose-400/70"
        >
          Eliminar
        </button>
      </div>
      {children}
    </div>
  )
}

function AddButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={buttonSecondaryClass}>
      {children}
    </button>
  )
}

function updateArrayItem(list, index, key, value) {
  const next = [...list]
  next[index] = { ...next[index], [key]: value }
  return next
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
            </Field>
            <Field label="Subtítulo" error={fieldError(errors, `content.slides.${i}.subtitle`)}>
              <input
                type="text"
                value={slide.subtitle ?? ''}
                onChange={(e) => updateSlide(i, 'subtitle', e.target.value)}
                className={inputClass}
              />
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
            <Field label="Texto del botón" error={fieldError(errors, `content.slides.${i}.link_label`)}>
              <input
                type="text"
                value={slide.link_label ?? ''}
                onChange={(e) => updateSlide(i, 'link_label', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addSlide}>+ Agregar banner</AddButton>
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
      </Field>
      {logos.map((logo, i) => (
        <DynamicItem key={i} title={`Cliente ${i + 1}`} onRemove={() => removeLogo(i)}>
          <ImageField
            label="Logo"
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
        </Field>
        <Field label="Introducción" error={fieldError(errors, 'content.intro')}>
          <input
            type="text"
            value={content.intro ?? ''}
            onChange={(e) => onChange({ ...content, intro: e.target.value })}
            className={inputClass}
          />
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

function ContactInfoEditor({ content, onChange, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Dirección" required error={fieldError(errors, 'content.address')}>
        <input
          type="text"
          value={content.address ?? ''}
          onChange={(e) => onChange({ ...content, address: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Teléfono" required error={fieldError(errors, 'content.phone')}>
        <input
          type="tel"
          value={content.phone ?? ''}
          onChange={(e) => onChange({ ...content, phone: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Correo" required error={fieldError(errors, 'content.email')}>
        <input
          type="email"
          value={content.email ?? ''}
          onChange={(e) => onChange({ ...content, email: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Horario" error={fieldError(errors, 'content.schedule')}>
        <input
          type="text"
          value={content.schedule ?? ''}
          onChange={(e) => onChange({ ...content, schedule: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Información adicional" error={fieldError(errors, 'content.additional_info')}>
          <textarea
            rows={2}
            value={content.additional_info ?? ''}
            onChange={(e) => onChange({ ...content, additional_info: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  )
}

function SocialIconsEditor({ content, onChange, errors }) {
  const networks = content.networks ?? []

  function updateNetwork(i, key, value) {
    onChange({ ...content, networks: updateArrayItem(networks, i, key, value) })
  }

  function addNetwork() {
    onChange({ ...content, networks: [...networks, { network: NETWORK_OPTIONS[0], url: '' }] })
  }

  function removeNetwork(i) {
    onChange({ ...content, networks: networks.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      {networks.map((item, i) => (
        <DynamicItem key={i} title={`Red ${i + 1}`} onRemove={() => removeNetwork(i)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Red social" error={fieldError(errors, `content.networks.${i}.network`)}>
              <select
                value={item.network ?? NETWORK_OPTIONS[0]}
                onChange={(e) => updateNetwork(i, 'network', e.target.value)}
                className={inputClass}
              >
                {NETWORK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Enlace" required error={fieldError(errors, `content.networks.${i}.url`)}>
              <input
                type="text"
                placeholder="https://…"
                value={item.url ?? ''}
                onChange={(e) => updateNetwork(i, 'url', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </DynamicItem>
      ))}
      <AddButton onClick={addNetwork}>+ Agregar red social</AddButton>
    </div>
  )
}

function WhatsappButtonEditor({ content, onChange, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Teléfono" required hint="Con código de país, ej. 528100000000" error={fieldError(errors, 'content.phone')}>
        <input
          type="tel"
          value={content.phone ?? ''}
          onChange={(e) => onChange({ ...content, phone: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Mensaje prellenado" error={fieldError(errors, 'content.prefilled_message')}>
        <input
          type="text"
          value={content.prefilled_message ?? ''}
          onChange={(e) => onChange({ ...content, prefilled_message: e.target.value })}
          className={inputClass}
        />
      </Field>
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
        </Field>
        <Field label="Texto del botón" error={fieldError(errors, 'content.submit_label')}>
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
  clients_showcase: ClientsShowcaseEditor,
  savings_simulator: SavingsSimulatorEditor,
  contact_info: ContactInfoEditor,
  social_icons: SocialIconsEditor,
  whatsapp_button: WhatsappButtonEditor,
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
    </div>
  )
}

export default function EditableSections() {
  const [sections, setSections] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSections() {
      setLoading(true)
      setError('')

      const res = await fetchData('/api/admin/sections?site=gnu&page=inicio')

      if (cancelled) return

      if (res?.status === 'success') {
        setSections(res.data)
        setTotal(res.meta?.total ?? res.data.length)
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
        <Link to="/gnu/select-page" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Landing Page — Sitio GNU</h1>
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
      </div>
    </main>
  )
}
