# Traninn Logistic — Sitio público

Sitio estático en Astro para Traninn Logistic (transporte de GNC, logística y carga pesada). El contenido (secciones de página, menú, entradas del blog, datos de contacto, redes sociales, botón de WhatsApp, estaciones) se captura en el CMS headless desde [`gnu-cms-admin`](../gnu-cms-admin/README.md), se trae por REST **en tiempo de compilación** y se renderiza a HTML/CSS/JS plano.

En el CMS el slug de este sitio es **`traninn-logistic`** (doble "n", una sola "i" — no `trainin`). En el admin su prefijo de ruta es `trainin`.

> Este sitio **no** usa el esquema `CmsPage` / `SectionRenderer` / `src/lib/cms.ts` de `landing-gnu`. Tiene su propio equivalente, más simple (`PageSections.astro` + helpers de fetch planos), descrito abajo.

## Estructura del proyecto

```text
/
├── public/                          # Assets estáticos que se copian tal cual (logo.png, favicons, cursores personalizados)
├── assets/images/noimg.jpg          # Solo lo usa Servicios.astro, que no se usa (ver Notas)
├── src/
│   ├── components/
│   │   ├── PageSections.astro       # Asocia cada "type" de sección del CMS con un componente, en el orden de la API
│   │   ├── Hero.astro               # banner_carousel
│   │   ├── PageHero.astro           # page_hero (también lo usa directamente /blog)
│   │   ├── Simulador.astro          # savings_simulator (consulta precios en vivo desde el navegador)
│   │   ├── RichText.astro           # rich_text
│   │   ├── FeatureGrid.astro        # feature_grid
│   │   ├── ImageGallery.astro       # image_gallery
│   │   ├── StationsMap.astro        # stations_map (Leaflet + OpenStreetMap, pines desde GET stations)
│   │   ├── Clientes.astro           # clients_showcase
│   │   ├── Contacto.astro           # lead_capture_form (hace POST de leads desde el navegador)
│   │   ├── Marquee.astro            # Banda de palabras clave bajo el banner de inicio, armada a partir del menú
│   │   ├── ChildPageCards.astro     # Tarjetas de páginas hijas en las páginas hub, armadas a partir del menú
│   │   ├── Header.astro, Footer.astro, Logo.astro, WhatsAppButton.astro
│   │   └── Servicios.astro, Ubicaciones.astro   # Restos sin usar (ver Notas)
│   ├── functions/
│   │   ├── fetch.ts                 # Cliente REST de bajo nivel (fetchData/sendData/updateData, mediaUrl)
│   │   ├── blog.ts                  # fetchBlogPosts (sigue la paginación), formatPublishedAt
│   │   └── globals.ts               # fetchGlobals, whatsappHref
│   ├── layouts/Layout.astro         # Estructura compartida: fuentes, header, footer, botón de WhatsApp, revelado al hacer scroll
│   ├── pages/                       # Ruteo basado en archivos — cada archivo .astro aquí es una ruta
│   │   ├── index.astro              # pages/inicio
│   │   ├── nuestros-servicios/      # index + transporte-de-gnc, logistica, carga-pesada
│   │   ├── sobre-nosotros/          # index + nuestra-historia, proposito-empresarial, que-hacemos
│   │   ├── ubicaciones/             # una sola página
│   │   ├── blog/                    # index, [slug]
│   │   ├── contacto/
│   │   ├── nosotros/, servicios/    # Stubs de relleno, no son páginas del CMS (ver Notas)
│   ├── styles/                      # tokens.css (tokens de diseño), motion.css (animaciones de revelado al hacer scroll)
│   └── types/globals.ts
├── trainin-docs/                    # Notas de implementación (en español) + las plantillas de referencia Loginet/O-Tech
├── response.json                    # Respuesta de ejemplo de GET pages/inicio, como referencia
├── astro.config.mjs                 # Configuración por defecto, sin integraciones ni adapter
├── .env                             # CMS_API_URL (en .gitignore)
└── package.json
```

