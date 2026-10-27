# GNU CMS Frontend — Documentación del monorepo

Este repositorio contiene la mitad frontend del sistema headless CMS de GNU: un **panel de administración** donde los editores de contenido inician sesión, cuatro **sitios públicos de marketing** que leen lo que el panel publica y un pequeño **servicio de compilación** que vuelve a generar esos sitios bajo demanda. Todo se comunica por REST con la misma API de un CMS headless en Laravel.

```
cms-frontend/
├── gnu-cms-admin/   # Panel de administración React + Vite (requiere login) — los editores administran los cuatro sitios aquí
├── landing-gnu/     # Sitio público Astro — GNU corporativo (gnugas.mx)                      — slug del CMS `gnu`
├── gas-gnu/         # Sitio público Astro — GNU Vehicular (gas natural vehicular)             — slug del CMS `gnu-vehicular`
├── tectuus/         # Sitio público Astro — Tectuus (equipo industrial + catálogo de productos) — slug del CMS `tectuus`
├── trainin/         # Sitio público Astro — Traninn Logistic                                  — slug del CMS `traninn-logistic`
├── build-server/    # Servicio Node sin dependencias detrás del botón "Reconstruir sitio" del panel
├── DEVOPS.md        # Manual de operación para desarrolladores y quien despliega
├── DOCUMENTACION-CONTENIDO-*.txt   # Guías de contenido (tamaños de imagen y longitud de textos) por sitio
└── cms-backend/     # CMS headless Laravel + SQLite — repositorio aparte (gitlink), no forma parte del historial de este repo
```

> `cms-backend` vive en su propio repositorio, con su propia documentación. Aquí solo se describe lo que el frontend necesita saber de él (endpoints, slugs, reglas de edición).

## Índice

