import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchData, createBlogPost, updateBlogPost, deleteBlogPost } from '../../../functions/fetch'
import { inputClass, buttonSecondaryClass, Field, CharHint, WordHint, ImageField } from '../../../components/form-fields'

const SITE_ID = 3

function emptyForm() {
  return { slug: '', title: '', excerpt: '', body: '', cover_image: '', published_at: '' }
}

function formatDate(value) {
  if (!value) return 'Sin publicar'
  return new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toApiDateTime(localValue) {
  if (!localValue) return null
  return `${localValue.replace('T', ' ')}:00`
}

function toDatetimeLocal(isoValue) {
  if (!isoValue) return ''
  return isoValue.slice(0, 16)
}

function PostCard({ post, onEdit, onDelete, deleting }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      {post.cover_image && (
        <div className="mb-3 h-32 overflow-hidden rounded-lg bg-white/5">
          <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <h3 className="text-base font-semibold text-white">{post.title}</h3>
      <p className="mt-1 text-sm text-white/60">{post.excerpt}</p>
      <p className="mt-3 text-xs text-white/40">{formatDate(post.published_at)}</p>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={onEdit} className={buttonSecondaryClass}>
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-400/70 disabled:opacity-60"
        >
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}

export default function TraininBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [formMode, setFormMode] = useState(null) // null | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [loadingPost, setLoadingPost] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formStatus, setFormStatus] = useState({ message: '', error: false })

  useEffect(() => {
    let cancelled = false

    async function loadPosts() {
      setLoading(true)
      setError('')

      const res = await fetchData('/api/admin/blog-posts?site=traninn-logistic&page=1')

      if (cancelled) return

      if (res?.status === 'success') {
        setPosts(res.data)
      } else {
        setError('No se pudieron cargar los artículos.')
      }

      setLoading(false)
    }

    loadPosts()

    return () => {
      cancelled = true
    }
  }, [])

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function openCreate() {
    setFormStatus({ message: '', error: false })
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm())
  }

  async function openEdit(post) {
    setFormStatus({ message: '', error: false })
    setFormMode('edit')
    setEditingId(post.id)
    setLoadingPost(true)

    const res = await fetchData(`/api/admin/blog-posts/${post.id}`)

    setLoadingPost(false)

    if (res?.status === 'success') {
      const data = res.data
      setForm({
        slug: data.slug ?? '',
        title: data.title ?? '',
        excerpt: data.excerpt ?? '',
        body: data.body ?? '',
        cover_image: data.cover_image ?? '',
        published_at: toDatetimeLocal(data.published_at),
      })
    } else {
      setFormStatus({ message: 'No se pudo cargar el artículo.', error: true })
      setFormMode(null)
      setEditingId(null)
    }
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyForm())
    setFormStatus({ message: '', error: false })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setFormStatus({ message: '', error: false })

    if (formMode === 'edit') {
      const res = await updateBlogPost(editingId, {
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        cover_image: form.cover_image || null,
        published_at: toApiDateTime(form.published_at),
      })

      setSaving(false)

      if (res?.status === 'success') {
        setPosts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)))
        closeForm()
      } else {
        setFormStatus({ message: res?.meta?.message ?? 'No se pudo actualizar el artículo.', error: true })
      }
    } else {
      const res = await createBlogPost({
        site_id: SITE_ID,
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        cover_image: form.cover_image || null,
        published_at: toApiDateTime(form.published_at),
      })

      setSaving(false)

      if (res?.status === 'success') {
        setPosts((prev) => [res.data, ...prev])
        closeForm()
      } else {
        setFormStatus({ message: res?.meta?.message ?? 'No se pudo crear el artículo.', error: true })
      }
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(post.id)
    const res = await deleteBlogPost(post.id)
    setDeletingId(null)

    if (res?.status === 'success') {
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
      if (editingId === post.id) closeForm()
    } else {
      alert(res?.meta?.message ?? 'No se pudo eliminar el artículo.')
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to="/trainin/select-page" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Blog — Trainin Logistic</h1>
            <p className="mt-1 text-sm text-white/60">Artículos publicados en el sitio.</p>
          </div>
          <button
            type="button"
            onClick={() => (formMode ? closeForm() : openCreate())}
            className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110"
          >
            {formMode ? 'Cancelar' : '+ Nuevo artículo'}
          </button>
        </header>

        {formMode && (
          <div className="mb-8">
            {formMode === 'edit' && loadingPost ? (
              <p className="text-sm text-white/60">Cargando artículo…</p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                {formMode === 'edit' && (
                  <Field label="Slug" required>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => updateField('slug', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                )}
                <Field label="Título" required>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={inputClass}
                  />
                  <CharHint value={form.title} recommended={60} max={90} />
                </Field>
                <Field label="Extracto" hint="Se usa como descripción corta en la lista de artículos y ayuda al SEO.">
                  <input
                    type="text"
                    value={form.excerpt}
                    onChange={(e) => updateField('excerpt', e.target.value)}
                    className={inputClass}
                  />
                  <CharHint value={form.excerpt} recommended={140} max={180} />
                </Field>
                <Field label="Contenido (HTML)" hint="Se guarda tal como se escribe.">
                  <textarea
                    rows={5}
                    value={form.body}
                    onChange={(e) => updateField('body', e.target.value)}
                    className={inputClass}
                  />
                  <WordHint value={form.body} recommendedMin={800} recommendedMax={2500} />
                </Field>
                <ImageField
                  label="Imagen de portada"
                  hint="1344×756 px (relación 16:9) · JPG · máx. 5 MB, ideal menos de 800 KB. Se usa como miniatura en la lista y como imagen grande en el detalle del artículo."
                  value={form.cover_image}
                  onChange={(value) => updateField('cover_image', value)}
                />
                <Field label="Fecha de publicación">
                  <input
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => updateField('published_at', e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {saving ? 'Guardando…' : formMode === 'edit' ? 'Guardar cambios' : 'Publicar artículo'}
                  </button>
                  <button type="button" onClick={closeForm} className={buttonSecondaryClass}>
                    Cancelar
                  </button>
                  {formStatus.message && (
                    <span className={`text-sm ${formStatus.error ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {formStatus.message}
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {loading && <p className="text-sm text-white/60">Cargando artículos…</p>}
        {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.length === 0 && <p className="text-sm text-white/50">No hay artículos todavía.</p>}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={() => openEdit(post)}
                onDelete={() => handleDelete(post)}
                deleting={deletingId === post.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
