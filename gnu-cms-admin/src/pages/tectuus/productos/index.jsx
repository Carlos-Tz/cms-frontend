import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  fetchData,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../functions/fetch'
import { SectionsFields } from '../../../components/page-sections-editor'
import {
  inputClass,
  buttonSecondaryClass,
  Field,
  CharHint,
  ImageField,
  DynamicItem,
  AddButton,
} from '../../../components/form-fields'

const SITE_ID = 4

function emptyCategoryForm() {
  return { name: '', slug: '', description: '', image: '', position: '' }
}

function emptyProductForm() {
  return {
    product_category_id: '',
    name: '',
    slug: '',
    description: '',
    price: '',
    images: [],
    is_active: true,
  }
}

function categoryName(product, categories) {
  return product.category?.name ?? categories.find((c) => c.id === product.product_category_id)?.name ?? '—'
}

function CategoriesSection() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [formMode, setFormMode] = useState(null) // null | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyCategoryForm())
  const [saving, setSaving] = useState(false)
  const [formStatus, setFormStatus] = useState({ message: '', error: false })

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setLoading(true)
      setError('')

      const res = await fetchData('/api/admin/product-categories?site=tectuus')

      if (cancelled) return

      if (res?.status === 'success') {
        setCategories(res.data)
      } else {
        setError('No se pudieron cargar las categorías.')
      }

      setLoading(false)
    }

    loadCategories()

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
    setForm({ ...emptyCategoryForm(), position: categories.length + 1 })
  }

  function openEdit(category) {
    setFormStatus({ message: '', error: false })
    setFormMode('edit')
    setEditingId(category.id)
    setForm({
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      image: category.image ?? '',
      position: category.position ?? '',
    })
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyCategoryForm())
    setFormStatus({ message: '', error: false })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setFormStatus({ message: '', error: false })

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || null,
      image: form.image || null,
      position: Number(form.position),
    }

    if (formMode === 'edit') {
      const res = await updateProductCategory(editingId, payload)
      setSaving(false)

      if (res?.status === 'success') {
        setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data : c)))
        closeForm()
      } else {
        setFormStatus({ message: res?.meta?.message ?? 'No se pudo actualizar la categoría.', error: true })
      }
    } else {
      const res = await createProductCategory({ site_id: SITE_ID, ...payload })
      setSaving(false)

      if (res?.status === 'success') {
        setCategories((prev) => [...prev, res.data])
        closeForm()
      } else {
        setFormStatus({ message: res?.meta?.message ?? 'No se pudo crear la categoría.', error: true })
      }
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return

    setDeletingId(category.id)
    const res = await deleteProductCategory(category.id)
    setDeletingId(null)

    if (res?.status === 'success') {
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
    } else {
      alert(res?.meta?.message ?? 'No se pudo eliminar la categoría.')
    }
  }

  return (
    <section className="mt-10">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Categorías</h2>
          <p className="mt-1 text-sm text-white/60">Categorías del catálogo de productos.</p>
        </div>
        <button
          type="button"
          onClick={() => (formMode ? closeForm() : openCreate())}
          className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110"
        >
          {formMode ? 'Cancelar' : '+ Nueva categoría'}
        </button>
      </header>

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
              <CharHint value={form.name} recommended={30} max={50} />
            </Field>
            <Field label="Posición" required hint="Orden en el listado público.">
              <input
                type="number"
                required
                min="1"
                value={form.position}
                onChange={(e) => updateField('position', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Descripción">
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={inputClass}
            />
          </Field>
          <ImageField
            label="Imagen"
            hint="800×500 px (relación 16:10) aprox. · máx. 5 MB."
            value={form.image}
            onChange={(value) => updateField('image', value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : formMode === 'edit' ? 'Guardar cambios' : 'Crear categoría'}
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

      {loading && <p className="text-sm text-white/60">Cargando categorías…</p>}
      {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 && <p className="text-sm text-white/50">No hay categorías todavía.</p>}
          {categories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-white">{category.name}</h3>
              <p className="mt-1 text-sm text-white/60">{category.description}</p>
              <p className="mt-3 text-xs text-white/40">{category.products_count ?? 0} productos</p>
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={() => openEdit(category)} className={buttonSecondaryClass}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  disabled={deletingId === category.id}
                  className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-400/70 disabled:opacity-60"
                >
                  {deletingId === category.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ProductsSection() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const [formMode, setFormMode] = useState(null) // null | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyProductForm())
  const [saving, setSaving] = useState(false)
  const [formStatus, setFormStatus] = useState({ message: '', error: false })

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')

      const [categoriesRes, productsRes] = await Promise.all([
        fetchData('/api/admin/product-categories?site=tectuus'),
        fetchData('/api/admin/products?site=tectuus'),
      ])

      if (cancelled) return

      if (categoriesRes?.status === 'success' && productsRes?.status === 'success') {
        setCategories(categoriesRes.data)
        setProducts(productsRes.data)
      } else {
        setError('No se pudieron cargar los productos.')
      }

      setLoading(false)
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function updateImage(i, value) {
    setForm((f) => ({ ...f, images: f.images.map((img, idx) => (idx === i ? value : img)) }))
  }

  function addImage() {
    setForm((f) => ({ ...f, images: [...f.images, ''] }))
  }

  function removeImage(i) {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
  }

  function openCreate() {
    setFormStatus({ message: '', error: false })
    setFormMode('create')
    setEditingId(null)
    setForm({ ...emptyProductForm(), product_category_id: categories[0]?.id ?? '' })
  }

  function openEdit(product) {
    setFormStatus({ message: '', error: false })
    setFormMode('edit')
    setEditingId(product.id)
    setForm({
      product_category_id: product.product_category_id ?? product.category?.id ?? '',
      name: product.name ?? '',
      slug: product.slug ?? '',
      description: product.description ?? '',
      price: product.price ?? '',
      images: product.images ?? [],
      is_active: product.is_active ?? true,
    })
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyProductForm())
    setFormStatus({ message: '', error: false })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setFormStatus({ message: '', error: false })

    const payload = {
      product_category_id: Number(form.product_category_id),
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || null,
      price: form.price === '' ? null : Number(form.price),
      images: form.images.filter((img) => img),
      is_active: form.is_active,
    }

    if (formMode === 'edit') {
      const res = await updateProduct(editingId, payload)
      setSaving(false)

      if (res?.status === 'success') {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)))
        closeForm()
      } else {
        setFormStatus({ message: res?.meta?.message ?? 'No se pudo actualizar el producto.', error: true })
      }
    } else {
      const res = await createProduct({ site_id: SITE_ID, ...payload })
      setSaving(false)

      if (res?.status === 'success') {
        setProducts((prev) => [res.data, ...prev])
        closeForm()
      } else {
        setFormStatus({ message: res?.meta?.message ?? 'No se pudo crear el producto.', error: true })
      }
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(product.id)
    const res = await deleteProduct(product.id)
    setDeletingId(null)

    if (res?.status === 'success') {
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      if (editingId === product.id) closeForm()
    } else {
      alert(res?.meta?.message ?? 'No se pudo eliminar el producto.')
    }
  }

  return (
    <section className="mt-10">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Productos</h2>
          <p className="mt-1 text-sm text-white/60">Catálogo de productos del sitio.</p>
        </div>
        <button
          type="button"
          onClick={() => (formMode ? closeForm() : openCreate())}
          disabled={categories.length === 0}
          className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {formMode ? 'Cancelar' : '+ Nuevo producto'}
        </button>
      </header>

      {categories.length === 0 && !loading && (
        <p className="mb-4 text-sm text-white/50">Crea al menos una categoría antes de agregar productos.</p>
      )}

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" required>
              <select
                required
                value={form.product_category_id}
                onChange={(e) => updateField('product_category_id', e.target.value)}
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
              />
              <CharHint value={form.name} recommended={50} max={90} />
            </Field>
          </div>
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
          <Field label="Descripción">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Precio" hint="Déjalo vacío para mostrar 'Precio a cotizar'.">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="space-y-4">
            <span className="block text-sm text-white/70">Imágenes</span>
            {form.images.map((image, i) => (
              <DynamicItem key={i} title={`Imagen ${i + 1}`} onRemove={() => removeImage(i)}>
                <ImageField label="Imagen" value={image} onChange={(value) => updateImage(i, value)} />
              </DynamicItem>
            ))}
            <AddButton onClick={addImage}>+ Agregar imagen</AddButton>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
            Activo (visible en el sitio público)
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : formMode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
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

      {loading && <p className="text-sm text-white/60">Cargando productos…</p>}
      {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 && <p className="text-sm text-white/50">No hay productos todavía.</p>}
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              {product.images?.[0] && (
                <div className="mb-3 h-32 overflow-hidden rounded-lg bg-white/5">
                  <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-white">{product.name}</h3>
                <span className={`h-2 w-2 shrink-0 rounded-full ${product.is_active ? 'bg-emerald-400' : 'bg-white/40'}`} />
              </div>
              <p className="mt-1 text-xs text-white/40">{categoryName(product, categories)}</p>
              <p className="mt-2 text-sm text-white/60">
                {product.price != null ? `$${product.price} MXN` : 'Precio a cotizar'}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={() => openEdit(product)} className={buttonSecondaryClass}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product.id}
                  className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-300 transition hover:border-rose-400/70 disabled:opacity-60"
                >
                  {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function TectuusProductos() {
  const [sectionsTotal, setSectionsTotal] = useState(0)

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link to="/tectuus/select-page" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Productos — Tectuus</h1>
          <p className="mt-1 text-sm text-white/60">
            Encabezado de la página, categorías y catálogo de productos.
            {sectionsTotal > 0 && <span className="text-white/40"> · {sectionsTotal} secciones</span>}
          </p>
        </header>

        <SectionsFields site="tectuus" page="productos" pageId={45} onTotalChange={setSectionsTotal} />

        <CategoriesSection />
        <ProductsSection />
      </div>
    </main>
  )
}
