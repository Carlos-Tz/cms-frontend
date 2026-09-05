import React from 'react'
import { Link, useNavigate } from 'react-router'

const PAGES = [
  { title: 'Portada', subtitle: 'Encabezado general y mapa de estaciones', path: '/gas-natural/ubicaciones/portada' },
  { title: 'Estación Morelia', subtitle: 'Página de la estación en Morelia', path: '/gas-natural/ubicaciones/estaciones-morelia' },
  { title: 'Estación Uruapan', subtitle: 'Página de la estación en Uruapan', path: '/gas-natural/ubicaciones/estacion-uruapan' },
  {
    title: 'Agenda tu verificación',
    subtitle: 'Widget de reserva de citas de verificación vehicular',
    path: '/gas-natural/ubicaciones/agenda-tu-verificacion',
  },
  { title: 'Talleres', subtitle: 'Talleres certificados', path: '/gas-natural/ubicaciones/talleres' },
]

export default function UbicacionesSelectPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link to="/gas-natural/select-page" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Ubicaciones</h1>
          <p className="mt-1 text-sm text-white/60">Selecciona una página para editar.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {PAGES.map((page) => (
            <button
              key={page.title}
              type="button"
              onClick={() => navigate(page.path)}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm transition hover:border-white/30"
            >
              <div>
                <h3 className="text-base font-semibold text-white">{page.title}</h3>
                <p className="mt-1 text-sm text-white/60">{page.subtitle}</p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition group-hover:border-white/30 group-hover:text-white">
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M4 12 12 4M6 4h6v6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
