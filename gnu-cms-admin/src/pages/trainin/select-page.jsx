import React from 'react'
import { Link, useNavigate } from 'react-router'

const PAGES = [
  { title: 'Inicio', subtitle: 'Portada del sitio Trainin Logistic', path: '/trainin/inicio' },
  { title: 'Nuestros servicios', subtitle: 'Transporte de GNC, logística y carga pesada', path: '/trainin/nuestros-servicios' },
  { title: 'Sobre nosotros', subtitle: 'Qué hacemos, propósito e historia', path: '/trainin/sobre-nosotros' },
  { title: 'Ubicaciones', subtitle: 'Puntos de operación', path: '/trainin/ubicaciones' },
  { title: 'Contacto', subtitle: 'Mensajes del formulario de contacto', path: '/trainin/contacto' },
  { title: 'Blog', subtitle: 'Artículos publicados', path: '/trainin/blog' },
]

export default function SelectPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link to="/home" className="text-sm text-white/50 transition hover:text-white/80">
          &larr; Back
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Trainin Logistic</h1>
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
