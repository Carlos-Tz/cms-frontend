import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'

const STORAGE_PREFIX = 'cms-content:'
const PARAGRAPH_COUNT = 6

const SITE_OPTIONS = [
  { value: 'gnu', label: 'Página web GNU', path: '/gnu' },
  { value: 'gas-natural', label: 'Gas natural vehicular', path: '/gas-natural' },
  { value: 'trainin', label: 'Trainnin logistic', path: '/trainin' },
  { value: 'tectuus', label: 'Tectuus', path: '/tectuus' },
]

const CARD_SECTIONS = [
  { value: 'servicios', label: 'Servicios / Productos' },
  { value: 'ubicaciones', label: 'Ubicaciones' },
  { value: 'blog', label: 'Blog' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'testimoniales', label: 'Testimoniales' },
]

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#863bff]'

function resolveSite(title) {
  const match = SITE_OPTIONS.find((option) => option.label === title)
  return match?.value ?? SITE_OPTIONS[0].value
}

function emptyBanner() {
  return { title: '', paragraph: '', ctaText: '', ctaUrl: '', imageSrc: null, imageAlt: '' }
}

function emptyCard() {
  return { section: CARD_SECTIONS[0].value, title: '', paragraph: '', linkText: '', imageSrc: null, imageAlt: '' }
}

function emptyForm(site) {
  return {
    site,
    siteName: '',
    pageTitle: '',
    metaDescription: '',
    primaryColor: '#1b6ac9',
    accentColor: '#56c1e8',
    paragraphs: Object.fromEntries(
      Array.from({ length: PARAGRAPH_COUNT }, (_, i) => [`paragraph${i + 1}`, '']),
    ),
    banners: [emptyBanner(), emptyBanner(), emptyBanner()],
    cards: [],
    aboutTitle: '',
    aboutParagraph1: '',
    aboutParagraph2: '',
    aboutImageSrc: null,
    aboutImageAlt: '',
    simulatorEnabled: false,
    simulatorTitle: '',
    simulatorParagraph: '',
    simulatorField1: '',
    simulatorField2: '',
    simulatorButton: '',
    simulatorResult: '',
    contactTitle: '',
    contactParagraph: '',
    contactEmail: '',
    contactPhone: '',
    contactBullets: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    youtube: '',
    footerText: '',
  }
}

function readImage(file, onLoad) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => onLoad(reader.result)
  reader.readAsDataURL(file)
}

function Section({ title, description, children }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <legend className="mb-1 text-xs font-semibold tracking-wide text-[#c9a3ff] uppercase">{title}</legend>
      {description && <p className="text-sm text-white/50">{description}</p>}
      {children}
    </fieldset>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-white/70">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/40">{hint}</span>}
    </label>
  )
}

function ParagraphSelect({ value, onChange }) {
  return (
    <select value={value} onChange={onChange} className={inputClass}>
      <option value="">— Sin párrafo —</option>
      {Array.from({ length: PARAGRAPH_COUNT }, (_, i) => (
        <option key={i} value={`paragraph${i + 1}`}>
          Párrafo {i + 1}
        </option>
      ))}
    </select>
  )
}

function ImageField({ label, imageSrc, imageAlt, onImageChange, onAltChange }) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-4">
      <span className="block text-sm text-white/70">{label}</span>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-white/5 text-sm text-white/40">
        {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : <span>Sin imagen</span>}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => readImage(e.target.files?.[0], onImageChange)}
        className="block w-full text-xs text-white/60"
      />
      <input
        type="text"
        value={imageAlt}
        onChange={(e) => onAltChange(e.target.value)}
        placeholder="Texto alternativo (alt)"
        className={inputClass}
      />
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

