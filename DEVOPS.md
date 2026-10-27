# Manual de DevOps y desarrollo — cms-frontend

Referencia operativa de los cinco proyectos frontend de este repositorio: el panel de administración en React y los cuatro sitios públicos en Astro.

Escrito para desarrolladores. Las guías de **contenido** por sitio para editores/webmasters son los archivos en español `DOCUMENTACION-CONTENIDO-*.txt` en la raíz del repositorio — este documento no las repite.

| Doc | Público | Idioma |
| :-- | :-- | :-- |
| `README.md` | Panorama general del sistema | Español |
| `DEVOPS.md` (este archivo) | Desarrolladores / quien despliega | Español |
| `DOCUMENTACION-CONTENIDO-*.txt` | Editores de contenido, webmaster | Español |
| `<project>/GUIDELINES.md` | Lenguaje de diseño (copia idéntica en los 5) | Español |
| `<project>/README.md` | Detalle por proyecto (los cinco proyectos tienen el suyo) | Español |

---

## 1. Arquitectura del sistema

```
                    ┌───────────────────────────────┐
                    │  CMS headless externo (Laravel) │
                    │  gnu-headless-cms...sslip.io    │
                    └───────┬───────────────┬────────┘
     escritura autenticada  │               │  lectura pública, sin auth
       /api/admin/*         │               │  /api/public/{site}/*
       Bearer JWT           │               │  SOLO EN TIEMPO DE COMPILACIÓN
                            │               │
                 ┌──────────┴─────┐   ┌─────┴──────────────────────────┐
                 │ gnu-cms-admin   │   │ landing-gnu  gas-gnu           │
                 │ React SPA       │   │ tectuus      trainin           │
                 │ requiere login  │   │ Astro → dist/ estático         │
                 └─────────────────┘   └────────────────────────────────┘
                                                    │
                                        público, sin login, sin sesión
```

**El hecho operativo más importante:** los sitios Astro obtienen el contenido del CMS *solo en tiempo de compilación*. No hay adaptador SSR en ningún `astro.config.mjs`. Cuando un editor guarda en el panel, la base de datos cambia de inmediato, pero **el sitio en vivo no cambia hasta que ese sitio se vuelve a compilar y desplegar**. No hay ningún webhook conectado; hoy publicar es un paso manual.

### Los cuatro sitios y sus slugs en el CMS

El slug del CMS **no** es el nombre de la carpeta. Esto confunde a la gente todo el tiempo.

| Carpeta | Marca | Slug del sitio en el CMS | Prefijo de ruta en el panel | `site_id` en el panel |
| :-- | :-- | :-- | :-- | :-- |
| `landing-gnu` | GNU Gas Natural | `gnu` | `/gnu/*` | 1 |
| `gas-gnu` | GNU Gas Natural Vehicular | `gnu-vehicular` | `/gas-natural/*` | 2 |
| `trainin` | Traninn Logistic | `traninn-logistic` | `/trainin/*` | 3 |
| `tectuus` | Tectuus | `tectuus` | `/tectuus/*` | 4 |

Ojo con la ortografía inconsistente de Traninn/Trainin — la carpeta, el nombre de la marca y el slug del CMS son distintos. No "corrijas" uno sin los demás.

---

## 2. Requisitos previos

- **Node.js ≥ 22.12.0** — declarado en `engines` en los cuatro proyectos Astro. El panel no declara versión, pero necesita un Node moderno para Vite 8.
- **npm** — sin ninguna herramienta de workspaces (ni pnpm workspaces, Lerna, Nx, Turborepo). Cada proyecto tiene su propio `package.json`, `node_modules` y `.env`.
- **Tienes que hacer `cd` a un proyecto antes de cualquier comando npm.** No hay `package.json` en la raíz.

### Versiones del stack

| | Framework | Herramienta de compilación | Estilos | Estado |
| :-- | :-- | :-- | :-- | :-- |
| `gnu-cms-admin` | React 19 + react-router 8 | Vite 8 | Tailwind CSS v4 (`@tailwindcss/vite`) | zustand 5 (persistido) |
| Sitios Astro | Astro 7.1 | Astro (Vite por debajo) | CSS plano + custom properties | — |

Dependencias extra del panel: `leaflet` 1.9 (selector de mapa para `stations_map`), `oxlint` (lint).

---

## 3. Referencia rápida

| Proyecto | Instalar y desarrollo | Puerto por defecto | Variable de entorno | Salida de compilación |
| :-- | :-- | :-- | :-- | :-- |
| `gnu-cms-admin` | `npm ci && npm run dev` | 5173 | `VITE_BASE_URL` | `dist/` — **SPA, necesita fallback de reescritura** |
| `landing-gnu` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — estático plano |
| `gas-gnu` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — estático plano |
| `tectuus` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — estático plano |
| `trainin` | `npm ci && npm run dev` | 4321 | `CMS_API_URL` | `dist/` — estático plano |

