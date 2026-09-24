import React, { useState } from 'react'
import usePageUrlsStore from '../store/pageUrls'
import { inputClass, buttonSecondaryClass } from './form-fields'

function normalizeUrl(url) {
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Shows the saved public URL for `site` as a clickable link, with a pencil
// button that swaps it for an input to update it. Backed by the
// `pageUrls` store (keys match the public site project, e.g. "gas-gnu" —
// not always the admin's own route slug, e.g. "gas-natural").
export default function SiteUrlLink({ site }) {
  const url = usePageUrlsStore((state) => state.pageUrls[site])
  const setPageUrl = usePageUrlsStore((state) => state.setPageUrl)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(url ?? '')

  function startEditing() {
    setValue(url ?? '')
    setEditing(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setPageUrl(site, value.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-2">
        <input
          type="text"
          autoFocus
          placeholder="ejemplo.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button type="submit" className={buttonSecondaryClass}>
          Guardar
        </button>
        <button type="button" onClick={() => setEditing(false)} className={buttonSecondaryClass}>
          Cancelar
        </button>
      </form>
    )
  }

  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      {url ? (
        <a
          href={normalizeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-[#c9a3ff] transition hover:text-white"
        >
          {url}
        </a>
      ) : (
        <span className="text-white/40">Sin URL guardada</span>
      )}
      <button
        type="button"
        onClick={startEditing}
        aria-label="Editar URL del sitio"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:text-white"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path
            d="M11.5 2.5a1.4 1.4 0 0 1 2 2L5 13l-3 1 1-3 8.5-8.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