export default function EditPage() {
  const location = useLocation()
  const page = location.state?.page

  const [form, setForm] = useState(() => emptyForm(resolveSite(page?.title)))
  const [status, setStatus] = useState({ message: '', error: false })

  function loadSite(site) {
    const raw = localStorage.getItem(STORAGE_PREFIX + site)
    if (!raw) {
      setForm(emptyForm(site))
      setStatus({ message: `Sin contenido guardado para "${site}". Formulario en blanco.`, error: false })
      return
    }
    try {
      const data = JSON.parse(raw)
      setForm({ ...emptyForm(site), ...data, site })
      setStatus({ message: `Contenido de "${site}" cargado.`, error: false })
    } catch {
      setForm(emptyForm(site))
      setStatus({ message: 'Los datos guardados están dañados; se inicia en blanco.', error: true })
    }
  }

  useEffect(() => {
    loadSite(resolveSite(page?.title))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function updateParagraph(key, value) {
    setForm((f) => ({ ...f, paragraphs: { ...f.paragraphs, [key]: value } }))
  }

  function updateListItem(listName, index, key, value) {
    setForm((f) => {
      const list = [...f[listName]]
      list[index] = { ...list[index], [key]: value }
      return { ...f, [listName]: list }
    })
  }

  function addListItem(listName, factory) {
    setForm((f) => ({ ...f, [listName]: [...f[listName], factory()] }))
  }

  function removeListItem(listName, index) {
    setForm((f) => ({ ...f, [listName]: f[listName].filter((_, i) => i !== index) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!e.target.reportValidity()) return
    try {
      localStorage.setItem(STORAGE_PREFIX + form.site, JSON.stringify({ ...form, updatedAt: new Date().toISOString() }))
      setStatus({ message: `Contenido de "${form.site}" guardado correctamente ✓`, error: false })
    } catch {
      setStatus({
        message: 'No se pudo guardar: las imágenes exceden el espacio disponible. Usa imágenes más ligeras o exporta a JSON.',
        error: true,
      })
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${form.site}-content.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setStatus({ message: 'JSON exportado ✓', error: false })
  }

  function handleReset() {
    if (!window.confirm(`¿Borrar el contenido guardado de "${form.site}"?`)) return
    localStorage.removeItem(STORAGE_PREFIX + form.site)
    setForm(emptyForm(form.site))
    setStatus({ message: 'Formulario restablecido.', error: false })
  }

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link to="/home" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{page?.title ?? 'Panel de administración'}</h1>
          <p className="mt-1 text-sm text-white/60">
            {page?.subtitle ?? 'Captura el contenido de las páginas GNU, Gas Natural Vehicular, Trainnin Logistic y Tectuus.'}
          </p>
        </header>

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <Section title="Identidad y apariencia">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del sitio (logo)" required>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="Ej. Trainnin Logistic"
                  value={form.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Título de la página (SEO)" required hint={`${form.pageTitle.length}/70 caracteres`}>
                <input
                  type="text"
                  required
                  maxLength={70}
                  placeholder="Ej. Gas natural vehicular"
                  value={form.pageTitle}
                  onChange={(e) => updateField('pageTitle', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field
              label="Meta descripción (SEO)"
              required
              hint={`${form.metaDescription.length}/160 caracteres — ideal entre 120 y 160`}
            >
              <textarea
                required
                maxLength={160}
                rows={2}
                placeholder="Descripción breve para los resultados de búsqueda (máx. 160 caracteres)"
                value={form.metaDescription}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Color primario">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-white/15 bg-white/5 p-1"
                />
              </Field>
              <Field label="Color de acento">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-white/15 bg-white/5 p-1"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Párrafos reutilizables"
            description="Textos que se repiten en banners, tarjetas y secciones. Escríbelos una vez aquí y selecciónalos por número en cada elemento."
          >
            {Object.keys(form.paragraphs).map((key, i) => (
              <Field key={key} label={`Párrafo ${i + 1}`}>
                <textarea
                  rows={2}
                  value={form.paragraphs[key]}
                  onChange={(e) => updateParagraph(key, e.target.value)}
                  className={inputClass}
                />
              </Field>
            ))}
          </Section>

          <Section
            title="Carrusel de banners"
            description="Cada banner tiene imagen de fondo, título, un párrafo reutilizable y su botón (CTA)."
          >
            <div className="space-y-4">
              {form.banners.map((banner, i) => (
                <DynamicItem key={i} title={`Banner ${i + 1}`} onRemove={() => removeListItem('banners', i)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Título">
                      <input
                        type="text"
                        placeholder="Ej. Convierte tu auto a Gas Natural"
                        value={banner.title}
                        onChange={(e) => updateListItem('banners', i, 'title', e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Párrafo">
                      <ParagraphSelect
                        value={banner.paragraph}
                        onChange={(e) => updateListItem('banners', i, 'paragraph', e.target.value)}
                      />
                    </Field>
                    <Field label="Texto del botón (CTA)">
                      <input
                        type="text"
                        placeholder="Ej. Cotiza tu equipo"
                        value={banner.ctaText}
                        onChange={(e) => updateListItem('banners', i, 'ctaText', e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Enlace del botón">
                      <input
                        type="text"
                        placeholder="#contacto o https://…"
                        value={banner.ctaUrl}
                        onChange={(e) => updateListItem('banners', i, 'ctaUrl', e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <ImageField
                    label="Imagen del banner"
                    imageSrc={banner.imageSrc}
                    imageAlt={banner.imageAlt}
                    onImageChange={(dataUrl) => updateListItem('banners', i, 'imageSrc', dataUrl)}
                    onAltChange={(value) => updateListItem('banners', i, 'imageAlt', value)}
                  />
                </DynamicItem>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addListItem('banners', emptyBanner)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              + Agregar banner
            </button>
          </Section>

          <Section
            title="Tarjetas de contenido"
            description="Tarjetas de las secciones de cada página: servicios/productos, ubicaciones, blog, clientes y testimoniales."
          >
            <div className="space-y-4">
              {form.cards.map((card, i) => (
                <DynamicItem key={i} title={`Tarjeta ${i + 1}`} onRemove={() => removeListItem('cards', i)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Sección">
                      <select
                        value={card.section}
                        onChange={(e) => updateListItem('cards', i, 'section', e.target.value)}
                        className={inputClass}
                      >
                        {CARD_SECTIONS.map((section) => (
                          <option key={section.value} value={section.value}>
                            {section.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Título">
                      <input
                        type="text"
                        placeholder="Ej. Transporte de GNC"
                        value={card.title}
                        onChange={(e) => updateListItem('cards', i, 'title', e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Párrafo">
                      <ParagraphSelect
                        value={card.paragraph}
                        onChange={(e) => updateListItem('cards', i, 'paragraph', e.target.value)}
                      />
                    </Field>
                    <Field label="Texto del enlace">
                      <input
                        type="text"
                        placeholder="Ej. Más información"
                        value={card.linkText}
                        onChange={(e) => updateListItem('cards', i, 'linkText', e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <ImageField
                    label="Imagen de la tarjeta"
                    imageSrc={card.imageSrc}
                    imageAlt={card.imageAlt}
                    onImageChange={(dataUrl) => updateListItem('cards', i, 'imageSrc', dataUrl)}
                    onAltChange={(value) => updateListItem('cards', i, 'imageAlt', value)}
                  />
                </DynamicItem>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addListItem('cards', emptyCard)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              + Agregar tarjeta
            </button>
          </Section>

          <Section title="Sobre nosotros">
            <Field label="Título de la sección">
              <input
                type="text"
                placeholder="Ej. ¿Quiénes somos?"
                value={form.aboutTitle}
                onChange={(e) => updateField('aboutTitle', e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primer párrafo">
                <ParagraphSelect value={form.aboutParagraph1} onChange={(e) => updateField('aboutParagraph1', e.target.value)} />
              </Field>
              <Field label="Segundo párrafo">
                <ParagraphSelect value={form.aboutParagraph2} onChange={(e) => updateField('aboutParagraph2', e.target.value)} />
              </Field>
            </div>
            <ImageField
              label="Imagen de la sección"
              imageSrc={form.aboutImageSrc}
              imageAlt={form.aboutImageAlt}
              onImageChange={(dataUrl) => updateField('aboutImageSrc', dataUrl)}
              onAltChange={(value) => updateField('aboutImageAlt', value)}
            />
          </Section>

          <Section title="Simulador de ahorro">
            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
              <input
                type="checkbox"
                checked={form.simulatorEnabled}
                onChange={(e) => updateField('simulatorEnabled', e.target.checked)}
                style={{ accentColor: '#863bff' }}
                className="h-4 w-4"
              />
              Esta página incluye simulador de ahorro (Gas Natural Vehicular y Trainnin)
            </label>
            <div className={form.simulatorEnabled ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 opacity-40 pointer-events-none sm:grid-cols-2'}>
              <Field label="Título">
                <input
                  type="text"
                  placeholder="Ej. Simulador de ahorro"
                  value={form.simulatorTitle}
                  onChange={(e) => updateField('simulatorTitle', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Párrafo de introducción">
                <ParagraphSelect value={form.simulatorParagraph} onChange={(e) => updateField('simulatorParagraph', e.target.value)} />
              </Field>
              <Field label="Etiqueta del campo 1">
                <input
                  type="text"
                  placeholder="Ej. Gasto semanal en gasolina (MXN)"
                  value={form.simulatorField1}
                  onChange={(e) => updateField('simulatorField1', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Etiqueta del campo 2">
                <input
                  type="text"
                  placeholder="Ej. Kilómetros recorridos por semana"
                  value={form.simulatorField2}
                  onChange={(e) => updateField('simulatorField2', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Texto del botón">
                <input
                  type="text"
                  placeholder="Ej. Calcular mi ahorro"
                  value={form.simulatorButton}
                  onChange={(e) => updateField('simulatorButton', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Texto del resultado">
                <input
                  type="text"
                  placeholder="Ej. Ahorro estimado: 50%"
                  value={form.simulatorResult}
                  onChange={(e) => updateField('simulatorResult', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Contacto y captación de leads">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título de la sección">
                <input
                  type="text"
                  placeholder="Ej. Contacto"
                  value={form.contactTitle}
                  onChange={(e) => updateField('contactTitle', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Párrafo de introducción">
                <ParagraphSelect value={form.contactParagraph} onChange={(e) => updateField('contactParagraph', e.target.value)} />
              </Field>
              <Field label="Correo de contacto">
                <input
                  type="email"
                  placeholder="hola@ejemplo.com"
                  value={form.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={form.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Puntos de la lista (uno por línea)">
              <textarea
                rows={3}
                placeholder={'Captación de leads\nFacturación\nAgenda tu verificación'}
                value={form.contactBullets}
                onChange={(e) => updateField('contactBullets', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Número de WhatsApp (botón flotante — contacto directo MKT)" hint="Solo dígitos con código de país; se usa en el enlace wa.me.">
              <input
                type="tel"
                placeholder="5215500000000"
                value={form.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Redes sociales y pie de página">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Facebook">
                <input
                  type="url"
                  placeholder="https://facebook.com/…"
                  value={form.facebook}
                  onChange={(e) => updateField('facebook', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Instagram">
                <input
                  type="url"
                  placeholder="https://instagram.com/…"
                  value={form.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="YouTube">
                <input
                  type="url"
                  placeholder="https://youtube.com/…"
                  value={form.youtube}
                  onChange={(e) => updateField('youtube', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Texto del pie de página">
                <input
                  type="text"
                  placeholder="© 2026 Tectuus. Todos los derechos reservados."
                  value={form.footerText}
                  onChange={(e) => updateField('footerText', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110"
            >
              Guardar contenido
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-400/70"
            >
              Restablecer sitio actual
            </button>
          </div>

          <p role="status" aria-live="polite" className={`text-sm font-medium ${status.error ? 'text-rose-300' : 'text-emerald-300'}`}>
            {status.message}
          </p>
        </form>
      </div>
    </main>
  )
}
