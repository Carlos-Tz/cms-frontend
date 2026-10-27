# Tectuus — Sitio

Sitio estático en Astro para Tectuus, la línea de equipo industrial de GNU Gas Natural (EDRM, compresores, válvulas). El contenido (secciones de página, menú, datos de contacto, redes sociales, botón de WhatsApp) y el **catálogo de productos** (categorías y productos) se administran en el CMS headless desde [gnu-cms-admin](../gnu-cms-admin/README.md), se traen por REST **en tiempo de compilación** y se renderizan a HTML/CSS/JS plano.

Tectuus **no tiene blog**. En el admin y en el CMS el sitio se identifica como `tectuus` en todos lados (el prefijo de ruta del admin, el slug del CMS y el nombre de sitio en `build-server` son el mismo).

## Estructura del proyecto

```text
/
├── public/                         # Se copia tal cual: favicon.svg/.ico, placeholder-plate.svg (imagen de respaldo)
├── src/
│   ├── assets/images/              # Imágenes procesadas por el pipeline de assets de Astro
│   ├── components/
│   │   ├── SectionRenderer.astro   # Asocia cada "type" de sección del CMS con su componente en sections/
│   │   ├── sections/               # Un componente por tipo de sección del CMS
│   │   ├── ProductCatalog.astro    # Rejilla del catálogo + chips de categoría + búsqueda, filtrados en el navegador
│   │   └── nav/                    # NavItem / NavItemMobile (desplegables para los hijos del menú)
│   ├── config/seo.ts               # Valores SEO por defecto del sitio (nombre, título/descripción por defecto, siteUrl)
│   ├── functions/
│   │   ├── fetch.ts                # Cliente REST de bajo nivel (fetchData/sendData/updateData, mediaUrl, FALLBACK_IMAGE)
│   │   └── catalog.ts              # Acceso al catálogo (fetchCategories, fetchAllProducts, fetchProduct, orderByPrefix, formatPrice)
│   ├── layouts/Layout.astro        # Estructura compartida: header, nav, footer, botón de WhatsApp, etiquetas SEO
│   ├── pages/                      # Ruteo basado en archivos — cada archivo .astro aquí es una ruta
│   │   ├── index.astro             # Inicio (página `inicio` del CMS, con un respaldo offline curado)
│   │   ├── sobre-nosotros/         # Página `sobre-nosotros` del CMS
│   │   ├── productos/              # index (hero del CMS + catálogo) y [slug] (una página por producto)
│   │   └── contacto/               # Página `contacto` del CMS
│   ├── styles/                     # global.css, tokens.css (tokens de diseño)
│   └── types/                      # page.ts, menu.ts, globals.ts, catalog.ts — formas de las respuestas de la API
├── tectuus-docs/                   # Documentación funcional de cada página (Inicio, Quiénes somos, catálogo, leads)
├── GUIDELINES.md                   # Lenguaje de diseño compartido con el admin y los demás sitios
├── astro.config.mjs                # Configuración por defecto (salida estática, sin adapter)
├── .env                            # CMS_API_URL (no se sube al repositorio)
└── package.json
```

