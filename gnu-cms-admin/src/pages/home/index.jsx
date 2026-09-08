import React from 'react'
import { useNavigate } from 'react-router'
import Card from '../../components/card'
import { logout } from '../../functions/fetch'

const PAGES = [
  { title: 'Página web GNU', subtitle: 'Updated 2 hours ago', status: 'active', site: 'gnu' },
  { title: 'Gas natural vehicular', subtitle: 'Updated yesterday', status: 'active', site: 'gas-natural' },
  { title: 'Trainnin logistic', subtitle: 'Awaiting review', status: 'active', site: 'trainin' },
  { title: 'Tectuus', subtitle: 'Broken link detected', status: 'pending', site: 'tectuus' },
]

export default function Home() {
  const navigate = useNavigate()

  const handleOpenPage = (page) => {
    navigate(`/${page.site}/select-page`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-[#0b0611] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">GNU CMS</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Sign out
          </button>
        </header>

        <section className="mt-16">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido @user</h1>
          <p className="mt-2 text-white/60">Selecciona la página que deseas editar.</p>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PAGES.map((page) => (
            <Card
              key={page.title}
              title={page.title}
              subtitle={page.subtitle}
              status={page.status}
              onArrowClick={() => handleOpenPage(page)}
            />
          ))}
        </section>
      </div>
    </main>
  )
}