- [Cómo encajan las piezas](#cómo-encajan-las-piezas)
- [Identificadores de sitio](#identificadores-de-sitio--cuatro-nombres-para-los-mismos-cuatro-sitios)
- [Estado de los proyectos](#estado-de-los-proyectos)
- [Resumen por proyecto](#resumen-por-proyecto)
- [La API del CMS desde el frontend](#la-api-del-cms-desde-el-frontend)
- [Para desarrolladores](#para-desarrolladores)
- [Para el webmaster](#para-el-webmaster)
- [Publicar un cambio de contenido](#publicar-un-cambio-de-contenido)
- [Mapa de la documentación](#mapa-de-la-documentación)

## Cómo encajan las piezas

```
┌────────────────┐   los editores inician    ┌────────────────────┐
│  gnu-cms-admin  │ ───── sesión y editan ──▶ │  cms-backend        │
│  (SPA React)    │   REST + bearer token     │  (Laravel headless) │
└───────┬────────┘                            └─────────┬──────────┘
        │ "Reconstruir sitio"                           │ REST, sin auth,
        ▼ (bearer token)                                │ solo lectura, en COMPILACIÓN
┌────────────────┐   corre `npm run build`    ┌─────────▼──────────┐
│  build-server   │ ────────────────────────▶ │  Sitios Astro       │
│  (Node)         │   y copia dist/ a la      │  landing-gnu,       │
└────────────────┘   carpeta publicada       │  gas-gnu, tectuus,  │
                                              │  trainin → dist/    │
                                              └─────────┬──────────┘
                                                        ▼
                                            publicados al público,
                                            sin login ni contraseña
```

- **`gnu-cms-admin`** es una SPA de React protegida con contraseña. Los editores inician sesión una vez y administran secciones de página, entradas de blog, leads de contacto, estaciones, citas de verificación y (solo Tectuus) un catálogo de productos de los cuatro sitios. Cada petición lleva un bearer token; un `401` regresa al editor a `/login`. Es la **única** parte del sistema que requiere autenticación.
- **Los sitios Astro** son **sitios estáticos totalmente públicos, sin autenticación**. Cada uno lee la API pública de su sitio (`/api/public/<slug-del-cms>/`) **solo en tiempo de compilación** (`npm run build`). No tienen login, panel ni sesión, y tampoco hay borradores: todo lo que un editor guarda queda visible para cualquiera en la siguiente compilación.
- Como los sitios Astro son estáticos (sin adaptador SSR), **una edición de contenido en el panel no aparece en el sitio en vivo hasta que ese sitio se vuelve a compilar y desplegar.** Es el dato operativo más importante tanto para desarrolladores como para el webmaster — ver [Publicar un cambio de contenido](#publicar-un-cambio-de-contenido).
- Algunas llamadas sí ocurren en vivo desde el navegador del visitante: el formulario de leads (`POST leads`), el simulador de ahorro (`GET savings-simulator`) y, en `gas-gnu`, la agenda de verificación (`appointments`). Por eso el CMS debe permitir (CORS) el origen de cada sitio.
- **`build-server`** es el puente: el panel no puede correr `npm run build` desde un navegador, así que le pide a este servicio que lo haga en la máquina que sirve los sitios.

## Identificadores de sitio — cuatro nombres para los mismos cuatro sitios

El mismo sitio se nombra distinto según la capa. Equivocarse aquí es la causa más común de una página que, sin dar error, no muestra nada.

| Sitio | Proyecto Astro | Prefijo de ruta en el panel | `site` slug del CMS (API + `CMS_API_URL`) | `:site` de `build-server` | `site_id` en el panel |
| :-- | :-- | :-- | :-- | :-- | :-- |
| GNU corporativo | `landing-gnu` | `gnu` | `gnu` | `gnu` | 1 |
| GNU Vehicular | `gas-gnu` | `gas-natural` | `gnu-vehicular` | `gas-natural` | 2 |
| Traninn Logistic | `trainin` | `trainin` | `traninn-logistic` | `trainin` | 3 |
| Tectuus | `tectuus` | `tectuus` | `tectuus` | `tectuus` | 4 |

Ojo con la ortografía de Traninn/Trainin: la carpeta, la marca, el slug del CMS y las variables de `build-server` (`VITE_TRANINN_*`) no coinciden. No "corrijas" uno sin los demás.

Ver [`gnu-cms-admin/README.md`](./gnu-cms-admin/README.md#identificadores-de-sitio--cuatro-nombres-para-los-mismos-cuatro-sitios) para los detalles del lado del panel (llaves del store `pageUrls`, prefijos de variables de `build-server`).

## Estado de los proyectos

| Proyecto | Rol | Estado |
| :--- | :--- | :--- |
| [`gnu-cms-admin`](./gnu-cms-admin/README.md) | Panel de administración (los cuatro sitios, un solo login) | Activo — editores de secciones, blog, leads, estaciones, citas, catálogo de Tectuus, botón "Reconstruir sitio" |
| [`landing-gnu`](./landing-gnu/README.md) | Sitio público — GNU corporativo | En vivo, completo — la **implementación de referencia** para los demás sitios Astro |
| [`gas-gnu`](./gas-gnu/README.md) | Sitio público — GNU Vehicular | Conectado al CMS (`CmsPage`/`SectionRenderer`, blog, contacto, nuestros-servicios, ubicaciones + agenda tu verificación) |
| [`tectuus`](./tectuus/README.md) | Sitio público — Tectuus | Conectado al CMS (inicio, sobre-nosotros, contacto, catálogo de productos con `productos/[slug]`). Sin blog |
| [`trainin`](./trainin/README.md) | Sitio público — Traninn Logistic | Conectado al CMS (inicio, nuestros-servicios, sobre-nosotros, ubicaciones, blog, contacto). Usa su propio esquema de componentes (`PageSections`, sin `SectionRenderer`) |
| [`build-server`](./build-server/README.md) | Servicio de recompilación para el botón "Reconstruir sitio" | Activo |
| `cms-backend` | CMS headless en Laravel | Repositorio aparte, clonado aquí solo por comodidad |

Al extender `gas-gnu`, `tectuus` o `trainin`, sigue el patrón que ya funciona en `landing-gnu` (`src/functions/fetch.ts`, `src/lib/cms.ts`, `CmsPage.astro` + `SectionRenderer.astro`, la carga de contenido global en `Layout.astro`) en lugar de reinventarlo — [`landing-gnu/README.md`](./landing-gnu/README.md) es la referencia actualizada. Los cinco proyectos frontend comparten un mismo lenguaje visual documentado en su `GUIDELINES.md` (copia idéntica en cada uno — colores de tokens, botones, tarjetas, campos de formulario).

## Resumen por proyecto

Cada README de proyecto tiene el detalle completo; esto es lo esencial para ubicarse.

### `gnu-cms-admin` — panel de administración

- **Stack:** React 19 + Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`, sin archivo de configuración), `react-router` v8 (importar de `"react-router"`), zustand 5 con `persist` (sesión y URLs públicas por sitio), Leaflet para elegir estaciones en el mapa, `oxlint` para lint.
- **Cliente REST:** `src/functions/fetch.jsx`. Sesión en `src/store/sessionStore.jsx` (solo se guarda `accessToken`); cualquier `401` limpia la sesión y redirige a `/login`.
- **Edición de secciones:** casi todas las pantallas usan `PageSectionsEditor` (`page-sections-editor.jsx`): carga las secciones de una página, muestra un editor por `type` y hace `PUT` del `content` **completo** al guardar (no es un parche). Un `type` sin editor se muestra como JSON de solo lectura.
- **Secciones globales** (`contact_info`, `social_icons`, `whatsapp_button`, `testimonials`) tienen `page_id: null` y se editan desde la página de inicio de cada sitio (`includeGlobals`).
- **Límites conocidos:** no se pueden editar títulos de página ni el menú, no se pueden crear secciones nuevas y no hay biblioteca de medios para explorar o borrar archivos subidos. Las imágenes se limitan a 5 MB y no se comprimen.

### `landing-gnu` — GNU corporativo (referencia)

- Capa de acceso al CMS tipada y memoizada en `src/lib/cms.ts` (`getPage`, `getMenu`, `getGlobals`, `getBlogList`, `childrenOf`, …): una petición por endpoint en toda la compilación.
- La mayoría de las rutas son un solo `<CmsPage slug="…" />`; `SectionRenderer.astro` asigna cada `type` de sección a su componente en `src/components/sections/`.
- Ajustes del lado del frontend: etiquetas de navegación (`src/config/labelOverrides.ts`), orden de submenús (`src/config/menuOrder.ts`), `excludeTypes` por página y el contenido de Certificaciones mientras el CMS no tenga los campos (ver `NEW-FIELDS.md` y `certificaciones_images/CAMPOS-BACKEND.md`).
- Rutas: inicio, nuestros-servicios (gnv, gnc, gnd), sobre-nosotros (4 subpáginas), desarrollo-sostenible (4 subpáginas), blog y contacto.

### `gas-gnu` — GNU Vehicular

- Misma arquitectura que `landing-gnu` (`CmsPage`, `SectionRenderer`, `src/lib/cms.ts`).
- Componentes con llamadas en vivo: `LeadCaptureForm` (`POST leads`), `SavingsSimulator` (`GET savings-simulator`) y `ServiceScheduling` (`GET appointments/availability`, `POST appointments`) en `/ubicaciones/agenda-tu-verificacion`.
- Panel flotante "Calcula tu ahorro" en todas las páginas, alimentado por la sección `savings_simulator` de la página de inicio.
- **Tiene muchos respaldos (fallbacks) en duro:** si el CMS no responde durante la compilación, el sitio se ve "lleno" con contenido de relleno. Revisa el log de compilación (`Error fetching data`) antes de desplegar. Lo que está en duro se documenta en `gas-gnu/technical_debt.md`.

### `tectuus` — Tectuus

- Sin capa memoizada: las páginas llaman directamente a `src/functions/fetch.ts` y `src/functions/catalog.ts`.
- **Catálogo de productos:** `/productos` recibe todas las categorías y productos activos en compilación y filtra en el navegador (búsqueda sin acentos, filtros en la URL como `/productos?category=edrm`); `/productos/[slug]` genera una página estática por producto activo.
- **Orden del catálogo:** el CMS no tiene campo de orden, así que los editores usan un prefijo numérico en el nombre (`1 - EDRM`, `2 - Compresores`). El prefijo nunca se muestra en el sitio.
- Imágenes faltantes o rotas se sustituyen por `public/placeholder-plate.svg`. Sin blog.

### `trainin` — Traninn Logistic

- **No** usa `CmsPage`/`SectionRenderer`/`src/lib/cms.ts`: cada ruta hace `fetchData("pages/{slug}")` y pasa las secciones a `PageSections.astro`. Sin memoización.
- El elemento "Blog" del menú se agrega en `Header.astro` (el menú del CMS no lo incluye).
- **Sin respaldos:** si el CMS no responde, los bloques simplemente desaparecen. Tampoco tiene `src/config/seo.ts` ni etiquetas OG/canonical.
- Hay rutas de relleno (`/nosotros/`, `/servicios/`) y componentes sin uso (`Servicios.astro`, `Ubicaciones.astro`) — ver `trainin/README.md` y `trainin/technical_debt.md`.

### `build-server` — botón "Reconstruir sitio"

- Servicio Node sin dependencias (`server.mjs`), en `127.0.0.1:4400` detrás de nginx (`/build-server/`), corriendo como el usuario `frontend` bajo systemd.
- Flujo: valida el token del editor contra el CMS → corre `npm run build` en el `CODE_PATH` del sitio → verifica `dist/index.html` → **borra todo** en `PUBLIC_PATH` y copia `dist/`.
- Un build a la vez por sitio (`409` si ya hay uno), pero varios sitios pueden compilar al mismo tiempo (cada uno puede usar 1 GB+ de RAM). La publicación no es atómica y no hay rollback automático.
- Configuración en `build-server/.env` (`VITE_<SITIO>_CODE_PATH`, `VITE_<SITIO>_PUBLIC_PATH`, `ALLOWED_ORIGINS`, `CMS_BASE_URL`); un sitio sin rutas configuradas falla de forma segura con un error claro. La lista de sitios está fija en `SITES` de `server.mjs`.

### Diferencias entre sitios que importan al operar

| | `landing-gnu` | `gas-gnu` | `tectuus` | `trainin` |
| :-- | :-- | :-- | :-- | :-- |
| Si falta contenido del CMS | respaldos | **muchos respaldos** | inicio de respaldo completo | **ninguno — los bloques desaparecen** |
| Capa de acceso al CMS | `src/lib/cms.ts` (memoizada) | `src/lib/cms.ts` (memoizada) | `fetch.ts` + `catalog.ts` | `fetch.ts` directo |
| Blog | sí | sí | no | sí |
| Catálogo de productos | no | no | **sí** | no |
| Agenda de verificación | no | **sí** | no | no |
| Simulador de ahorro | sí | sí | no | sí |
| `src/config/seo.ts` | sí | sí | sí | **no** |
| Ver ediciones del CMS en `npm run dev` | reiniciar el servidor | reiniciar el servidor | recargar la página | recargar la página |

## La API del CMS desde el frontend

Base: `https://gnu-headless-cms.165.227.59.215.sslip.io` (el detalle completo vive en la documentación de `cms-backend`).

**Pública** — `{base}/api/public/{site}/…`, sin auth, solo lectura, se consume en compilación:

| Endpoint | Lo usa |
| :-- | :-- |
| `pages/{slug}` | todas las páginas — regresa `{slug, path, title, sections[]}` |
| `menu` | navegación y footer |
| `globals` | datos de contacto, redes sociales, botón de WhatsApp, testimonios |
| `blog?page=N`, `blog/{slug}` | `landing-gnu`, `gas-gnu`, `trainin` |
| `product-categories`, `products?page=N`, `products/{slug}` | solo `tectuus` |
| `stations` | mapas de `gas-gnu`, `trainin` (y `landing-gnu`) |
| `savings-simulator?…` | simuladores (en vivo, desde el navegador) |
| `appointments/availability?station=&date=` | solo `gas-gnu` |

Escrituras públicas (limitadas a 10 peticiones/min por IP): `POST leads` (`source` debe ser el slug de una página publicada o responde `422`; campos extra van en `details`) y `POST appointments` (solo `gas-gnu`).

**Admin** — `{base}/api/admin/…` con `Authorization: Bearer <jwt>`: `auth/login`, `auth/logout`, `sections` (solo consulta y actualización), `pages` (solo `is_published`), `blog-posts`, `product-categories`, `products` (CRUD completo), `leads` (lectura), `appointments` (lectura y borrado), `media` (subida multipart).

**Regla de edición:** el panel administra *datos*, nunca *estructura*. Las secciones no se pueden crear, borrar, reordenar ni cambiar de tipo, y las páginas no se pueden crear, borrar ni renombrar — solo publicar/despublicar. Cualquier cambio estructural es un cambio en el backend (migración), no en el panel. No correr los seeders en producción: sobrescriben lo editado desde el panel.

## Para desarrolladores

Cada proyecto es independiente (su propio `package.json`, `.env` y `node_modules`) — no hay herramientas de workspace (ni Lerna, ni Turborepo, ni workspaces de pnpm) ni `package.json` en la raíz, así que entra con `cd` al proyecto antes de correr cualquier comando de npm. Los proyectos Astro requieren Node `>=22.12.0`. No hay pruebas automatizadas del lado del frontend.

| Proyecto | Comando de desarrollo | Variable(s) de entorno | Salida de compilación |
| :--- | :--- | :--- | :--- |
| `gnu-cms-admin` | `npm run dev` → `localhost:5173` (también `npm run lint`) | `VITE_BASE_URL` (origen del CMS, sin diagonal final), `VITE_BUILD_SERVER_URL` (origen de build-server) | `dist/` — SPA, necesita reescribir a `index.html` al desplegar |
| `landing-gnu`, `gas-gnu`, `tectuus`, `trainin` | `npm run dev` → `localhost:4321` (`astro dev --background` para uso automatizado/por agentes) | `CMS_API_URL` = `<origen del CMS>/api/public/<slug-del-cms>/` (con diagonal final) | `dist/` — HTML/CSS/JS estático, una carpeta + `index.html` por ruta |
| `build-server` | `npm start` → `localhost:4400` | su propio `.env` (`CODE_PATH`/`PUBLIC_PATH` por sitio, `ALLOWED_ORIGINS`) — ver `.env.example` | — |

Ejemplo de `.env` para un sitio Astro:

```env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/gnu-vehicular/
```

Las instrucciones completas de desarrollo, compilación y despliegue (Nginx/VPS, S3 + CloudFront, Azure Blob / Static Web Apps, Vercel/Netlify/Cloudflare Pages) están en el README de cada proyecto y en [`DEVOPS.md`](./DEVOPS.md); aquí solo va lo compartido.

**Advertencias compartidas** (ver [`landing-gnu/README.md`](./landing-gnu/README.md#notas-y-advertencias) para la explicación completa):

- **Las variables de entorno se leen en compilación en todos los proyectos.** Cambiar `CMS_API_URL` o `VITE_*` no tiene efecto hasta volver a compilar (o reiniciar el servidor de desarrollo).
- **Todo lo que empiece con `VITE_` termina en el bundle JS público del panel.** Nunca pongas un secreto ni una ruta del sistema de archivos del servidor en `gnu-cms-admin/.env` — por eso las rutas de compilación viven en `build-server/.env`. El `.env` del panel está versionado a propósito (solo tiene URLs públicas); los `.env` de los sitios Astro no se suben al repo.
- **Nombres de variables reservados:** nunca nombres `BASE_URL` (ni `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) a una variable propia de Astro — Astro/Vite la sobrescriben sin avisar.
- **Nada de lógica compartida en archivos `.astro`:** el código reutilizable que no es UI (clientes de API, formateadores, configuración) va en archivos `.ts` dentro de `src/functions/`, `src/lib/` o `src/config/`.
- **En `landing-gnu` y `gas-gnu`, reinicia el servidor de desarrollo para ver ediciones del CMS** — `src/lib/cms.ts` memoiza las respuestas mientras vive el proceso. Los cambios de código sí se recargan en caliente.
- **Los props `site=` del panel usan el slug del CMS**, no el prefijo de ruta (ver la tabla de identificadores) — si no coinciden, la página queda vacía sin error.
- **`dist/` está versionado en `tectuus` y `trainin`.** Para solo revisar una compilación, compila a una carpeta temporal: `npx astro build --outDir <carpeta-temporal>`.
- **Una compilación "exitosa" no siempre es correcta:** si el CMS falla durante la compilación, la página se genera vacía o con respaldos. Revisa el log en busca de `Error fetching data` antes de desplegar.

## Para el webmaster

Si solo editas contenido desde `gnu-cms-admin` y no tocas código, esto es lo que necesitas saber:

1. **Inicia sesión en `gnu-cms-admin`**, elige el sitio y edita la sección, página o entrada de blog que necesites. Al guardar, el backend se actualiza de inmediato.
2. **El sitio público no se actualiza solo.** Cuando termines de editar, presiona **Reconstruir sitio** en la parte superior de la lista de páginas de ese sitio. El botón indica cuando termina la compilación (o si falla, con detalles). Si dice que el servicio no está disponible o no está configurado, pide a un desarrollador que compile y despliegue ese sitio.
3. **Sigue las guías de tamaño de imágenes y textos.** El panel bloquea imágenes de más de 5 MB y muestra las medidas de cada imagen, y algunos campos de texto muestran una longitud recomendada — pero no te impide guardar un título demasiado largo o una imagen con proporciones incorrectas, lo que puede verse roto en el sitio. Los tamaños recomendados por sección están en:
   - [`DOCUMENTACION-CONTENIDO-LANDING-GNU.txt`](./DOCUMENTACION-CONTENIDO-LANDING-GNU.txt) — GNU corporativo
   - [`DOCUMENTACION-CONTENIDO-GAS-GNU.txt`](./DOCUMENTACION-CONTENIDO-GAS-GNU.txt) — GNU Vehicular
   - [`DOCUMENTACION-CONTENIDO-TECTUUS.txt`](./DOCUMENTACION-CONTENIDO-TECTUUS.txt) — Tectuus
   - [`DOCUMENTACION-CONTENIDO-TRAININ.txt`](./DOCUMENTACION-CONTENIDO-TRAININ.txt) — Traninn Logistic
4. **Imágenes:** JPG para fotos, PNG para logos/íconos con transparencia; procura que pesen bastante menos de 1 MB, porque nada se comprime automáticamente. Las imágenes de portada de las páginas internas de `landing-gnu` se esperan en 2048×768 (GIFs en 800×320).
5. **Catálogo de Tectuus:** para ordenar categorías y productos, antepón un número al nombre (`1 - EDRM`, `2 - Compresores`). El número no se muestra en el sitio. Agregar, renombrar, desactivar o borrar un producto también requiere **Reconstruir sitio**.
6. **Hay cosas que no se editan desde el panel:** títulos de página y etiquetas del menú, agregar secciones nuevas a una página y explorar/borrar archivos subidos. Algunas etiquetas y órdenes también están fijos en el código del sitio (ver la sección "Ajustes del lado del frontend" de cada README). Pídeselos a un desarrollador.
7. **Nada de lo que editas es privado.** Los sitios públicos no tienen login — todo lo guardado queda visible para cualquiera en cuanto se recompila el sitio. No uses el panel para preparar contenido que no quieras que el público vea eventualmente.

## Publicar un cambio de contenido

De principio a fin, para cualquiera de los sitios públicos:

1. El editor guarda los cambios en `gnu-cms-admin` → se almacenan en el backend del CMS de inmediato.
2. El proyecto Astro correspondiente se compila con `npm run build` — en ese momento se obtiene el contenido nuevo y queda integrado en el HTML estático.
3. El `dist/` resultante se despliega (se copia a la carpeta publicada, se sincroniza a S3/Azure o se vuelve a desplegar en la plataforma de hosting) — ver el README de ese proyecto.
4. Solo después del paso 3 el cambio es visible para los visitantes.

No hay un webhook automático desde el CMS. Los pasos 2–3 ocurren de una de estas formas:

- **Desde el panel:** el botón **Reconstruir sitio** llama a [`build-server`](./build-server/README.md), que corre `npm run build` en el `CODE_PATH` del sitio y reemplaza el contenido de su `PUBLIC_PATH` con `dist/`. Funciona cuando los sitios se sirven desde la misma máquina donde corre `build-server`; un sitio con rutas vacías o de ejemplo falla de forma segura con un error claro.
- **Manualmente o con CI**, para cualquier otro hosting (S3/CloudFront, Azure, Vercel, …) — recuerda invalidar la caché del CDN para el HTML después.

Para desplegar un **cambio de código** en el servidor actual: actualiza el `CODE_PATH` del sitio (`git pull` como el usuario `frontend`, nunca como root) y luego recompila con el botón o a mano. Ver [`build-server/README.md`](./build-server/README.md).

## Mapa de la documentación

| Documento | Para quién | Contenido |
| :-- | :-- | :-- |
| `README.md` (este archivo) | Todos | Panorama del sistema |
| [`DEVOPS.md`](./DEVOPS.md) | Desarrolladores / quien despliega | Manual de operación: arquitectura, variables, despliegue, trampas conocidas, prioridades |
| `<proyecto>/README.md` | Desarrolladores | Detalle de cada proyecto: estructura, capa del CMS, ajustes del frontend, despliegue |
| `<proyecto>/GUIDELINES.md` | Desarrolladores / diseño | Lenguaje visual compartido (copia idéntica en los 5 proyectos) |
| `<proyecto>/technical_debt.md` | Desarrolladores | Lo que está en duro en el frontend y qué haría falta en el CMS para moverlo |
| `<proyecto>/CLAUDE.md`, `AGENTS.md` | Agentes de código | Convenciones para asistentes de IA |
| `gas-gnu/gnu-vehicular-docs/`, `landing-gnu/gnu-docs/`, `tectuus/tectuus-docs/`, `trainin/trainin-docs/` | Desarrolladores / backend | Documentación funcional por área del CMS (exportada de Confluence) |
| `gas-gnu/CLASSES.md`, `tectuus/CLASSES.md` | Desarrolladores | Clases CSS de cada sitio |
| `landing-gnu/NEW-FIELDS.md`, `landing-gnu/certificaciones_images/CAMPOS-BACKEND.md` | Backend | Campos que el frontend ya soporta y el CMS aún no expone |
| `DOCUMENTACION-CONTENIDO-*.txt`, `GUÍA DE CONTENIDO *.pdf` | Editores / webmaster | Tamaños de imagen y longitud de textos por sección |
