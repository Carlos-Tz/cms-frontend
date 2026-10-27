# GNU Gas Natural Vehicular — Sitio

Sitio estático en Astro para GNU Gas Natural Vehicular (conversiones a GNV, estaciones, citas de verificación). El contenido (secciones de página, menú, entradas del blog, datos de contacto, redes sociales, estaciones) se captura en el CMS headless desde [`gnu-cms-admin`](../gnu-cms-admin/README.md) y se trae por REST **en tiempo de compilación**, y luego se renderiza a HTML/CSS/JS plano.

En el admin este sitio vive bajo la ruta **`gas-natural`**; en la API del CMS su slug es **`gnu-vehicular`**. Sigue la misma arquitectura que [`landing-gnu`](../landing-gnu/README.md), la implementación de referencia.

## Estructura del proyecto

```text
/
├── public/                         # Archivos estáticos copiados tal cual (favicons, logo, puntero del cursor)
├── src/
│   ├── assets/images/noimg.jpg     # Imagen de reemplazo para tarjetas/entradas sin imagen
│   ├── components/
│   │   ├── CmsPage.astro           # Renderiza una página del CMS (GET pages/{slug}) en el orden de sus secciones
│   │   ├── SectionRenderer.astro   # Asocia un "type" de sección del CMS con su componente en sections/
│   │   ├── sections/               # Un componente por tipo de sección del CMS, más bloques exclusivos de inicio
│   │   ├── ChildPageCards.astro    # Tarjetas de hub armadas con el menú + el page_hero de cada página hija
│   │   ├── BlogIndex.astro         # Listado del blog (lo usan /blog y /blog/pagina/[page])
│   │   └── nav/                    # NavItem / NavItemMobile (menú de escritorio + móvil)
│   ├── config/seo.ts               # Valores SEO por defecto de todo el sitio (nombre del sitio, dominio, locale)
│   ├── functions/fetch.ts          # Cliente REST de bajo nivel (fetchData/sendData/updateData, mediaUrl, BASE_URL)
│   ├── lib/cms.ts                  # Acceso tipado y memoizado al CMS (getPage, getMenu, getGlobals, childrenOf, …)
│   ├── layouts/Layout.astro        # Estructura compartida: header, nav, footer, WhatsApp + simulador flotante, etiquetas SEO
│   ├── pages/                      # Ruteo basado en archivos — cada archivo .astro aquí es una ruta
│   │   ├── index.astro             # Inicio: orden curado, no la lista cruda de secciones del CMS
│   │   ├── nuestros-servicios/     # + flotillas-empresariales, estaciones-moviles,
│   │   │                           #   instala-tu-equipo-de-gnv (+ cotiza-tu-equipo, financiamiento)
│   │   ├── ubicaciones/            # + estaciones-morelia, estacion-uruapan, agenda-tu-verificacion, talleres
│   │   ├── blog/                   # index, [slug], pagina/[page]
│   │   └── contacto/
│   ├── styles/                     # global.css, tokens.css (tokens de diseño)
│   └── types/                      # globals.ts, menu.ts
├── gnu-vehicular-docs/             # Docs del backend/admin por área del CMS (Portada, Contacto, Ubicaciones, Servicios, Blog)
├── manual/                         # Imágenes del manual de identidad de marca (en gitignore)
├── GUIDELINES.md                   # Lenguaje de diseño compartido (la misma copia en cada proyecto frontend)
├── astro.config.mjs                # Config por defecto, sin adapter → salida estática
├── .env                            # CMS_API_URL (no se sube al repo)
└── package.json
```