La lógica reutilizable que no es un componente debe vivir en un archivo `.ts` plano, no en un archivo `.astro`. Ver [Notas y advertencias](#notas-y-advertencias).

## Configuración del entorno

El sitio lee la URL base del CMS de una sola variable de entorno:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/tectuus/
```

- Crea `.env` en la raíz del proyecto antes de correr el servidor de desarrollo o la compilación. **No** se sube a git.
- `src/functions/fetch.ts` la lee con `import.meta.env.CMS_API_URL` y, si no está definida, usa `http://localhost:3000/`. Conserva la diagonal final: los endpoints se concatenan directamente (`BASE_URL + "pages/inicio"`).
- **Es un valor de tiempo de compilación.** El sitio compila a salida estática (sin adapter de servidor), así que todas las llamadas al CMS ocurren durante `npm run build`, y el HTML en `dist/` se queda con lo que apuntaba `CMS_API_URL` en ese momento. Para apuntar a otro CMS, edita `.env` y vuelve a compilar. La única excepción es el formulario de leads, que hace POST a la misma URL base desde el navegador del visitante.
- No nombres una variable de entorno propia `BASE_URL`. Vite/Astro reservan ese nombre y lo sobrescriben en silencio con `"/"`. Lo mismo aplica para `MODE`, `DEV`, `PROD`, `SSR`, `SITE` y `ASSETS_PREFIX`. (`fetch.ts` *exporta* una constante llamada `BASE_URL`; es un nombre de JS normal, no una variable de entorno, y no hay problema.)

## Cómo se comunica el sitio con el CMS

Las páginas llaman directamente a [src/functions/fetch.ts](src/functions/fetch.ts) y [src/functions/catalog.ts](src/functions/catalog.ts); no hay un wrapper con memoización como el `src/lib/cms.ts` de `landing-gnu`.

| Función | Endpoint | Uso |
| :------- | :------- | :-- |
| `fetchData("pages/{slug}")` | `GET pages/{slug}` | Las secciones de una página (`{ type, content }[]`), renderizadas en el orden de la API por `SectionRenderer` |
| `fetchData("menu")` | `GET menu` | Árbol de navegación (en `Layout.astro`) |
| `fetchData("globals")` | `GET globals` | Datos de contacto del footer, redes sociales, botón de WhatsApp (en `Layout.astro`) |
| `fetchCategories()` | `GET product-categories` | Chips de filtro del catálogo y el submenú de Productos |
| `fetchAllProducts()` | `GET products?page=N` | Todos los productos activos, recorriendo todas las páginas (12 por página, con tope de 25 páginas) |
| `fetchProduct(slug)` | `GET products/{slug}` | El detalle completo de un producto (descripción, todas las imágenes); da 404 para productos inactivos |
| `sendData("leads", …)` | `POST leads` | Envío del formulario de leads, mandado **desde el navegador** en tiempo de ejecución |

Todas las peticiones regresan el sobre `{ status, data, meta }`. Una petición fallida se registra en el log y regresa `undefined`, y cada página tiene un respaldo para ese caso (ver abajo). `mediaUrl(path)` resuelve las rutas de medios relativas al CMS a `<CMS origin>/storage/<path>`; las rutas absolutas y las relativas a la raíz pasan sin cambios.

### Tipos de sección

[SectionRenderer.astro](src/components/SectionRenderer.astro) asocia cada `type` de sección con un componente. Los tipos desconocidos se omiten, así que un tipo de sección nuevo en el CMS nunca rompe una página.

| `type` | Componente | Se renderiza solo si |
| :-- | :-- | :-- |
| `banner_carousel` | `BannerCarousel` | tiene slides. Solo el carrusel que es la primera sección de la página lleva el `<h1>` |
| `page_hero` | `PageHero` | tiene título |
| `rich_text` | `RichText` | siempre (título, cuerpo HTML, video opcional) |
| `feature_grid` | `FeatureGrid` | tiene elementos |
| `image_gallery` | `ImageGallery` | tiene imágenes |
| `clients_showcase` | `ClientsShowcase` | tiene logos |
| `lead_capture_form` | `LeadCaptureForm` | siempre. Va sobre la banda oscura ("ink") salvo que sea una de las dos primeras secciones |

Para agregar un bloque nuevo controlado por el CMS:

1. Crea un componente en `src/components/sections/`.
2. Agrega un caso para su `type` en `SectionRenderer.astro`.
3. Haz que el CMS emita secciones de ese `type`.

### Formularios de leads

`LeadCaptureForm` hace POST a `POST leads` con el slug de la página como `source`, que es como la bandeja de Contacto del admin (columna "Origen") distingue los formularios de la página de inicio, de `/contacto` y de las páginas de producto. `source` debe coincidir con una página publicada del sitio o la API responde `422`. `name`, `email`, `phone` y `message` son columnas de `leads`; cualquier otro campo que el CMS declare en `fields[]` de la sección se manda dentro de `details`. La ruta tiene límite de peticiones (`429` después de 10 peticiones por minuto).

Las páginas de producto siempre usan `source: "productos"`.

## Catálogo de productos

El catálogo es un dominio de datos, no un conjunto de secciones de página: las categorías y los productos son colecciones propias en el CMS, que se crean y se borran en la pantalla Tectuus → Productos del admin.

- **`/productos`** renderiza las secciones propias de la página `productos` (su hero) y después `ProductCatalog`, que recibe **todas** las categorías y los productos activos en tiempo de compilación. Los chips de categoría y la caja de búsqueda filtran las tarjetas **en el navegador**, ya que una página estática no puede reenviar `?category=`/`?q=` a la API. Esto además hace que la búsqueda ignore acentos, cosa que la búsqueda simple con `LIKE` de la API no hace (`medicion` encuentra `medición`).
- Los filtros se guardan en la URL (`/productos?category=edrm`), así que las vistas filtradas se pueden compartir. El submenú de Productos enlaza a estas URLs.
- Cada categoría tiene su chip, aunque todavía no tenga productos, y al seleccionarla se muestra un estado vacío.
- **`/productos/[slug]`** se genera con `getStaticPaths()` a partir de `fetchAllProducts()`: una página estática por cada producto **activo**. Después, cada página llama a `fetchProduct(slug)` para obtener la descripción y la galería completa de imágenes, y si esa llamada falla usa los datos del listado (primera imagen, sin descripción). Las páginas incluyen un breadcrumb, una galería de miniaturas y un formulario de leads "Solicita una cotización".
- **Orden**: el CMS no tiene un campo de orden para categorías ni productos, así que los editores los ordenan con un prefijo numérico en el nombre (`1 - EDRM`, `2 - Compresores`; `1 - EDRM-500`). El prefijo solo define el orden y nunca se muestra en el sitio. Respeta el formato `N - Nombre` (número, guion).
  - Las **categorías** se ordenan por el prefijo en `fetchCategories()`, así que los chips, los estantes y el submenú de Productos comparten un mismo orden. Las categorías sin prefijo conservan el orden de la API después de las numeradas.
  - Los **productos** se ordenan dentro de su categoría con `orderByPrefix()`, en los estantes del catálogo y en la página de producto (título, lista "Más de …"). Una categoría solo se reordena cuando **todos** sus productos tienen prefijo y no hay dos con el mismo número. Si no, toda la categoría conserva el orden y los nombres del servidor, con todo y prefijos.
- **Precios**: `price` es un string decimal en MXN. `null` (o cualquier valor no numérico) muestra **"Precio a cotizar"**, lo cual es normal para equipo industrial. El formato es moneda `es-MX`.
- **Agregar, renombrar, desactivar o borrar un producto (o una categoría) en el admin requiere volver a compilar**, como cualquier otro cambio de contenido. Mientras tanto, un producto nuevo no tiene página y uno eliminado sigue con su página vieja en `dist/`.

## Ajustes del lado del frontend

Algunas decisiones de presentación viven en este repositorio y no en el CMS. Cuando algo en el sitio no coincida con el admin, revisa aquí primero.

| Qué | Dónde |
| :--- | :---- |
| Submenú de Productos armado a partir de las categorías del catálogo (el menú del CMS siempre regresa Productos sin hijos) | `src/layouts/Layout.astro` |
| Orden de categorías y productos tomado de un prefijo `N - ` en el nombre, que luego se oculta (ver [Catálogo de productos](#catálogo-de-productos)) | `fetchCategories()` / `orderByPrefix()` en `src/functions/catalog.ts` |
| Menú de respaldo (Inicio, Sobre nosotros, Productos, Contacto) cuando `menu` no responde | `src/layouts/Layout.astro` |
| Redes sociales de respaldo (`#`) cuando `globals` no trae ninguna; solo facebook, instagram, linkedin, youtube y twitter tienen ícono, las demás se descartan | `src/layouts/Layout.astro` |
| Correo de respaldo del footer `contacto@tectuus.com`, lema del footer y línea de copyright | `src/layouts/Layout.astro` |
| Botón de WhatsApp oculto por completo cuando `globals` no trae número de teléfono | `src/layouts/Layout.astro` |
| Textos de la página de inicio que se muestran cuando `pages/inicio` no responde (carrusel, clientes, feature grid, formulario) | `src/pages/index.astro` |
| Hero (y, en Contacto, un formulario) que se muestra cuando faltan los datos del CMS de una página | `src/pages/{sobre-nosotros,productos,contacto}/index.astro` |
| Descripción de respaldo de la página de producto y textos del formulario de cotización | `src/pages/productos/[slug].astro` |
| Imágenes del CMS faltantes o rotas reemplazadas por `public/placeholder-plate.svg` | `FALLBACK_IMAGE` en `fetch.ts` + un listener `error` inline en `Layout.astro` |
| Nombre del sitio, título/descripción por defecto, dominio canónico (`siteUrl`) | `src/config/seo.ts` |

## 🧞 Comandos

| Comando | Acción |
| :------ | :----- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Inicia el servidor de desarrollo local en `localhost:4321` |
| `npm run build` | Trae el contenido y el catálogo del CMS y compila la salida estática en `./dist/` |
| `npm run preview` | Sirve localmente el `./dist/` compilado, tal como se va a desplegar |
| `npm run astro ...` | Corre comandos del CLI como `astro add`, `astro check` |

## Desarrollo

1. `npm install`
2. Crea `.env` con `CMS_API_URL` apuntando a un CMS accesible (local o remoto), terminando en `/api/public/tectuus/`.
3. `npm run dev`

En desarrollo, las páginas consultan el CMS en cada petición (no hay caché de memoización), así que los cambios en el CMS aparecen al recargar.

Para revisar una compilación de producción sin tocar `dist/`, compila a una carpeta temporal: `npx astro build --outDir <temp-dir>`.

Cuando inicies el servidor de desarrollo para una tarea automatizada o en segundo plano, usa `astro dev --background` y adminístralo con `astro dev status`, `astro dev logs` y `astro dev stop`.

## Compilación para producción

```sh
npm run build
npm run preview   # verifica localmente antes de desplegar
```

Esto genera un sitio completamente estático en `dist/`, sin necesidad de un runtime de servidor. El contenido y el catálogo se traen en tiempo de compilación, así que **cualquier cambio de contenido en el CMS necesita una nueva compilación y un nuevo despliegue** para aparecer en el sitio en vivo.

## Despliegue

`dist/` es un paquete estático, así que se puede hospedar en cualquier lugar que sirva archivos estáticos. Dos cosas aplican para cualquier destino:

- **URLs de carpeta**: cada página se compila como una carpeta con un `index.html` (p. ej. `/productos/<slug>/` es `dist/productos/<slug>/index.html`). El hosting debe servir `index.html` para una URL de carpeta, no solo en la raíz.
- **Encabezados de caché**: el HTML debe revalidarse en cada visita (`Cache-Control: no-cache`) para que los visitantes reciban las compilaciones nuevas de inmediato. Los archivos bajo `/_astro/` llevan hashes de contenido en el nombre y se pueden cachear un año (`public, max-age=31536000, immutable`).

Para AWS S3 + CloudFront, Azure (Blob o Static Web Apps) y Vercel/Netlify/Cloudflare Pages, sigue las recetas de [`../landing-gnu/README.md#despliegue`](../landing-gnu/README.md#despliegue), usando el `CMS_API_URL` y el dominio de este sitio.

### VPS con nginx

1. Instala Node `>=22.12.0` (según los engines de `package.json`), o compila en otro lado y sube solo `dist/`.
2. Configura `.env` con el `CMS_API_URL` correcto y luego corre `npm ci && npm run build`.
3. Sirve `dist/` con nginx (reemplaza el dominio y la ruta por los tuyos):

   ```nginx
   server {
       listen 80;
       server_name tectuus.example.com;

       root /var/www/tectuus/dist;
       index index.html;

       location / {
           try_files $uri $uri/ $uri.html =404;
           # Siempre revalidar el HTML para que los visitantes reciban las compilaciones nuevas (304 baratos vía ETag).
           add_header Cache-Control "no-cache";
       }

       # Los assets compilados con hash nunca cambian bajo el mismo nombre.
       location /_astro/ {
           add_header Cache-Control "public, max-age=31536000, immutable";
       }
   }
   ```

4. Recarga nginx: `sudo nginx -t && sudo systemctl reload nginx`.
5. Para volver a desplegar, compila de nuevo y copia el `dist/` nuevo encima del anterior. No hace falta reiniciar nada.

### Reconstruir desde el admin

Los editores pueden reconstruir el sitio por su cuenta con el botón **Reconstruir sitio** en la lista de páginas de Tectuus en `gnu-cms-admin`. Este llama a [`../build-server`](../build-server/README.md) (nombre de sitio `tectuus`), que corre `npm run build` en el `CODE_PATH` de este proyecto y reemplaza el `PUBLIC_PATH` servido con el `dist/` nuevo. Esto solo funciona cuando el sitio se sirve desde la máquina donde corre `build-server`; para otros hostings, compila y despliega a mano o desde CI.

## Guía de contenido

Tamaños de imagen y longitudes de texto recomendados por sección, para editores: [`../DOCUMENTACION-CONTENIDO-TECTUUS.txt`](../DOCUMENTACION-CONTENIDO-TECTUUS.txt). Las notas funcionales de cada página (Inicio, Quiénes somos, catálogo, captura de leads) están en [`tectuus-docs/`](./tectuus-docs/).

## Notas y advertencias

- **Salida estática, datos en tiempo de compilación**: todas las consultas al CMS (páginas, menú, globals, catálogo) se ejecutan en `astro build`, no por petición en producción. Cambiar variables de entorno en el servidor no hace nada sin volver a compilar.
- **Sin memoización de peticiones**: `Layout.astro` consulta `menu`, `globals` y `product-categories` en cada página que renderiza, así que una compilación hace esas peticiones una vez por página (incluida una vez por cada página de producto). Está bien con el tamaño actual del catálogo; si el catálogo crece, vale la pena una caché como el `src/lib/cms.ts` de `landing-gnu`.
- **Una petición fallida del catálogo no hace fallar la compilación**: `fetchAllProducts()` regresa lo que haya juntado hasta ese momento, así que una caída de la API durante una compilación puede publicar un catálogo parcial (o vacío) y perder páginas de producto. Revisa el log de la compilación en busca de `Error fetching data` antes de desplegar.
- **Nombres de variables de entorno reservados**: nunca uses `BASE_URL` (ni `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) para un valor propio de `.env`.
- **Nada de lógica compartida en archivos `.astro`**: mantén las funciones reutilizables que no son de UI en archivos `.ts` (`src/functions/`, `src/config/`). Astro maneja el alcance de los `const`/`let` de nivel superior en el frontmatter de un componente de forma distinta a un `export function` en el mismo frontmatter, así que una constante normal puede ser `undefined` dentro de una función exportada en tiempo de ejecución.
- **URLs de medios**: las rutas de medios relativas al CMS pasan por `mediaUrl()`. No pongas el host del CMS en duro en ningún otro lado. Las rutas `media/placeholder-*` de los seeders dan 404 y se cambian por la imagen de respaldo en el navegador.
- **Las URLs canónicas** se arman a partir de `seo.siteUrl` (`https://www.tectuus.mx`). Actualízala en `src/config/seo.ts` si el dominio de producción es otro.
- **`dist/` está versionado en git** (la línea `dist/` en `.gitignore` está comentada). Compila a una carpeta temporal cuando solo quieras revisar una compilación, para no modificar archivos versionados.
