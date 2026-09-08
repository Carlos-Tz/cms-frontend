import React from 'react'
import { Routes, Route, useNavigate } from 'react-router'
import heroImage from './assets/hero.png'
import Login from './pages/login'
import Home from './pages/home'
import EditableSections from './pages/gnu/editable-sections'
import GnuBlog from './pages/gnu/blog'
import GnuContacto from './pages/gnu/contacto'
import GnuNuestrosServicios from './pages/gnu/nuestros-servicios'
import GnuDesarrolloSostenible from './pages/gnu/desarrollo-sostenible'
import GnuDesarrolloSostenPortada from './pages/gnu/desarrollo-sostenible/portada'
import GnuDistintivoEsr from './pages/gnu/desarrollo-sostenible/distintivo-esr'
import GnuEcoVadis from './pages/gnu/desarrollo-sostenible/ecovadis'
import GnuVoluntariado from './pages/gnu/desarrollo-sostenible/voluntariado'
import GnuIniciativasRse from './pages/gnu/desarrollo-sostenible/iniciativas-rse'
import GnuSobreNosotros from './pages/gnu/sobre-nosotros'
import GnuSobreNosotrosPortada from './pages/gnu/sobre-nosotros/portada'
import GnuPropositoEmpresarial from './pages/gnu/sobre-nosotros/proposito-empresarial'
import GnuValores from './pages/gnu/sobre-nosotros/valores'
import GnuCertificaciones from './pages/gnu/sobre-nosotros/certificaciones'
import GnuNuestraHistoria from './pages/gnu/sobre-nosotros/nuestra-historia'
import GnuSelectPage from './pages/gnu/select-page'
import GasNaturalSelectPage from './pages/gas-natural/select-page'
import GasNaturalInicio from './pages/gas-natural/inicio'
import GasNaturalNuestrosServicios from './pages/gas-natural/nuestros-servicios'
import GasNaturalInstalaTuEquipoDeGnv from './pages/gas-natural/nuestros-servicios/instala-tu-equipo-de-gnv'
import GasNaturalCotizaTuEquipo from './pages/gas-natural/nuestros-servicios/cotiza-tu-equipo'
import GasNaturalFinanciamiento from './pages/gas-natural/nuestros-servicios/financiamiento'
import GasNaturalFlotillasEmpresariales from './pages/gas-natural/nuestros-servicios/flotillas-empresariales'
import GasNaturalEstacionesMoviles from './pages/gas-natural/nuestros-servicios/estaciones-moviles'
import GasNaturalUbicaciones from './pages/gas-natural/ubicaciones'
import GasNaturalUbicacionesPortada from './pages/gas-natural/ubicaciones/portada'
import GasNaturalEstacionesMorelia from './pages/gas-natural/ubicaciones/estaciones-morelia'
import GasNaturalEstacionUruapan from './pages/gas-natural/ubicaciones/estacion-uruapan'
import GasNaturalAgendaTuVerificacion from './pages/gas-natural/ubicaciones/agenda-tu-verificacion'
import GasNaturalTalleres from './pages/gas-natural/ubicaciones/talleres'
import GasNaturalContacto from './pages/gas-natural/contacto'
import GasNaturalBlog from './pages/gas-natural/blog'
import TraininSelectPage from './pages/trainin/select-page'
import TraininInicio from './pages/trainin/inicio'
import TraininNuestrosServicios from './pages/trainin/nuestros-servicios'
import TraininNuestrosServiciosPortada from './pages/trainin/nuestros-servicios/portada'
import TraininTransporteDeGnc from './pages/trainin/nuestros-servicios/transporte-de-gnc'
import TraininLogistica from './pages/trainin/nuestros-servicios/logistica'
import TraininCargaPesada from './pages/trainin/nuestros-servicios/carga-pesada'
import TraininSobreNosotros from './pages/trainin/sobre-nosotros'
import TraininSobreNosotrosPortada from './pages/trainin/sobre-nosotros/portada'
import TraininQueHacemos from './pages/trainin/sobre-nosotros/que-hacemos'
import TraininPropositoEmpresarial from './pages/trainin/sobre-nosotros/proposito-empresarial'
import TraininNuestraHistoria from './pages/trainin/sobre-nosotros/nuestra-historia'
import TraininUbicaciones from './pages/trainin/ubicaciones'
import TraininContacto from './pages/trainin/contacto'
import TraininBlog from './pages/trainin/blog'
import TectuusSelectPage from './pages/tectuus/select-page'
import TectuusInicio from './pages/tectuus/inicio'
import TectuusSobreNosotros from './pages/tectuus/sobre-nosotros'
import TectuusProductos from './pages/tectuus/productos'
import TectuusContacto from './pages/tectuus/contacto'

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
      <Route path="/gnu/select-page" element={<GnuSelectPage />} />
      <Route path="/gnu/blog" element={<GnuBlog />} />
      <Route path="/gnu/contacto" element={<GnuContacto />} />
      <Route path="/gnu/nuestros-servicios" element={<GnuNuestrosServicios />} />
      <Route path="/gnu/desarrollo-sostenible" element={<GnuDesarrolloSostenible />} />
      <Route path="/gnu/desarrollo-sostenible/portada" element={<GnuDesarrolloSostenPortada />} />
      <Route path="/gnu/desarrollo-sostenible/distintivo-esr" element={<GnuDistintivoEsr />} />
      <Route path="/gnu/desarrollo-sostenible/ecovadis" element={<GnuEcoVadis />} />
      <Route path="/gnu/desarrollo-sostenible/voluntariado" element={<GnuVoluntariado />} />
      <Route path="/gnu/desarrollo-sostenible/iniciativas-rse" element={<GnuIniciativasRse />} />
      <Route path="/gnu/sobre-nosotros" element={<GnuSobreNosotros />} />
      <Route path="/gnu/sobre-nosotros/portada" element={<GnuSobreNosotrosPortada />} />
      <Route path="/gnu/sobre-nosotros/proposito-empresarial" element={<GnuPropositoEmpresarial />} />
      <Route path="/gnu/sobre-nosotros/valores" element={<GnuValores />} />
      <Route path="/gnu/sobre-nosotros/certificaciones" element={<GnuCertificaciones />} />
      <Route path="/gnu/sobre-nosotros/nuestra-historia" element={<GnuNuestraHistoria />} />
      <Route path="/gas-natural/select-page" element={<GasNaturalSelectPage />} />
      <Route path="/gas-natural/inicio" element={<GasNaturalInicio />} />
      <Route path="/gas-natural/nuestros-servicios" element={<GasNaturalNuestrosServicios />} />
      <Route
        path="/gas-natural/nuestros-servicios/instala-tu-equipo-de-gnv"
        element={<GasNaturalInstalaTuEquipoDeGnv />}
      />
      <Route path="/gas-natural/nuestros-servicios/cotiza-tu-equipo" element={<GasNaturalCotizaTuEquipo />} />
      <Route path="/gas-natural/nuestros-servicios/financiamiento" element={<GasNaturalFinanciamiento />} />
      <Route
        path="/gas-natural/nuestros-servicios/flotillas-empresariales"
        element={<GasNaturalFlotillasEmpresariales />}
      />
      <Route path="/gas-natural/nuestros-servicios/estaciones-moviles" element={<GasNaturalEstacionesMoviles />} />
      <Route path="/gas-natural/ubicaciones" element={<GasNaturalUbicaciones />} />
      <Route path="/gas-natural/ubicaciones/portada" element={<GasNaturalUbicacionesPortada />} />
      <Route path="/gas-natural/ubicaciones/estaciones-morelia" element={<GasNaturalEstacionesMorelia />} />
      <Route path="/gas-natural/ubicaciones/estacion-uruapan" element={<GasNaturalEstacionUruapan />} />
      <Route
        path="/gas-natural/ubicaciones/agenda-tu-verificacion"
        element={<GasNaturalAgendaTuVerificacion />}
      />
      <Route path="/gas-natural/ubicaciones/talleres" element={<GasNaturalTalleres />} />
      <Route path="/gas-natural/contacto" element={<GasNaturalContacto />} />
      <Route path="/gas-natural/blog" element={<GasNaturalBlog />} />
      <Route path="/gnu/editable-sections" element={<EditableSections />} />
      <Route path="/trainin/select-page" element={<TraininSelectPage />} />
      <Route path="/trainin/inicio" element={<TraininInicio />} />
      <Route path="/trainin/nuestros-servicios" element={<TraininNuestrosServicios />} />
      <Route path="/trainin/nuestros-servicios/portada" element={<TraininNuestrosServiciosPortada />} />
      <Route path="/trainin/nuestros-servicios/transporte-de-gnc" element={<TraininTransporteDeGnc />} />
      <Route path="/trainin/nuestros-servicios/logistica" element={<TraininLogistica />} />
      <Route path="/trainin/nuestros-servicios/carga-pesada" element={<TraininCargaPesada />} />
      <Route path="/trainin/sobre-nosotros" element={<TraininSobreNosotros />} />
      <Route path="/trainin/sobre-nosotros/portada" element={<TraininSobreNosotrosPortada />} />
      <Route path="/trainin/sobre-nosotros/que-hacemos" element={<TraininQueHacemos />} />
      <Route path="/trainin/sobre-nosotros/proposito-empresarial" element={<TraininPropositoEmpresarial />} />
      <Route path="/trainin/sobre-nosotros/nuestra-historia" element={<TraininNuestraHistoria />} />
      <Route path="/trainin/ubicaciones" element={<TraininUbicaciones />} />
      <Route path="/trainin/contacto" element={<TraininContacto />} />
      <Route path="/trainin/blog" element={<TraininBlog />} />
      <Route path="/tectuus/select-page" element={<TectuusSelectPage />} />
      <Route path="/tectuus/inicio" element={<TectuusInicio />} />
      <Route path="/tectuus/sobre-nosotros" element={<TectuusSobreNosotros />} />
      <Route path="/tectuus/productos" element={<TectuusProductos />} />
      <Route path="/tectuus/contacto" element={<TectuusContacto />} />
    </Routes>
  )
}
