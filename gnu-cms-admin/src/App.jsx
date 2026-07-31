import React from 'react'
import { Routes, Route, useNavigate } from 'react-router'
import heroImage from './assets/hero.png'
import Login from './pages/login'
import Home from './pages/home'
import EditPage from './pages/edit-page'
import EditableSections from './pages/editable-sections'

const FEATURES = [
  {
    title: 'Content editor',
    description: 'Write, structure and publish pages without touching code.',
  },
  {
    title: 'Media library',
    description: 'Upload, organize and reuse assets across every site you run.',
  },
  {
    title: 'Role-based access',
    description: 'Give editors, admins and contributors exactly what they need.',
  },
]

function Landing() {
  const session = false
  const navigate = useNavigate()

  const handleCtaClick = () => {
    navigate(session ? '/home' : '/login')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0611] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,_rgba(134,59,255,0.35),_transparent_70%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col px-6 pt-8 pb-24">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">GNU CMS</span>
          </div>
          <button
            type="button"
            onClick={handleCtaClick}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Sign in
          </button>
        </header>

        <section className="mt-16 grid items-center gap-12 md:mt-24 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full border border-[#863bff]/40 bg-[#863bff]/10 px-3 py-1 text-xs font-medium tracking-wide text-[#c9a3ff] uppercase">
              Administador
            </p>
            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Control sobre tu contenido{' '}
              <span className="bg-gradient-to-r from-[#863bff] to-[#47bfff] bg-clip-text text-transparent">
                sin el trabajo extra
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base text-white/60 sm:text-lg">
              GNU CMS Admin te permite controlar tus páginas desde un solo lugar, administra el contenido de tu sitio web de manera sencilla y sin complicaciones.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleCtaClick}
                className="rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#863bff]/30 transition hover:brightness-110"
              >
                {session ? 'Ir a tu panel' : 'Comenzar ahora'}
              </button>
              <span className="text-sm text-white/40">Contactar a soporte</span>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <img
              src={heroImage}
              alt="GNU CMS illustration"
              className="w-full max-w-sm drop-shadow-[0_25px_60px_rgba(134,59,255,0.35)]"
            />
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-white/60">{feature.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/edit-page" element={<EditPage />} />
      <Route path="/editable-sections/:site" element={<EditableSections />} />
    </Routes>
  )
}
