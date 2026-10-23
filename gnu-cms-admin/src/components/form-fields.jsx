import React, { useState } from 'react'
import { uploadMedia } from '../functions/fetch'

export const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#863bff]'

export const buttonSecondaryClass =
  'rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white'

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

export function fieldError(errors, path) {
  const messages = errors?.[path]
  return Array.isArray(messages) ? messages[0] : undefined
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function readImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export function Field({ label, required, hint, error, children }) {
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

// Live character-count indicator. Place as a sibling of the input inside a Field.
// Purely a UX recommendation — nothing here blocks saving.
export function CharHint({ value, recommended, max }) {
  const len = (value ?? '').length
  const over = max != null && len > max
  const near = !over && len > recommended
  const cls = over ? 'text-amber-400' : near ? 'text-white/55' : 'text-white/35'
  return (
    <span className={`mt-1 block text-right text-[11px] ${cls}`}>
      {len}
      {max != null ? `/${max}` : ''} caracteres · recomendado ~{recommended}
    </span>
  )
}

// Live word-count indicator for long-form content (e.g. blog body).
export function WordHint({ value, recommendedMin, recommendedMax }) {
  const words = (value ?? '').trim().length ? (value ?? '').trim().split(/\s+/).length : 0
  const under = words > 0 && words < recommendedMin
  const over = words > recommendedMax
  const cls = under || over ? 'text-white/55' : 'text-white/35'
  return (
    <span className={`mt-1 block text-right text-[11px] ${cls}`}>
      {words} palabras · recomendado {recommendedMin}-{recommendedMax}
    </span>
  )
}

/**
 * Image upload field with recommendation hint + client-side guardrails:
 * blocks files over the server's 5 MB limit before wasting an upload request,
 * and reports the measured width/height/weight once a file is picked.
 *
 * `removable` (default true) hides the "quitar imagen" (×) button: some
 * image fields are backend-required (e.g. a `banner_carousel` slide's,
 * `clients_showcase` logo's, or `image_gallery` image's own `image`) — there,
 * clearing just the image would 422 on save, so the correct way to drop one
 * is removing the whole item (DynamicItem's own "Eliminar"), not the image.
 */
export function ImageField({ label, value, onChange, error, hint, removable = true }) {
  const [uploading, setUploading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState(null) // { tone: 'ok' | 'warn' | 'error', text }

  async function handleFile(file) {
    if (!file) return
    setFeedback(null)

    if (file.size > MAX_UPLOAD_BYTES) {
      setFeedback({
        tone: 'error',
        text: `El archivo pesa ${formatBytes(file.size)}. El servidor rechaza imágenes de más de 5 MB — comprime la imagen antes de subirla.`,
      })
      return
    }

    setChecking(true)
    const dims = await readImageDimensions(file)
    setChecking(false)

    if (dims) {
      setFeedback({
        tone: file.size > 2 * 1024 * 1024 ? 'warn' : 'ok',
        text: `${dims.width}×${dims.height} px · ${formatBytes(file.size)}`,
      })
    }

    setUploading(true)
    const res = await uploadMedia(file)
    setUploading(false)

    if (res?.status === 'success') {
      onChange(res.data.url)
      return
    }

    // Upload failures come back as the API's raw Laravel error shape
    // ({message, errors}), not the app's usual {status, data, meta}.
    const text = res?.errors?.file?.[0] ?? res?.meta?.message ?? res?.message ?? 'No se pudo subir el archivo.'
    setFeedback({ tone: 'error', text })
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-4">
      <span className="block text-sm text-white/70">{label}</span>
      {hint && <span className="block text-xs text-white/40">{hint}</span>}
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg bg-white/5 text-sm text-white/40">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>Sin imagen</span>
        )}
        {value && !uploading && removable && (
          <button
            type="button"
            onClick={() => {
              setFeedback(null)
              onChange(null)
            }}
            aria-label="Quitar imagen"
            title="Quitar imagen"
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/70 transition hover:border-rose-400/70 hover:text-rose-300"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
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
      {value && !removable && (
        <span className="block text-xs text-white/40">
          Esta imagen es obligatoria — para quitarla, elimina este elemento completo.
        </span>
      )}
      {checking && <span className="block text-xs text-white/40">Verificando imagen…</span>}
      {feedback && (
        <span
          className={`block text-xs ${
            feedback.tone === 'error'
              ? 'text-rose-400'
              : feedback.tone === 'warn'
                ? 'text-amber-400'
                : 'text-emerald-300'
          }`}
        >
          {feedback.text}
        </span>
      )}
      {error && <span className="block text-xs text-rose-400">{error}</span>}
    </div>
  )
}

export function DynamicItem({ title, onRemove, children }) {
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

export function AddButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={buttonSecondaryClass}>
      {children}
    </button>
  )
}

export function updateArrayItem(list, index, key, value) {
  const next = [...list]
  next[index] = { ...next[index], [key]: value }
  return next
}