La lógica reutilizable que no es de componentes debe vivir en un archivo `.ts` plano, no en un archivo `.astro`. Ver [Notas y advertencias](#notas-y-advertencias).

## Configuración de entorno

El sitio lee la URL base del CMS de una sola variable de entorno:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/gnu-vehicular/
```

- Crea `.env` en la raíz del proyecto antes de correr dev o build. **No** se sube a git.
- `src/functions/fetch.ts` la lee con `import.meta.env.CMS_API_URL` y, si no está definida, usa `http://localhost:3000/`. Conserva la diagonal final: los endpoints se concatenan directo (`BASE_URL + "menu"`).
- **Es un valor de tiempo de compilación.** El sitio compila a salida estática, así que todas las llamadas al CMS en tiempo de compilación ocurren durante `npm run build`. La misma URL también queda incrustada en los scripts del navegador que llaman a la API en vivo (ver abajo), así que apuntar a otro CMS implica editar `.env` y volver a compilar.
- No nombres `BASE_URL` a una variable de entorno propia. Vite/Astro reservan ese nombre y lo sobrescriben en silencio con `"/"`. Lo mismo aplica para `MODE`, `DEV`, `PROD`, `SSR`, `SITE` y `ASSETS_PREFIX`. (`BASE_URL` en `fetch.ts` es solo una constante exportada, no una variable de entorno.)

## Cómo se comunica el sitio con el CMS

Las páginas y componentes leen el CMS a través de [src/lib/cms.ts](src/lib/cms.ts), que envuelve al cliente de bajo nivel en [src/functions/fetch.ts](src/functions/fetch.ts):

| Función | Endpoint | Uso |
| :------- | :------- | :-- |
| `getPage(slug)` | `GET pages/{slug}` | Las secciones de una página (`{ type, content }[]`) |
| `getMenu()` | `GET menu` | Árbol de navegación, links de "Servicios" del footer, destinos de los CTAs del header |
| `getGlobals()` | `GET globals` | Datos de contacto del footer, redes sociales, botón de WhatsApp, JSON-LD de Organization |
| `getBlogList(page)`, `getAllBlogPosts()`, `getBlogPost(slug)` | `GET blog…` | Listado y entradas del blog |
| `childrenOf(slug)`, `findMenuItem(slug)` | (de `menu`) | Las páginas hijas publicadas de un hub, usadas para las tarjetas del hub |
| `sectionOf(page, type)`, `heroOf(page)` | — | Sacar una sección de una página ya cargada |
| `whatsappHref(globals)` | — | Link `wa.me` a partir de `whatsapp_button`, o `null` cuando no hay número |

Las respuestas de `cms.ts` se memoizan por endpoint, así que una compilación completa hace una sola petición por endpoint sin importar cuántas páginas lo usen. Excepción: `StationsMap` y `ServiceScheduling` llaman directo a `fetchData("stations")`, así que `GET stations` no se memoiza.

La mayoría de las rutas son un solo `<CmsPage slug="…" fallbackTitle="…" />`. `CmsPage` usa el `page_hero` de la página como su resumen SEO (subtítulo → meta description, imagen → vista previa en redes) y renderiza lo que se le pase como children después de las secciones. [SectionRenderer.astro](src/components/SectionRenderer.astro) asocia cada `type` de sección con su componente:

| `type` de sección | Componente |
| :------------- | :-------- |
| `page_hero` | `PageHero` |
| `banner_carousel` | `HeroCarousel` |
| `rich_text` | `RichText` |
| `feature_grid` | `FeatureGrid` |
| `lead_capture_form` | `LeadCaptureForm` (con `source` = slug de la página) |
| `stations_map` | `StationsMap` |
| `clients_showcase` | `ClientsShowcase` |
| `service_scheduling` | `ServiceScheduling` |
| `savings_simulator` | `SavingsSimulator` (cotizado contra el slug de la página) |
| `image_gallery` | `ImageGallery` |
| `testimonials` | `Testimonials` |
| `contact_info` | `ContactInfo` |

Los tipos desconocidos no renderizan nada. `social_icons` y `whatsapp_button` son de todo el sitio y los renderiza el layout a partir de `globals`. Para agregar un bloque nuevo manejado desde el CMS:

1. Crea un componente en `src/components/sections/`.
2. Agrega un case para su `type` en `SectionRenderer.astro`.
3. Haz que el CMS emita secciones de ese `type`.

### Llamadas en vivo desde el navegador

Tres componentes llaman a la API pública desde el navegador del visitante, usando el `CMS_API_URL` incrustado en tiempo de compilación:

| Componente | Endpoint | Cuándo |
| :-------- | :------- | :--- |
| `LeadCaptureForm` | `POST leads` | Al enviar el formulario. Manda `name`/`email`/`phone`/`message` más `source` (slug de la página); cualquier otro campo va dentro de `details`. |
| `SavingsSimulator` | `GET savings-simulator?fuel=&quantity=&page=` | Cuando un visitante calcula, para que los precios sean los actuales y no los del momento de la compilación. |
| `ServiceScheduling` | `GET appointments/availability?station=&date=`, `POST appointments` | Al agendar una verificación en `/ubicaciones/agenda-tu-verificacion`. La lista de estaciones en sí se obtiene en tiempo de compilación desde `GET stations`. |

## Ajustes del lado del frontend

Algunas decisiones de presentación viven en este repo y no en el CMS. Cuando algo en el sitio no coincida con el admin, revisa aquí primero.

| Qué | Dónde |
| :--- | :---- |
| Orden y layout de los bloques de inicio (lee las secciones por tipo de `pages/inicio`) | `src/pages/index.astro` |
| "Hero stats" de inicio (+5,000 equipos instalados, 60% ahorro promedio, 24/7) | En duro en `src/pages/index.astro` |
| "Programa de recompensas" de inicio reutiliza la sección `feature_grid` de la página | `src/pages/index.astro` |
| Título/texto del bloque de contacto de inicio ("Hablemos de tu conversión a GNV") | En duro en `src/pages/index.astro`; solo los campos/título/intro del formulario vienen de `lead_capture_form` |
| Contacto: el `lead_capture_form` se saca y se muestra junto a `globals.contact_info`; el título del formulario está fijo en "Cotiza sin compromiso" | `src/pages/contacto/index.astro` |
| El panel flotante "Calcula tu ahorro" de todas las páginas usa la sección `savings_simulator` de la **página de inicio** | `src/layouts/Layout.astro` |
| Los CTAs del header (agenda, cotiza, ubicaciones) se resuelven a las entradas del menú `agenda-tu-verificacion`, `cotiza-tu-equipo`, `ubicaciones` | `src/layouts/Layout.astro` |
| Títulos de sección de los hubs (bloques "Explora …") en nuestros-servicios, instala-tu-equipo-de-gnv, ubicaciones | El propio `src/pages/**/index.astro` de cada hub |
| Nombre del sitio, título/descripción por defecto, dominio de producción, locale | `src/config/seo.ts` |

### Respaldos sin conexión

Cuando el CMS no está disponible en tiempo de compilación, el sitio de todos modos compila usando respaldos en duro: un menú de primer nivel y links de servicios del footer fijos (`Layout.astro`), un hero de respaldo por página (`fallbackTitle`/`fallbackSubtitle` en `CmsPage`), listas fijas de páginas hijas para cada hub y, en la página de inicio, servicios, beneficios de recompensas, testimonios y tarjetas de ubicaciones de relleno. Por eso, una compilación que corrió sin el CMS se verá llena pero mostrará contenido de relleno — revisa el log de la compilación buscando `Error fetching data` antes de desplegar.

## 🧞 Comandos

| Comando | Acción |
| :------ | :----- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Inicia el servidor de desarrollo local en `localhost:4321` |
| `npm run build` | Trae el contenido del CMS y compila la salida estática a `./dist/` |
| `npm run preview` | Sirve localmente el `./dist/` compilado, tal como se va a desplegar |
| `npm run astro ...` | Corre comandos del CLI como `astro add`, `astro check` |

## Desarrollo

1. `npm install` (Node `>=22.12.0`)
2. Crea `.env` con `CMS_API_URL` apuntando a un CMS accesible (local o remoto), terminando en `/api/public/gnu-vehicular/`.
3. `npm run dev`

**Reinicia el servidor de desarrollo para ver los cambios del CMS.** La caché de memoización en `src/lib/cms.ts` vive mientras viva el proceso del servidor de desarrollo, así que las páginas siguen mostrando el contenido obtenido en la primera petición hasta que lo reinicies. Los cambios de código del frontend sí se recargan en caliente.

Para revisar una compilación de producción sin tocar `dist/`, compila a una carpeta temporal: `npx astro build --outDir <temp-dir>`.

Al iniciar el servidor de desarrollo para una tarea automatizada/en segundo plano, usa `astro dev --background` y adminístralo con `astro dev status`, `astro dev logs` y `astro dev stop`.

## Compilar para producción

```sh
npm run build
npm run preview   # verifica localmente antes de desplegar
```

Esto genera un sitio completamente estático en `dist/`, sin necesidad de un runtime de servidor. El contenido se obtiene en tiempo de compilación, así que **cualquier cambio de contenido en el CMS necesita una nueva compilación y despliegue** para aparecer en el sitio en vivo.

Antes del primer despliegue a producción, confirma que `siteUrl` en `src/config/seo.ts` sea el dominio real: los links canónicos, `og:url` y el JSON-LD del blog se generan a partir de él.

## Despliegue

`dist/` es un paquete estático y se despliega exactamente igual que `landing-gnu`. Dos cosas aplican a cualquier destino:

- **URLs de carpeta**: cada página se compila como una carpeta con un `index.html` (p. ej. `/ubicaciones/talleres/` es `dist/ubicaciones/talleres/index.html`). El host debe servir `index.html` para una URL de carpeta, no solo en la raíz.
- **Headers de caché**: el HTML debe revalidarse en cada visita (`Cache-Control: no-cache`) para que los visitantes reciban las compilaciones nuevas de inmediato. Los archivos bajo `/_astro/` llevan hashes de contenido en el nombre y se pueden cachear por un año (`public, max-age=31536000, immutable`).

### VPS con nginx

```nginx
server {
    listen 80;
    server_name example.com www.example.com;   # el dominio de este sitio

    root /var/www/gas-gnu;                      # la carpeta que recibe dist/
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
        add_header Cache-Control "no-cache";
    }

    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Recarga con `sudo nginx -t && sudo systemctl reload nginx`. Para volver a desplegar, compila de nuevo y copia el `dist/` nuevo encima del anterior; no hace falta reiniciar nada.

Para AWS S3 + CloudFront, Azure (Blob static website o Static Web Apps) y Vercel/Netlify/Cloudflare Pages, sigue [`landing-gnu/README.md#despliegue`](../landing-gnu/README.md#despliegue), usando el `CMS_API_URL` y el dominio de este sitio.

### Reconstruir desde el admin

Los editores pueden reconstruir este sitio con el botón **Reconstruir sitio** en la lista de páginas de `gas-natural` en `gnu-cms-admin`. Llama a [`build-server`](../build-server/README.md) (sitio `gas-natural`), que corre `npm run build` en el `CODE_PATH` de este proyecto y reemplaza la carpeta servida (`PUBLIC_PATH`) con `dist/`. Esto solo funciona cuando el sitio se sirve desde la máquina donde corre `build-server`; para otros hosts, compila y despliega a mano o vía CI.

## Notas y advertencias

- **Salida estática, datos en tiempo de compilación**: cada fetch al CMS en el frontmatter de una página corre una sola vez en `astro build`, no en cada petición en producción. Cambiar variables de entorno en el servidor no hace nada sin volver a compilar.
- **Nombres de variables de entorno reservados**: nunca uses `BASE_URL` (ni `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) para un valor propio en `.env`.
- **Nada de lógica compartida en archivos `.astro`**: deja las funciones reutilizables que no son de UI en archivos `.ts` (`src/lib/`, `src/functions/`, `src/config/`). Astro maneja el alcance de los `const`/`let` de nivel superior en el frontmatter de un componente de forma distinta a un `export function` en ese mismo frontmatter, así que una constante simple puede ser `undefined` dentro de una función exportada en tiempo de ejecución.
- **URLs de medios**: las rutas de medios relativas del CMS se resuelven con `mediaUrl()` contra el origen del CMS bajo `/storage/<path>`. No pongas en duro el host del CMS en ningún otro lado.
- **Las tarjetas de hub no tienen contenido propio**: cada tarjeta de un hub reutiliza el `page_hero` (imagen + subtítulo) de su página hija. Despublicar una página en el admin la quita del menú y, por lo tanto, de su hub, en la siguiente compilación.
- **CORS**: el formulario de leads, el simulador y la reserva de citas llaman al CMS desde el navegador, así que el CMS debe permitir el origen de este sitio.
- **Guía de contenido**: los tamaños de imagen y longitudes de texto recomendados por sección están en [`../DOCUMENTACION-CONTENIDO-GAS-GNU.txt`](../DOCUMENTACION-CONTENIDO-GAS-GNU.txt).