Astro incrementa el puerto automáticamente cuando el 4321 está ocupado, así que correr dos sitios a la vez te da 4321 y 4322. Nada fija el puerto — pasa `--port` si algún script depende de él.

### Scripts

Proyectos Astro: `dev`, `build`, `preview`, `astro`.
Panel: `dev`, `build`, `preview`, `lint` (oxlint).

**No hay ningún script de pruebas en este repositorio.** No existen pruebas unitarias, de integración ni E2E del lado del frontend. (El backend del CMS tiene pruebas de funcionalidad en PHPUnit, documentadas en las carpetas `*-docs/`, pero ese código no está en este repositorio.)

---

## 4. Variables de entorno

### Sitios Astro — `CMS_API_URL`

```env
# <project>/.env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/<site-slug>/
```

- **La diagonal final es obligatoria.** `fetch.ts` concatena cadenas tal cual: `fetch(BASE_URL + suffix)`.
- Incluye el slug del sitio — eso es lo que limita una compilación a un solo sitio.
- Se lee con `import.meta.env.CMS_API_URL` y, si falta, usa `http://localhost:3000/`.
- El origen de los medios se deriva de ella: `new URL(BASE_URL).origin + "/storage/" + path` (`mediaUrl()`).
- **Solo en tiempo de compilación.** Cambiarla en un servidor después no hace nada. Si la apuntas a otro lado → vuelve a compilar.

Valores actuales, los cuatro apuntan al mismo host:

```
landing-gnu  → .../api/public/gnu/
gas-gnu      → .../api/public/gnu-vehicular/
tectuus      → .../api/public/tectuus/
trainin      → .../api/public/traninn-logistic/
```

### Panel — `VITE_BASE_URL`

```env
# gnu-cms-admin/.env
VITE_BASE_URL=https://gnu-headless-cms.165.227.59.215.sslip.io
```

- **Solo el origen, sin diagonal final, sin `/api`.** Cada llamada agrega su propia ruta `/api/admin/...`.
- Debe llevar el prefijo `VITE_` o Vite no la expone al código del cliente.
- Se incrusta en el bundle en tiempo de compilación *y* se copia al store persistido de zustand como `tenantDomain` al iniciar sesión. Un usuario que inició sesión antes de un cambio de `VITE_BASE_URL` sigue hablando con el host **anterior** hasta que cierra sesión o limpia `localStorage` — ver §11.

### ⚠️ Nombres de variables de entorno reservados — nunca los uses

`BASE_URL`, `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`.

Son de Astro/Vite. Una entrada propia en `.env` llamada `BASE_URL` se sobrescribe en silencio con `"/"` — sin error, sin advertencia. Por eso la variable se llama `CMS_API_URL` y no el nombre más obvio.

### Higiene de secretos

- Todos los `.gitignore` de Astro incluyen `.env` — bien.
- **`gnu-cms-admin/.gitignore` no lo incluye, y `gnu-cms-admin/.env` está versionado en git.** Hoy solo contiene un hostname público, así que no se está filtrando nada, pero en cuanto alguien agregue ahí una llave, se va directo al historial. Agrega `.env` a ese `.gitignore` y versiona un `.env.example` en su lugar.

---

## 5. Desarrollo local

```bash
cd landing-gnu        # o gas-gnu / tectuus / trainin / gnu-cms-admin
npm ci
cp .env.example .env  # (todavía no existe — crea .env a mano, ver §4)
npm run dev
```

- El servidor de desarrollo de Astro **vuelve a obtener el contenido del CMS en cada petición**, así que los cambios de contenido aparecen al recargar sin reiniciar. Este es el único lugar donde los sitios se comportan de forma dinámica; producción no.
- El panel requiere login. La autenticación es `POST /api/admin/auth/login` con `{email, password}`; el `access_token` que regresa se persiste en `localStorage` bajo la llave `gnu-cms-session`.

### Servidores de desarrollo en segundo plano

Los cuatro archivos `AGENTS.md` indican el modo en segundo plano para uso automatizado/por agentes:

