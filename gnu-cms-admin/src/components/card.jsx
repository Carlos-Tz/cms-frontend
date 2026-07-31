import React from 'react'

const STATUS_STYLES = {
  active: { dot: 'bg-emerald-400', label: 'text-emerald-300' },
  pending: { dot: 'bg-amber-400', label: 'text-amber-300' },
  draft: { dot: 'bg-white/40', label: 'text-white/50' },
  error: { dot: 'bg-rose-400', label: 'text-rose-300' },
}

export default function Card({ title, subtitle, status = 'active', onArrowClick }) {
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.active

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onArrowClick}
          aria-label={`Open ${title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/30 hover:text-white"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path
              d="M4 12 12 4M6 4h6v6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
        <span className={`text-xs font-medium capitalize ${statusStyle.label}`}>{status}</span>
      </div>
    </div>
  )
}
