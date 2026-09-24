import React from 'react'
import { Link, useNavigate } from 'react-router'
import RebuildSiteButton from '../../components/rebuild-site-button'
import SiteUrlLink from '../../components/site-url-link'

const PAGES = [
  { title: 'Landing Page', subtitle: 'Portada del sitio GNU', path: '/gnu/editable-sections' },
  { title: 'Blog', subtitle: 'Artículos publicados', path: '/gnu/blog' },
  { title: 'Sobre nosotros', subtitle: 'Información de la empresa', path: '/gnu/sobre-nosotros' },
  { title: 'Nuestros servicios', subtitle: 'Soluciones de gas natural para tu operación', path: '/gnu/nuestros-servicios' },
  { title: 'Desarrollo sostenible', subtitle: 'Nuestro compromiso con el entorno y las comunidades', path: '/gnu/desarrollo-sostenible' },
  { title: 'Contacto', subtitle: 'Mensajes del formulario de contacto', path: '/gnu/contacto' },
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
          <h1 className="text-2xl font-bold tracking-tight">Página web GNU</h1>
          <p className="mt-1 text-sm text-white/60">Selecciona una página para editar.</p>
        </header>

        <SiteUrlLink site="gnu" />

        <RebuildSiteButton site="gnu" />

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