## Configuración del entorno

El sitio lee la URL base del CMS de una sola variable de entorno:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/traninn-logistic/
```

- Crea `.env` en la raíz del proyecto antes de correr el servidor de desarrollo o la compilación. Está en `.gitignore`.
- `src/functions/fetch.ts` la lee con `import.meta.env.CMS_API_URL` y, si no está definida, usa `http://localhost:3000/`. Conserva la diagonal final: rutas como `pages/inicio` se concatenan directamente.
- **Es un valor de tiempo de compilación**, y además queda incrustado en los scripts del navegador del formulario de leads y del simulador de ahorro (vía `define:vars`). Para apuntar a otro CMS, edita `.env` y vuelve a compilar.
- No nombres una variable de entorno propia `BASE_URL`. Vite/Astro reservan ese nombre y lo sobrescriben en silencio con `"/"`. Lo mismo aplica para `MODE`, `DEV`, `PROD`, `SSR`, `SITE` y `ASSETS_PREFIX`. (`fetch.ts` *exporta* una constante llamada `BASE_URL`; es un nombre de JS normal, no una variable de entorno, así que no hay problema.)

## Cómo se comunica el sitio con el CMS

Todas las llamadas pasan por [src/functions/fetch.ts](src/functions/fetch.ts). No hay una capa de wrappers tipados y **no hay memoización**: cada componente que necesita datos llama a `fetchData` por su cuenta.

| Quién | Endpoint | Uso |
| :-- | :------- | :-- |
| Cada página en `src/pages/` | `GET pages/{slug}` | Las `sections[]` de la página, que se pasan a `<PageSections>` |
| `Layout.astro` | `GET menu`, `GET globals` | Navegación del header/footer; datos de contacto, redes sociales, botón de WhatsApp |
| `ChildPageCards.astro` | `GET menu` | Tarjetas para los hijos de la rama del menú que coincide con la URL actual |
| `Marquee.astro` | `GET menu` | Palabras = títulos de la primera rama del menú que tiene hijos (los servicios) |
| `StationsMap.astro` | `GET stations` | Pines y lista de estaciones |
| `Contacto.astro` | `GET globals` | CTA de WhatsApp junto al formulario |
| `blog/index.astro`, `blog/[slug].astro` | `GET blog?page=N`, `GET blog/{slug}` | Listado (recorriendo todas las páginas) y una ruta por entrada |
| Navegador — `Contacto.astro` | `POST leads` | Envío de leads, etiquetado con `source` = el slug de la página |
| Navegador — `Simulador.astro` | `GET savings-simulator?…` | Precios actuales de combustible cuando un visitante hace un cálculo |

`mediaUrl(path)` resuelve las rutas de medios relativas al CMS contra el origen del CMS bajo `/storage/<path>`; las URLs absolutas pasan sin cambios.

Cada ruta es un archivo de ~20 líneas: consulta `pages/{slug}` y envuelve `<PageSections sections={…} slug={…} />` en `<Layout>`. [PageSections.astro](src/components/PageSections.astro) renderiza las secciones en el orden en que las regresa la API y soporta:

`banner_carousel`, `page_hero`, `savings_simulator`, `rich_text`, `feature_grid`, `image_gallery`, `stations_map`, `clients_showcase`, `lead_capture_form`.

Los tipos desconocidos (incluido `testimonials`, que este sitio no renderiza) se omiten, así que sembrar un tipo de sección nuevo nunca rompe la compilación. Las secciones con contenido vacío (sin slides, sin elementos, sin logos) no renderizan nada. Para agregar un bloque nuevo controlado por el CMS:

1. Crea un componente en `src/components/`.
2. Agrega un `case` para su `type` en `PageSections.astro`.
3. Haz que el CMS emita secciones de ese `type`.