```bash
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

Los logs del servidor de desarrollo quedan en `<project>/.astro/dev.log`.

### Trabajar contra un CMS local

Apunta `CMS_API_URL` / `VITE_BASE_URL` a tu backend local. No hace falta cambiar nada más. Si el CMS no responde, `fetchData()` atrapa el error, lo registra en el log y regresa `undefined` — así que cada sitio cae en lo que sus componentes hagan con datos vacíos. Eso varía mucho entre sitios (ver §9), y en `trainin` significa que **la mayor parte de la página no renderiza nada, en silencio**, lo cual parece una compilación rota pero no lo es.

---

## 6. Compilación y despliegue

### 6.1 Sitios Astro

```bash
cd <project>
npm ci
npm run build      # obtiene el contenido del CMS, escribe dist/
npm run preview    # sirve dist/ localmente exactamente como se despliega
```

`dist/` es HTML/CSS/JS plano. No se necesita runtime de Node en producción.

**Nginx (VPS):**

```nginx
server {
    listen 80;
    server_name gnugas.mx www.gnugas.mx;

    root /var/www/landing-gnu/dist;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

El fallback `$uri.html` importa: Astro genera `/contacto/index.html` para `/contacto`, pero una estructura de archivos planos también puede producir `contacto.html`. Sin él, algunas rutas dan 404.

**Hosts estáticos/serverless (Vercel, Netlify, Cloudflare Pages, Azure Static Web Apps):**
- Comando de compilación `npm run build`, directorio de salida `dist`.
- Configura `CMS_API_URL` como variable de entorno **en tiempo de compilación** en la configuración del proyecto en la plataforma.
- Azure SWA: app location `/`, output location `dist`, variable en Configuration → Environment variables.
- Como cada proyecto es una app separada con raíz en un subdirectorio, configura el "root directory"/"app location" de la plataforma en esa subcarpeta — no hay configuración de monorepo que lo haga por ti.

### 6.2 La SPA del panel

```bash
cd gnu-cms-admin
npm ci
npm run build
```

`BrowserRouter` sin `basename` significa que **toda ruta debe caer en `index.html`**, o recargar en `/tectuus/productos` da 404.

**Nginx:**

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /var/www/gnu-cms-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # fallback de la SPA
    }

    location /assets/ {
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
```

**Sirve el panel solo por HTTPS** — manda un bearer token en cada petición.

**S3 + CloudFront:** hosting estático del bucket con index document *y* error document en `index.html`; detrás de CloudFront/OAC agrega una custom error response que mapee 403 y 404 → `/index.html` con HTTP 200 (un origen con OAC ignora la configuración de error document del bucket). Vuelve a desplegar con `aws s3 sync dist/ s3://bucket --delete` y luego invalida `/index.html`.

### 6.3 Publicar un cambio de contenido (de principio a fin)

1. El editor guarda en el panel → la base de datos del CMS se actualiza de inmediato.
2. Alguien corre `npm run build` en el proyecto Astro afectado → el contenido se obtiene y se incrusta en el HTML **en este momento**.
3. Se despliega `dist/`.
4. Solo hasta ahora el cambio es visible para los visitantes.

Un script mínimo de redespliegue, por sitio:

```bash
#!/usr/bin/env bash
set -euo pipefail
SITE=${1:?usage: deploy.sh <landing-gnu|gas-gnu|tectuus|trainin>}
cd "/srv/cms-frontend/$SITE"
git pull --ff-only
npm ci
npm run build
rsync -a --delete dist/ "/var/www/$SITE/dist/"
```

Ojo: `npm run build` **termina con código 0 aunque el CMS no responda** — `fetchData()` se traga el error. Un pipeline de despliegue publicará tan campante un sitio sin contenido. Si automatizas esto, agrega una verificación rápida entre la compilación y el despliegue, p. ej. hacer grep en `dist/index.html` de un texto que solo aparece cuando se renderizó contenido real del CMS, y hacer fallar el job si no está.

### 6.4 Infraestructura que todavía no existe

Conviene saberlo antes de prometer cualquier cosa:

- **No hay CI/CD.** Ni `.github/workflows`, ni `Dockerfile`, ni `docker-compose`, ni `*.toml`, ni `_redirects`, ni scripts de despliegue en ninguna parte del repositorio.
- **No hay webhook CMS→recompilación.** Las recompilaciones se disparan a mano desde el botón **Reconstruir página** del panel, que atiende `build-server/` (ver su README). Debe correr en el host que sirve los sitios; corre `npm run build` en `/var/www/html/sitios-cms/<folder>/code` (el proyecto Astro, con `node_modules` instalado) y copia `code/dist/` sobre todo lo que hay en `<folder>` excepto `code/` (carpetas: `gnu`, `gnu-gas-natural`, `traninn-logistic`, `tectuus`).
- **No hay pruebas ni linting en los proyectos Astro** (solo el panel tiene `oxlint`).
- **No hay entorno de staging** — los cuatro `.env` apuntan al único host del CMS de producción.

---

## 7. Dónde vive cada cosa

### 7.1 Sitios Astro — estructura canónica

`landing-gnu`, `gas-gnu` y `tectuus` la siguen. **`trainin` no** — ver 7.2.

```
<project>/
├── public/                     # se copia tal cual a dist/ (favicon.svg, favicon.ico)
├── src/
│   ├── assets/images/noimg.jpg # imagen de respaldo, pasa por el pipeline de assets de Astro
│   ├── components/
│   │   ├── SectionRenderer.astro   # mapea el "type" de sección del CMS → componente
│   │   └── sections/                # un componente por tipo de sección
│   ├── config/seo.ts           # nombre del sitio, títulos, dominio canónico, valores OG por defecto
│   ├── functions/fetch.ts      # cliente REST: fetchData/sendData/updateData, mediaUrl, BASE_URL
│   ├── layouts/Layout.astro    # header, nav, footer, botón flotante de WhatsApp; obtiene /menu y /globals
│   ├── pages/                  # ruteo basado en archivos
│   ├── styles/
│   │   ├── tokens.css          # design tokens (custom properties en :root)
│   │   └── global.css          # @import "./tokens.css" + todas las clases de componentes
│   └── types/                  # globals.ts, menu.ts, page.ts, catalog.ts
├── astro.config.mjs            # defineConfig({}) vacío en los cuatro
├── tsconfig.json               # extiende astro/tsconfigs/strict
├── .env
├── AGENTS.md                   # convenciones del servidor de desarrollo
└── GUIDELINES.md               # lenguaje de diseño (idéntico en los 5 proyectos)
```

Extras por proyecto:

- `tectuus`: `src/functions/catalog.ts` (obtención de productos/categorías + `formatPrice`), `src/components/ProductCatalog.astro`, `public/placeholder-plate.svg`.
- `gas-gnu`: `src/components/sections/ServiceScheduling.astro` (widget de citas, el único sitio que lo tiene).
- `landing-gnu`: además trae `inspiration/`, `gnu-docs/`, `DESIGN-apple.md`, `gaseco-schema` — todo material de borrador ignorado por git, no forma parte de la compilación.
- Cada sitio tiene una carpeta `<site>-docs/` con blueprints en Markdown que describen el contrato con el CMS (qué secciones tiene cada página, payloads de los endpoints, decisiones de los seeders). **Son la mejor referencia de la forma de la API** y vale la pena leerlos antes de tocar el renderizado de secciones.

### 7.2 `trainin` — el diferente

```
trainin/
├── assets/images/noimg.jpg     # ⚠ en la raíz del proyecto, NO en src/assets — la compilación no lo usa
├── src/
│   ├── components/             # ⚠ PLANO — sin subcarpeta sections/
│   │   ├── PageSections.astro  # ⚠ el equivalente de SectionRenderer, con otro nombre
│   │   ├── Hero.astro Clientes.astro Contacto.astro Simulador.astro …
│   │   ├── Header.astro Footer.astro WhatsAppButton.astro   # ⚠ separados del Layout
│   │   └── Servicios.astro Ubicaciones.astro   # ⚠ código muerto, nadie los importa
│   ├── functions/  fetch.ts, globals.ts, blog.ts
│   ├── layouts/Layout.astro
│   ├── pages/
│   ├── styles/
│   │   ├── tokens.css          # ⚠ tokens Y todas las clases globales en un solo archivo
│   │   └── motion.css          # animaciones reveal/stagger
│   └── types/globals.ts
├── response.json               # ⚠ volcado suelto de la API versionado en la raíz
└── (no src/config/seo.ts)      # ⚠ sin configuración de SEO — ver §9
```

Además: `trainin/package.json` **no tiene `devDependencies`** — ni `@astrojs/check`, ni `typescript` — y aun así trae un `tsconfig.json`. `npx astro check` no va a funcionar ahí hasta que se agreguen.

### 7.3 El panel

```
gnu-cms-admin/
├── src/
│   ├── main.jsx                # raíz de React + <BrowserRouter>
│   ├── App.jsx                 # todo el árbol de <Routes> — manual, sin ruteo por archivos
│   ├── index.css               # literalmente solo: @import "tailwindcss";
│   ├── components/
│   │   ├── form-fields.jsx     # Field, ImageField, CharHint, WordHint, DynamicItem,
│   │   │                       #   AddButton, fieldError, inputClass, MAX_UPLOAD_BYTES
│   │   ├── page-sections-editor.jsx   # ★ el editor de secciones compartido (ver abajo)
│   │   └── card.jsx
│   ├── functions/fetch.jsx     # todas las llamadas REST, todos los endpoints del panel
│   ├── store/sessionStore.jsx  # zustand + persist → localStorage "gnu-cms-session"
│   └── pages/
│       ├── login/  home/
│       ├── gnu/           # editores de landing-gnu  (site=gnu)
│       ├── gas-natural/   # editores de gas-gnu      (site=gnu-vehicular)
│       ├── trainin/       # editores de trainin      (site=traninn-logistic)
│       └── tectuus/       # editores de tectuus      (site=tectuus)
└── vite.config.js          # plugins react() + tailwindcss(), nada más
```

**El ruteo es manual.** Agregar una página al panel implica crear `src/pages/<path>/index.jsx` *y* registrar una `<Route>` en `App.jsx`. No hay router basado en el sistema de archivos.

**`page-sections-editor.jsx` es el caballo de batalla.** Exporta:
- `PageSectionsEditor` — página completa con liga de regreso + título. La mayoría de las páginas del panel son un wrapper de 10 líneas alrededor de él.
- `SectionsFields` — variante sin chrome, embebida en páginas que también muestran sus propios datos (bandeja de leads, citas, catálogo de productos).

Sus props:

| Prop | Propósito |
| :-- | :-- |
| `site` | slug del sitio en el CMS |
| `page` | slug de la página para el query `?page=` |
| `pageId` | id **numérico** de la página; filtra del lado del cliente. Es obligatorio porque la API ignora `?page=` en algunos sitios y regresa todas las secciones de todo el sitio |
| `includeGlobals` | conserva también las secciones con `page_id: null` (`contact_info`, `social_icons`, `whatsapp_button`) — pásalo en exactamente una página por sitio |
| `title`, `backTo` | chrome |

Registra editores para 13 tipos de sección: `page_hero`, `feature_grid`, `rich_text`, `clients_showcase`, `stations_map`, `lead_capture_form`, `service_scheduling`, `banner_carousel`, `savings_simulator`, `contact_info`, `social_icons`, `whatsapp_button`, `image_gallery`. **Cualquier otro tipo cae en un volcado JSON de solo lectura** — ese es el síntoma a buscar cuando un tipo de sección nuevo aparece sin estilo en el panel.

`pages/gas-natural/inicio/index.jsx` es anterior al componente compartido y **trae su propia copia privada de seis editores de sección**, incluido un editor de `testimonials` que el componente compartido no tiene. Los cambios a los editores compartidos no se propagan ahí.

### 7.4 "¿Dónde cambio X?"

| Cambio | Archivo |
| :-- | :-- |
| Colores de marca, fuentes, radios, sombras (de un sitio) | `<site>/src/styles/tokens.css` |
| Clases de componentes, layout, breakpoints (de un sitio) | `<site>/src/styles/global.css` (`trainin`: `tokens.css` + `<style>` por componente) |
| Sufijo del `<title>` de la página, dominio canónico, valores OG por defecto | `<site>/src/config/seo.ts` (**no existe en `trainin`**) |
| Nav del header, columnas del footer, botón flotante de WhatsApp | `<site>/src/layouts/Layout.astro` (`trainin`: `components/Header.astro`, `Footer.astro`, `WhatsAppButton.astro`) |
| Qué componente renderiza un tipo de sección del CMS | `<site>/src/components/SectionRenderer.astro` (`trainin`: `components/PageSections.astro`) |
| Cómo se ve un tipo de sección | `<site>/src/components/sections/<Type>.astro` |
| URL base del CMS, resolución de URLs de medios | `<site>/src/functions/fetch.ts` |
| Agregar una ruta | archivo nuevo en `<site>/src/pages/` |
| Favicon | `<site>/public/favicon.svg` + `favicon.ico` |
| Campos del formulario del panel para un tipo de sección | `gnu-cms-admin/src/components/page-sections-editor.jsx` |
| Primitivas de input del panel, límites de carga, contadores de caracteres | `gnu-cms-admin/src/components/form-fields.jsx` |
| Llamadas a la API del panel | `gnu-cms-admin/src/functions/fetch.jsx` |
| Rutas del panel | `gnu-cms-admin/src/App.jsx` |

---

## 8. Temas y CSS

### 8.1 Sitios Astro — basados en tokens

Cada sitio tiene su propio `src/styles/tokens.css` que define custom properties en `:root`, importado con `@import` al inicio de `global.css`, que a su vez `Layout.astro` importa una vez. **No hay Tailwind en los sitios públicos** — es CSS plano con nombres de clase estilo BEM.

Grupos de tokens (consistentes entre sitios, los valores cambian):

```
--font-display / --font-body        familias tipográficas
--text-h1 / --text-h2 / …           escala tipográfica fluida, clamp()
--color-bg / --color-bg-alt         fondos de página
--color-ink / --color-ink-2         superficies oscuras (heroes, footers)
--color-primary / -alt / -light     marca
--color-accent                      marca secundaria
--color-text / -60 / -40            texto sobre claro
--color-text-on-dark / -70 / -45    texto sobre oscuro
--color-border / -hover / -on-dark  líneas finas
--radius-sm … --radius-full         radios de esquina
--shadow-float / -cta / -card       elevación
--ease-out                          curva de movimiento
```

Paletas actuales:

| Sitio | Primario | Ink | Acento | Fuentes |
| :-- | :-- | :-- | :-- | :-- |
| `landing-gnu` / `gas-gnu` | `#1657c4` azul | `#0b2b5c` azul marino | `#4fa3e3` | fuentes del sistema |
| `tectuus` | `#163a64` azul marino | `#0a1e35` | `#2fa84c` verde + `#3ec6ef` cian "pluma" | **Archivo + IBM Plex Sans** (Google Fonts) |
| `trainin` | `#c8102e` rojo | `#201d1e` casi negro | — | fuentes del sistema |

**Para cambiar la marca de un sitio:** edita solo `tokens.css`. Ese es el punto de corte previsto y casi siempre funciona — pero revisa primero, porque no es hermético:

- `gas-gnu/src/styles/global.css` tiene en duro `rgba(11, 43, 92, …)` en el degradado del velo del page-hero en vez de usar `--color-ink`.
- Los bloques `<style>` de los componentes de `trainin` tienen en duro `rgba(200, 16, 46, …)` (el rojo) en varios lugares.
- El verde de WhatsApp `#25d366` está en duro en todos los sitios — es correcto, es un color de marca de terceros.
- `tectuus` carga sus fuentes con un `<link>` a Google Fonts en `Layout.astro`, no por tokens. Cambiar la familia implica editar tanto `tokens.css` como ese link.

Verificación práctica después de cambiar un token: `grep -n "#[0-9a-fA-F]\{6\}\|rgba(" src/styles/global.css src/components/**/*.astro` y confirma que cada literal restante es intencional.

`tectuus` merece una advertencia: su lenguaje de diseño es deliberado (el cian se usa *solo* como líneas de 1px y marcas de graduación, nunca como relleno; el verde significa "acción" y nada decorativo es verde). La justificación está escrita al inicio de su `tokens.css`. Léela antes de cambiar colores.

### 8.2 El panel — Tailwind v4, sin tema

`index.css` es una sola línea: `@import "tailwindcss";`. **No hay `tailwind.config.js` ni bloque `@theme`**, así que no hay design tokens registrados en Tailwind. Cada color de marca es un valor arbitrario en línea:

```
#863bff  ×36   morado de marca
#0b0611  ×25   fondo
#47bfff  ×16   final del degradado
#8900ff  ×10   …
```

repartidos en 10 archivos. `GUIDELINES.md` los documenta como custom properties de CSS, pero **ese mapeo nunca se implementó** — los tokens de ese documento no existen en el código.

Consecuencia: **hoy, cambiar la marca del panel es un buscar-y-reemplazar en 10 archivos.** Si darle tema al panel está en el roadmap, el arreglo es pequeño y vale la pena hacerlo primero — agrega un bloque `@theme` a `index.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand:      #863bff;
  --color-brand-alt:  #47bfff;
  --color-ink:        #0b0611;
}
```

y luego reemplaza `bg-[#0b0611]` → `bg-ink`, `from-[#863bff]` → `from-brand`, etc. Después de eso el panel toma su tema de un solo bloque, como los sitios lo toman de `tokens.css`.

### 8.3 Lenguaje de diseño compartido

`GUIDELINES.md` es idéntico byte por byte en los cinco proyectos (265 líneas): tokens, tipografía, botones, tarjetas, campos de formulario, con equivalentes de Tailwind entre paréntesis. Describe el lenguaje oscuro y morado del **panel** — cada sitio público se fue deliberadamente por su propia paleta. No lo tomes como la especificación de los sitios públicos.

---

## 9. Diferencias de comportamiento por sitio que importan en la operación

Estas son las cosas que hacen que "funciona en el sitio A" no aplique al sitio B.

| | `landing-gnu` | `gas-gnu` | `tectuus` | `trainin` |
| :-- | :-- | :-- | :-- | :-- |
| Comportamiento sin contenido | respaldos | **muchos respaldos** | portada de respaldo completa | **ninguno — los bloques desaparecen** |
| Placeholder de imagen faltante | `noimg.jpg` gris | `noimg.jpg` gris | `placeholder-plate.svg` placa en blanco | no se renderiza nada |
| `src/config/seo.ts` | sí | sí | sí | **no** |
| Etiquetas OG / canonical | sí | sí | sí | **ninguna** |
| Blog | sí | sí | no | sí |
| Catálogo de productos | no | no | **sí** | no |
| Widget de citas | no | **sí** | no | no |
| Simulador de ahorro | sí | sí | no | sí |
| Globales editables en el panel | sí | **no** | sí | sí |

Dos consecuencias que vale la pena interiorizar:

- En **`trainin`**, una respuesta vacía del CMS produce una página casi en blanco en lugar de una llena de placeholders. Cuando estés depurando una compilación de `trainin` que "perdió su contenido", revisa la API primero — el sitio se está comportando como fue diseñado.
- En **`gas-gnu`**, lo contrario: la portada renderiza testimonios falsos, una franja de blog falsa y un ahorro del 60% en duro cuando el CMS está vacío. Una compilación con la API rota **se ve bien**. Por eso la verificación rápida de §6.3 importa sobre todo para este sitio.

---

## 10. Tareas comunes

### Agregar un tipo de sección nuevo del CMS de punta a punta

1. El **backend** declara el tipo y su esquema (no está en este repositorio).
2. **Sitio público** — agrega un componente en `src/components/sections/` y luego un `case "<type>":` en `SectionRenderer.astro` (`PageSections.astro` en `trainin`). Los tipos desconocidos se omiten en silencio, así que el sitio nunca se rompe mientras trabajas.
3. **Panel** — escribe un `<Type>Editor({ content, onChange, errors })` en `page-sections-editor.jsx`, regístralo en `SECTION_EDITORS` y agrega una etiqueta en español en `SECTION_LABELS`. Mientras no lo hagas, el panel muestra un volcado JSON de solo lectura.
4. Repite el paso 2 en **cada sitio** que vaya a usar el tipo — no hay un paquete de componentes compartido.
5. Si la portada de `gas-gnu` lo necesita, agrégalo también a la **copia privada** en `pages/gas-natural/inicio/index.jsx`.
6. Actualiza el `DOCUMENTACION-CONTENIDO-*.txt` correspondiente con los tamaños de imagen y los límites de caracteres.

### Agregar una página a un sitio público

1. El backend crea la página + sus secciones y la publica (`is_published`). El endpoint `/menu` se deriva de la tabla `pages`, así que la navegación se actualiza sola.
2. Crea `src/pages/<path>/index.astro` — copia una página interior existente; todas tienen ~20 líneas: obtienen `pages/<slug>` y le pasan `sections` al renderer.
3. **La ruta de Astro y el slug del CMS son independientes.** p. ej. `gas-gnu/src/pages/nuestros-servicios/instala-tu-equipo-de-gnv/cotiza-tu-equipo.astro` obtiene `pages/cotiza-tu-equipo`. Si te equivocas obtienes una página vacía, no un error.
4. Panel: agrega `src/pages/<site>/<page>/index.jsx` envolviendo `PageSectionsEditor` con los `site`, `page`, **`pageId`** y `backTo` correctos; registra la `<Route>` en `App.jsx`; agrégala a la lista de `select-page.jsx` de ese sitio.

Cómo encontrar el `pageId` numérico: `GET /api/admin/sections?site=<slug>` con un bearer token y lee el `page_id` de la sección que pertenece a tu página. Omitir `pageId` es lo que causa el bug de Contacto de `trainin` en §11.

### Agregar un quinto sitio

1. `npm create astro@latest -- --template minimal`, luego copia `src/functions/fetch.ts`, `src/types/`, `src/config/seo.ts`, `src/styles/`, `Layout.astro` y `SectionRenderer.astro` de **`tectuus`** — es el más completo y el más consistente de los cuatro.
2. Crea `.env` con el `CMS_API_URL` del sitio nuevo.
3. Panel: carpeta nueva `src/pages/<site>/`, un `select-page.jsx`, rutas en `App.jsx` y una tarjeta en `pages/home/index.jsx`.
4. Copia `GUIDELINES.md` y `AGENTS.md`; dale un `README.md` de verdad, siguiendo el de los otros sitios.

---

## 11. Trampas conocidas

Ordenadas más o menos por cuánto tiempo te van a costar.

1. **La paginación del blog está rota en las compilaciones estáticas** — `landing-gnu/src/pages/blog/index.astro:32` y `gas-gnu/src/pages/blog/index.astro:32` leen `Astro.url.searchParams.get("page")`. Sin adaptador SSR, los search params están vacíos en tiempo de compilación, así que cada liga `?page=N` sirve el HTML de la página 1. O agregas `getStaticPaths` con rutas reales `/blog/page/N`, o paginas del lado del cliente como `ProductCatalog.astro` de `tectuus` maneja `?category=`.
2. **`handleUnauthorized()` se llama pero nunca se define** — `gnu-cms-admin/src/functions/fetch.jsx:345`. Ante un 401 lanza un `ReferenceError`, que atrapa el `catch` externo, el cual dispara `alert('Error al obtener datos ', error)`. Por eso un token expirado muestra una alerta genérica en vez de redirigir al login. O la defines (limpiar el token, navegar a `/login`) o quitas esa rama.
3. **`SectionsFields` sin `pageId` muestra todas las secciones de todo el sitio** — la API ignora `?page=` por lo menos para `traninn-logistic`. `pages/trainin/contacto/index.jsx:129` lo omite, así que esa pantalla deja que un editor modifique la portada creyendo que está editando `/contacto`. Todas las demás pantallas pasan un `pageId`.
4. **El `PUT` de secciones es un reemplazo completo, no un patch** — `PUT /api/admin/sections/{id}` recibe el objeto `content` completo, y los arreglos (`slides`, `items`, `logos`) se reemplazan enteros. Por eso cada editor guarda el objeto de contenido completo en su estado local. Si mandas un objeto parcial, borras el resto.
5. **Nada de lógica compartida en el frontmatter de `.astro`** — deja las funciones reutilizables en `.ts` plano dentro de `src/functions/`. Astro limita el alcance de los `const`/`let` de nivel superior por componente de una forma que deja una constante en `undefined` dentro de un `export function` del mismo frontmatter. (`landing-gnu/functions/fetch.astro` — un archivo vacío de 0 bytes en la raíz de ese proyecto, fuera de `src/` — es lo que quedó de ese intento abandonado; se puede borrar sin problema.)
6. **Nombres de variables de entorno reservados** — §4. Se sobrescriben en silencio, sin error.
7. **`dist/` está versionado en git** (84 archivos entre los cinco proyectos). La línea `# dist/` en cada `.gitignore` está comentada. Las compilaciones generan ruido en los diffs y pueden desplegarse desactualizadas. Descoméntala y corre `git rm -r --cached */dist` cuando alguien tenga tiempo de coordinarlo.
8. **`gnu-cms-admin/.env` está versionado** — §4.
9. **Un `tenantDomain` viejo sobrevive a un cambio de configuración** — se persiste en `localStorage` al iniciar sesión. Cambiar `VITE_BASE_URL` no mueve las sesiones existentes. Pide a los usuarios que cierren sesión, o versiona el store de zustand.
10. **`trainin` no tiene devDependencies** — `npx astro check` no corre ahí.
11. **Dos archivos de ruta sueltos publican basura en `trainin`** — `src/pages/nosotros/index.astro` contiene el texto literal `sobre nosotros`, `src/pages/servicios/index.astro` contiene `serv`. Las dos son rutas en vivo. Bórralas.
12. **Archivos sueltos versionados en la raíz de los proyectos** — `trainin/response.json` (un volcado de la API), `trainin/assets/images/noimg.jpg` (fuera de `src/`, así que la compilación no lo usa) y el `landing-gnu/functions/fetch.astro` vacío.
13. **Los favicons son el ícono de ejemplo de Astro en los cuatro sitios**, idénticos byte por byte. En `tectuus` ese archivo también se usa como **logo** del header/footer, así que el cohete de Astro aparece en todas las páginas.
14. **Los editores del panel para la portada de `gas-gnu` son un fork privado** — `pages/gas-natural/inicio/index.jsx` duplica seis editores de sección. Los arreglos a los compartidos no le llegan.
15. **La compilación termina con código 0 cuando falla el CMS** — §6.3.

---

## 12. Superficie de la API

Base: `https://gnu-headless-cms.165.227.59.215.sslip.io`

### Pública — sin auth, solo lectura, se consume en tiempo de compilación

`{base}/api/public/{site}/…`

| Endpoint | Lo usa |
| :-- | :-- |
| `pages/{slug}` | todas las páginas — regresa `{slug, path, title, sections[]}` |
| `menu` | nav + footer de `Layout.astro` |
| `globals` | información de contacto, redes sociales, botón de WhatsApp |
| `blog?page=N`, `blog/{slug}` | `landing-gnu`, `gas-gnu`, `trainin` |
| `product-categories`, `products?page=N`, `products/{slug}` | solo `tectuus` |
| `stations` | pines del mapa de `gas-gnu`, `trainin` |
| `savings-simulator?fuel=&quantity=` | `gas-gnu` (cálculo del lado del servidor) |
| `appointments/availability?station=&date=` | solo `gas-gnu` |

**Escrituras** públicas (las únicas dos, ambas con rate limit `throttle:10,1` — 10 peticiones/min/IP):

- `POST leads` — `{name, email, phone, message, source, details{}}`. `source` debe coincidir con el slug de una página publicada o da 422. Todo lo que no sea uno de los cuatro campos base debe ir anidado en `details` y se valida contra los `fields[]` declarados en ese formulario.
- `POST appointments` — solo `gas-gnu`.

### Admin — `Authorization: Bearer <jwt>`

`{base}/api/admin/…`

`auth/login`, `auth/logout`, `sections` (index/show/**solo update** — sin create/delete), `pages` (solo actualizar `is_published`), `blog-posts` (CRUD completo), `product-categories` (CRUD completo, **409** al borrar si todavía tiene productos), `products` (CRUD completo), `leads` (lectura), `appointments` (lectura + borrado), `media` (POST multipart, regresa una `url` absoluta lista para usarse).

**El contrato de editabilidad**, que se aplica del lado del servidor y que conviene entender antes de prometer una funcionalidad: el panel administra *datos*, nunca *estructura*. Las secciones no se pueden crear, borrar, reordenar ni cambiar de tipo. Las páginas no se pueden crear, borrar, renombrar ni cambiar de ruta — solo publicar/despublicar. `lead_capture_form.fields` está excluido a propósito del esquema de actualización para que `array_merge` conserve el valor del seeder. Cualquier cosa estructural es un cambio de seeder en el backend.

**Cargas:** `MAX_UPLOAD_BYTES = 5 MB`, se valida del lado del cliente en `form-fields.jsx` antes de la petición y el servidor lo aplica de forma estricta. `ImageField` además mide y reporta el ancho/alto y advierte arriba de 2 MB. No hay compresión ni redimensionado en ningún lado — lo que se sube es lo que se publica.

---

## 13. Prioridades sugeridas

Baratas y de alto valor, más o menos en orden:

1. Arreglar `handleUnauthorized` (#2) y el `pageId` faltante en Contacto de `trainin` (#3) — los dos son de una línea y tienen impacto real en los usuarios.
2. Borrar las rutas sueltas de `trainin` y `response.json` (#11, #12).
3. Agregar `.env` al `.gitignore` del panel y entregar un `.env.example` (#8).
4. Sacar `dist/` del control de versiones (#7).
5. Poner favicons reales (#13) — eso también resuelve el problema del logo de `tectuus`.
6. Agregar `@theme` al `index.css` del panel (§8.2) antes de que llegue cualquier petición de cambio de marca.
7. Agregar `src/config/seo.ts` a `trainin`.
8. Conectar un job de CI que compile los cuatro sitios en cada push, con la verificación rápida de contenido de §6.3 — eso solo habría atrapado casi todo lo que hay en §11.
