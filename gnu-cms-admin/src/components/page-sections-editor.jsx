import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData, updateSection, uploadMedia } from '../functions/fetch'

const SECTION_LABELS = {
  page_hero: 'Encabezado de página',
  feature_grid: 'Cuadrícula de características',
  rich_text: 'Texto enriquecido',
  clients_showcase: 'Clientes',
}

const DEFAULT_CONTENT = {
  page_hero: { title: '', subtitle: '', image: null },
  feature_grid: { title: '', items: [] },
  rich_text: { title: null, body: '', video_url: null },
  clients_showcase: { title: '', logos: [] },
}

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
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-white/5 text-sm text-white/40">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <span>{uploading ? 'Subiendo…' : 'Sin imagen'}</span>
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
      </Field>
      {items.map((item, i) => (
        <DynamicItem key={i} title={`Tarjeta ${i + 1}`} onRemove={() => removeItem(i)}>
          <ImageField
            label="Icono"
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
            </Field>
            <Field label="Texto" error={fieldError(errors, `content.items.${i}.text`)}>
              <input
                type="text"
                value={item.text ?? ''}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                className={inputClass}
              />
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
        </Field>
        <Field label="Subtítulo" error={fieldError(errors, 'content.subtitle')}>
          <input
            type="text"
            value={content.subtitle ?? ''}
            onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <ImageField
        label="Imagen"
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
      </Field>
      <Field label="Contenido (HTML)" hint="Se guarda tal como se escribe." error={fieldError(errors, 'content.body')}>
        <textarea
          rows={5}
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

const SECTION_EDITORS = {
  page_hero: PageHeroEditor,
  feature_grid: FeatureGridEditor,
  rich_text: RichTextEditor,
  clients_showcase: ClientsShowcaseEditor,
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

function CreateSectionForm({ onCreated }) {
  const [id, setId] = useState('')
  const [type, setType] = useState(Object.keys(SECTION_LABELS)[0])
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState({ message: '', error: false })

  async function handleCreate(event) {
    event.preventDefault()
    if (!id) return

    setCreating(true)
    setStatus({ message: '', error: false })

    const res = await updateSection(id, DEFAULT_CONTENT[type] ?? {})

    setCreating(false)

    if (res?.status === 'success') {
      onCreated(res.data)
      setId('')
      setStatus({ message: res.meta?.message ?? 'Sección creada correctamente', error: false })
    } else {
      setStatus({ message: res?.meta?.message ?? res?.message ?? 'No se pudo crear la sección.', error: true })
    }
  }

  return (
    <form
      onSubmit={handleCreate}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4"
    >
      <div className="w-28">
        <Field label="ID" hint="Id reservado.">
          <input
            type="number"
            min="1"
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="w-56">
        <Field label="Tipo">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {Object.keys(SECTION_LABELS).map((key) => (
              <option key={key} value={key}>
                {SECTION_LABELS[key]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <button
        type="submit"
        disabled={creating}
        className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
      >
        {creating ? 'Creando…' : '+ Crear sección'}
      </button>
      {status.message && (
        <span className={`text-sm ${status.error ? 'text-rose-400' : 'text-emerald-300'}`}>{status.message}</span>
      )}
    </form>
  )
}

export default function PageSectionsEditor({ site = 'gnu', page, title, backTo }) {
  const [sections, setSections] = useState([])
  const [total, setTotal] = useState(0)
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
  }, [site, page])

  function handleUpdated(updatedSection) {
    setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? updatedSection : s)))
  }

  function handleCreated(newSection) {
    setSections((prev) => {
      if (prev.some((s) => s.id === newSection.id)) {
        return prev.map((s) => (s.id === newSection.id ? newSection : s))
      }
      const next = [...prev, newSection].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      setTotal(next.length)
      return next
    })
  }

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

        {loading && <p className="text-sm text-white/60">Cargando secciones…</p>}
        {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

        {!loading && !error && (
          <div className="space-y-4">
            {sections.length === 0 && (
              <p className="text-sm text-white/50">No hay secciones para esta página.</p>
            )}
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} onUpdated={handleUpdated} />
            ))}
            <CreateSectionForm onCreated={handleCreated} />
          </div>
        )}
      </div>
    </main>
  )
}