Para agregar una página nueva del CMS, copia cualquier archivo de ruta existente y cambia el slug en `fetchData("pages/…")`. La ubicación del archivo debe coincidir con el `path` de la página en el CMS (p. ej. `transporte-de-gnc` vive en `/nuestros-servicios/transporte-de-gnc`), ya que ahí es a donde enlaza el menú del CMS.

## Ajustes del lado del frontend

Algunas decisiones de presentación viven en este repositorio y no en el CMS. Cuando algo en el sitio no coincida con el admin, revisa aquí primero.

| Qué | Dónde |
| :--- | :---- |
| Elemento "Blog" de la navegación (el menú del CMS no lo incluye) | Se agrega en `src/components/Header.astro` |
| Navegación de respaldo (Inicio, Nuestros servicios, Sobre nosotros, Ubicaciones) si `GET menu` falla | `src/components/Header.astro` |
| Redes sociales de respaldo (`#`) si el CMS no trae ninguna; solo facebook/instagram/linkedin tienen ícono | `src/layouts/Layout.astro` |
| Banda marquee que se muestra solo bajo un `banner_carousel` que es la **primera** sección de la página | `src/components/PageSections.astro` |
| Los `banner_carousel` posteriores se renderizan en modo compacto | `src/components/PageSections.astro` |
| Bandas de sección alternadas lisas/con tinte (sin contar banners/heroes) | `src/components/PageSections.astro` |
| Títulos de las tarjetas de los hubs: "Nuestros servicios", "Conoce Traninn Logistic" | `src/pages/nuestros-servicios/index.astro`, `src/pages/sobre-nosotros/index.astro` |
| Íconos de las tarjetas de los hubs, elegidos por palabras clave en el slug del hijo | `src/components/ChildPageCards.astro` |
| `<title>`/descripción por defecto (página de inicio) | `src/layouts/Layout.astro` |
| Encabezado de la página del blog ("Blog") | `src/pages/blog/index.astro` |

Los tamaños de imagen y longitudes de texto recomendados para cada sección están en [`../DOCUMENTACION-CONTENIDO-TRAININ.txt`](../DOCUMENTACION-CONTENIDO-TRAININ.txt).

## 🧞 Comandos

| Comando | Acción |
| :------ | :----- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Inicia el servidor de desarrollo local en `localhost:4321` |
| `npm run build` | Trae el contenido del CMS y compila la salida estática en `./dist/` |
| `npm run preview` | Sirve localmente el `./dist/` compilado, tal como se va a desplegar |
| `npm run astro ...` | Corre comandos del CLI como `astro add`, `astro check` |

## Desarrollo

1. `npm install` (Node `>=22.12.0`)
2. Crea `.env` con `CMS_API_URL` apuntando a un CMS accesible (local o remoto).
3. `npm run dev`

Como nada se memoiza, el servidor de desarrollo vuelve a consultar en cada carga de página, así que los cambios en el CMS aparecen al refrescar sin reiniciar (a diferencia de `landing-gnu`).

Cuando inicies el servidor de desarrollo para una tarea automatizada o en segundo plano, usa `astro dev --background` y adminístralo con `astro dev status`, `astro dev logs` y `astro dev stop`.

Para revisar una compilación de producción sin tocar `dist/`, compila a una carpeta temporal: `npx astro build --outDir <temp-dir>`.

## Compilación para producción

```sh
npm run build
npm run preview   # verifica localmente antes de desplegar
```

Esto genera un sitio completamente estático en `dist/`, sin necesidad de un runtime de servidor. El contenido se trae en tiempo de compilación, así que **cualquier cambio de contenido en el CMS necesita una nueva compilación y un nuevo despliegue** para aparecer en el sitio en vivo. Una consulta fallida se registra en el log y la página se renderiza vacía en lugar de hacer fallar la compilación, así que revisa la salida de la compilación en busca de `Error fetching data` antes de desplegar.

## Despliegue

`dist/` es un paquete estático, así que se puede hospedar en cualquier lugar que sirva archivos estáticos. Dos cosas aplican para cualquier destino:

- **URLs de carpeta**: cada página se compila como una carpeta con un `index.html` (p. ej. `/sobre-nosotros/que-hacemos/` es `dist/sobre-nosotros/que-hacemos/index.html`). El hosting debe servir `index.html` para una URL de carpeta, no solo en la raíz.
- **Encabezados de caché**: el HTML debe revalidarse en cada visita (`Cache-Control: no-cache`). Los archivos bajo `/_astro/` llevan hashes de contenido en el nombre y se pueden cachear un año (`public, max-age=31536000, immutable`).

### VPS con nginx

```nginx
server {
    listen 80;
    server_name <your-domain>;

    root /var/www/trainin/dist;
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

Recarga con `sudo nginx -t && sudo systemctl reload nginx`. Para volver a desplegar, compila de nuevo y copia el `dist/` nuevo encima del anterior.

### Otros hostings

Para AWS S3 (+ CloudFront), Azure Storage / Static Web Apps y Vercel/Netlify/Cloudflare Pages, sigue [`../landing-gnu/README.md#despliegue`](../landing-gnu/README.md#despliegue) — las recetas son idénticas, con el dominio y el `CMS_API_URL` de este sitio.

### Reconstruir desde el admin

Los editores pueden reconstruir este sitio con el botón **Reconstruir sitio** en la lista de páginas de Traninn en `gnu-cms-admin`. Este llama a [`../build-server`](../build-server/README.md) con el sitio `trainin`, que corre `npm run build` en `VITE_TRANINN_CODE_PATH` y reemplaza el contenido de `VITE_TRANINN_PUBLIC_PATH` con `dist/`. Ambas rutas van en `build-server/.env`; si no están definidas, la reconstrucción falla con un error claro.

## Notas y advertencias

- **Salida estática, datos en tiempo de compilación**: todas las consultas al CMS (salvo el formulario de leads y el simulador) se ejecutan una sola vez en `astro build`, no por petición en producción.
- **Sin memoización**: `GET menu` lo piden `Layout`, `ChildPageCards` y `Marquee`, y `GET globals` lo piden `Layout` y `Contacto`, en cada página. Por eso una compilación hace varias peticiones por página. Está bien con el tamaño de este sitio, pero vale la pena cachearlas (como `landing-gnu/src/lib/cms.ts`) si crece el número de páginas.
- **Rutas stub**: `src/pages/nosotros/index.astro` y `src/pages/servicios/index.astro` solo tienen texto de relleno ("sobre nosotros", "serv") sin layout. Nada enlaza a ellas, pero de todos modos se compilan y se publican en `/nosotros/` y `/servicios/`. Las páginas reales son `/sobre-nosotros/` y `/nuestros-servicios/`.
- **Componentes sin usar**: `Servicios.astro` y `Ubicaciones.astro` no se importan en ningún lado. `Servicios.astro` es el único que usa `assets/images/noimg.jpg`.
- **El blog no está en el menú**: el menú del CMS no incluye el blog, así que `Header.astro` lo agrega. Las entradas del blog no tienen una entrada `pages/` en el CMS.
- **Tipos de sección sin manejar**: `testimonials` (de `globals`) no se renderiza en ninguna parte de este sitio.
- **Nada de lógica compartida en archivos `.astro`**: mantén las funciones reutilizables que no son de UI en archivos `.ts` bajo `src/functions/`.
- **URLs de medios**: siempre pasa por `mediaUrl()`. No pongas el host del CMS en duro en ningún otro lado.
- **Assets externos**: Google Fonts (Noto Sans, Outfit), Font Awesome 6.7.2 desde cdnjs y Leaflet 1.9.4 desde unpkg (solo en la página del mapa) se cargan en tiempo de ejecución.
- **`dist/` está versionado en git** (no está en `.gitignore`), así que una compilación local modifica archivos versionados. Compila a una carpeta temporal cuando solo estés revisando la salida.
- **Contexto de las decisiones de implementación**: ver `trainin-docs/Frontend Astro - consumo del CMS.md`.
