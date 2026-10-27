# GNU CMS Admin

Panel de administración para **cuatro sitios públicos independientes que comparten un mismo backend de CMS headless en Laravel**: `gnu` (sitio corporativo de GNU), `gas-natural` (GNU Vehicular / gas-gnu), `trainin` (Trainin Logistic) y `tectuus` (equipo industrial + catálogo de productos). Una sola SPA de React + Vite permite que los editores inicien sesión una vez y administren secciones de páginas, entradas del blog, leads de contacto, estaciones, citas de verificación y (para Tectuus) un catálogo de productos, en los cuatro sitios.

Consulta [`CLAUDE.md`](./CLAUDE.md) para las convenciones de código y la estructura del servidor de producción, y [`GUIDELINES.md`](./GUIDELINES.md) para el lenguaje de diseño que comparte con los sitios públicos.

## Stack técnico

- **React 19** + **Vite** (`vite build` impulsado por rolldown)
- **Tailwind CSS v4** vía `@tailwindcss/vite` — sin `tailwind.config.js`, las utilidades se usan directamente en el JSX
- **react-router v8** (`import from "react-router"`, no `react-router-dom`)
- **zustand** (+ middleware `persist`) para dos stores: sesión (token de autenticación) y URLs públicas por sitio
- **Leaflet** para los selectores de mapa de estaciones (secciones `stations_map` y el editor de estaciones)

## Inicio rápido

```bash
npm install
npm run dev       # http://localhost:5173 con HMR
```

Otros scripts:

```bash
npm run lint       # oxlint
npm run build      # compilación de producción -> dist/
npm run preview    # sirve la compilación de dist/ localmente, para una prueba final
```

## Configuración de entorno (`.env`)

```bash
# .env
VITE_BASE_URL=https://gnu-headless-cms.165.227.59.215.sslip.io
VITE_BUILD_SERVER_URL=http://localhost:4400
```

| Variable | Requerida | Propósito |
| :-- | :-- | :-- |
| `VITE_BASE_URL` | sí | El origen de la API del CMS, sin diagonal final. Cada llamada en `fetch.jsx` lo antepone a una ruta que empieza con `/api/...`. |
| `VITE_BUILD_SERVER_URL` | solo para el botón "Reconstruir sitio" | Origen del servicio independiente `build-server` (ver [Reconstruir un sitio](#reconstruir-un-sitio-reconstruir-sitio) más abajo). Sin ella, el botón de reconstrucción muestra un error claro de "no configurado" en lugar de fallar en silencio. |

- Ambas deben llevar el prefijo `VITE_` para que Vite las exponga al código del cliente (`import.meta.env.VITE_*`) — **todo lo que tenga ese prefijo se incluye en el bundle público de JS**, legible para cualquiera con las herramientas de desarrollo abiertas. Por eso nunca pongas un secreto ni una ruta del sistema de archivos del servidor en este archivo (ver la sección de reconstrucción para entender por qué `build-server` tiene su propio `.env`, aparte).
- Se leen en tiempo de compilación: cambiar un valor requiere reiniciar `npm run dev` o volver a correr `npm run build`.
- `.env` **está versionado en este repo** (no está en el gitignore) — a propósito, ya que hoy no contiene secretos, solo un origen de API público y la URL de un servicio. Para apuntar a otro backend (staging, otro entorno) sin tocar el archivo versionado, crea `.env.production.local` / `.env.development.local` con el valor a sobrescribir; Vite los toma automáticamente y quedan ignorados por el patrón por defecto de Vite.

## Autenticación y sesiones

[`src/store/sessionStore.jsx`](./src/store/sessionStore.jsx) es un store de zustand (`useSessionStore`) que guarda `accessToken` y `tenantDomain`, envuelto en `persist` para que la sesión sobreviva a una recarga (llave de `localStorage` `gnu-cms-session`; solo se persiste `accessToken` — `tenantDomain` siempre se toma fresco de `VITE_BASE_URL` al cargar, para que una sesión vieja no pueda amarrar la app en silencio a un host de API obsoleto).

- `login(email, password)` llena el store si tiene éxito.
- `logout()` llama al endpoint de logout del backend y después siempre limpia `accessToken` (en un `finally`), aunque la petición falle.
- **Cualquier otra llamada autenticada** revisa si la respuesta es `401` y, si es así, llama a `handleUnauthorized()`, privada del módulo: limpia `accessToken` y redirige a `/login` (con una protección para no entrar en bucle si ya está ahí). El TTL por defecto de un JWT del backend es de una hora, así que esta es la forma normal en que una pestaña abierta mucho tiempo regresa al login, no solo una ruta de logout.

## Identificadores de sitio — cuatro nombres para los mismos cuatro sitios

Esto es lo más confuso de todo el código, así que tiene su propia tabla. El mismo sitio se nombra distinto según la capa en la que estés:

| Sitio | Prefijo de ruta del admin (`src/pages/<this>`, `App.jsx`) | Slug `site` del CMS (`?site=` en cada llamada a la API) | Llave del store `pageUrls` | Prefijo de variables de entorno de `build-server` |
| :-- | :-- | :-- | :-- | :-- |
| GNU corporativo | `gnu` | `gnu` | `gnu` | `VITE_GNU_` |
| GNU Vehicular | `gas-natural` | `gnu-vehicular` | `gas-gnu` | `VITE_GAS_NATURAL_` |
| Trainin Logistic | `trainin` | `traninn-logistic` | `trainin` | `VITE_TRANINN_` |
| Tectuus | `tectuus` | `tectuus` | `tectuus` | `VITE_TECTUUS_` |

Tres de los cuatro tienen un slug del CMS **distinto** a su prefijo de ruta del admin — el prop `site="..."` de un componente de página (que se pasa a `PageSectionsEditor`/`SectionsFields`) debe ser el slug del CMS (columna del medio), no el prefijo de ruta; si no, cada fetch de esa página regresa 404 o vacío en silencio. Revisa esto en particular al agregar una página a `gas-natural`, `trainin` o `tectuus`.

## Cómo se comunica la app con el backend (REST)

Todas las llamadas HTTP viven en **[`src/functions/fetch.jsx`](./src/functions/fetch.jsx)** — no hay una librería de cliente de API aparte ni generación de código; cada endpoint tiene ahí una pequeña función `async` exportada. Las páginas importan solo las funciones que necesitan en lugar de llamar a `fetch` directamente, y cada llamada que modifica datos sigue el mismo patrón escrito a mano (sus propios headers, su propia revisión de 401, su propio catch) en lugar de un wrapper `request()` compartido — copia la función existente más parecida al conectar un endpoint nuevo.

Toda respuesta del backend sigue el sobre `{ status: "success" | "error", data, meta }`; una falla de red o un `401` se normaliza a esa misma forma para que cada llamador pueda leer `res.status`/`res.data` sin su propio `try`/`catch`.

| Función | Endpoint | Notas |
| :-- | :-- | :-- |
| `login(email, password)` | `POST /api/admin/auth/login` | Llena el store de sesión si tiene éxito |
| `logout()` | `POST /api/admin/auth/logout` | Limpia el token sin importar la respuesta |
| `fetchData(suffix)` | `GET <suffix>` | GET autenticado genérico — pasa p. ej. `` `/api/admin/sections?site=gnu&page=inicio` `` |
| `updateSection(id, content)` | `PUT /api/admin/sections/{id}` | Reemplazo completo de `content` (ver [Semántica de edición de secciones](#semántica-de-edición-de-secciones)) |
| `createBlogPost` / `updateBlogPost` / `deleteBlogPost` | `/api/admin/blog-posts` | Solo gnu, gas-natural y trainin — Tectuus no tiene blog |
| `createProductCategory` / `updateProductCategory` / `deleteProductCategory` | `/api/admin/product-categories` | Solo Tectuus |
| `createProduct` / `updateProduct` / `deleteProduct` | `/api/admin/products` | Solo Tectuus |
| `createStation` / `updateStation` / `deleteStation` | `/api/admin/stations` | Respalda la lista de estaciones de cada sección `stations_map` (ver `stations-editor.jsx`) |
| `deleteAppointment(id)` | `DELETE /api/admin/appointments/{id}` | Se leen vía `fetchData`; no hay create/update — una cita solo la genera un visitante del sitio |
| `uploadMedia(file)` | `POST /api/admin/media` (multipart) | Regresa `{path, url}`; la `url` es lo que se guarda en el contenido de la sección/entrada — la UI nunca guarda archivos crudos |
| `rebuildSite(site)` / `getRebuildStatus(site)` | `POST`/`GET /builds/:site` de `build-server` | Servicio aparte, ver abajo |

## Rutas y estructura de carpetas

- `src/App.jsx` es dueño del árbol `<Routes>` de nivel superior y renderiza directamente la landing page pública.
- Los componentes de ruta viven en `src/pages/<site>/<page>/index.jsx` y se enrutan en `/<site>/<page>` — no hay un router basado en el sistema de archivos, así que agregar una página implica agregar tanto el archivo **como** un `<Route>` en `App.jsx`.
- `BrowserRouter` envuelve a `<App />` en `src/main.jsx`.

```
src/
├── App.jsx                    # árbol <Routes> + la landing page pública
├── main.jsx                    # raíz de React, envuelve <App /> en <BrowserRouter>
├── index.css                   # punto de entrada de Tailwind
├── assets/                     # imágenes que usa la landing page
├── components/
│   ├── card.jsx                  # tarjeta con punto de estado que se usa en el dashboard de Home
│   ├── form-fields.jsx           # primitivas compartidas: Field, ImageField (carga + validación
│   │                              # de tamaño/dimensiones del lado del cliente), DynamicItem, AddButton, CharHint/
│   │                              # WordHint, fieldError(), inputClass/buttonSecondaryClass
│   ├── map-picker.jsx             # <MapPicker lat lng onPick zoom /> — marcador de Leaflet que se coloca con clic
│   ├── stations-editor.jsx        # <StationsEditor site siteId /> — CRUD de las estaciones de un sitio
│   │                              # (nombre/dirección/teléfono/horario/lat-lng/activa), incrustado bajo
│   │                              # cada tarjeta de sección `stations_map`
│   ├── site-url-link.jsx          # <SiteUrlLink site /> — liga directa + lápiz para editar la
│   │                              # URL pública de un sitio (respaldada por el store pageUrls)
│   ├── rebuild-site-button.jsx    # <RebuildSiteButton site /> — el botón "Reconstruir sitio"
│   └── page-sections-editor.jsx   # la maquinaria compartida de edición de secciones (ver abajo)
├── functions/
│   └── fetch.jsx                 # todas las llamadas REST (ver arriba)
├── store/
│   ├── sessionStore.jsx           # zustand: token de autenticación, dominio del tenant
│   └── pageUrls.jsx                # zustand+persist: mapa sitio -> URL pública
└── pages/
    ├── login/, home/                       # estructura antes y después del login
    ├── gnu/                                 # sitio corporativo de GNU
    ├── gas-natural/                          # GNU Vehicular (slug del CMS gnu-vehicular)
    ├── trainin/                              # Trainin Logistic (slug del CMS traninn-logistic)
    └── tectuus/                              # Tectuus
```

Cada carpeta de sitio sigue la misma forma: un `select-page.jsx` (la cuadrícula de tarjetas que aparece después de hacer clic en la tarjeta de ese sitio en Home — también aloja `<SiteUrlLink>` y `<RebuildSiteButton>`), y luego una subcarpeta por cada elemento de navegación de nivel superior. Un elemento de navegación con sus propios hijos (p. ej. `nuestros-servicios`) es a su vez una carpeta estilo `select-page` con un `index.jsx` que lista sus hijos más un `portada/index.jsx` que edita las secciones **propias del elemento padre** — el `index.jsx` del padre es pura navegación, no contiene contenido del CMS.

## Componentes compartidos

**`page-sections-editor.jsx`** es la abstracción central con la que está construida casi cada página: "obtén las secciones de esta página, renderiza un editor por cada `type` de sección, deja que el editor haga `PUT` del contenido completo de la sección". Exporta:

- **`PageSectionsEditor`** (default) — el marco completo de la página (liga de regreso, título, conteo de secciones) + `SectionsFields`. La mayoría de las páginas lo usan como wrapper de una línea: `<PageSectionsEditor site="..." page="..." title="..." backTo="..." includeGlobals? />`.
- **`SectionsFields`** — versión headless (sin liga de regreso ni título), para incrustarla junto a otro contenido (p. ej. las páginas de Contacto la incrustan debajo de su tabla de leads).
- **`GlobalSectionsFields`** — solo las secciones de todo el sitio (`contact_info`, `social_icons`, `whatsapp_button` y `testimonials` donde el sitio la tenga) — estas tienen `page_id: null` del lado del servidor, así que se obtienen y renderizan por separado, no se mezclan en la lista de una página específica. Pasa `includeGlobals` en `PageSectionsEditor`/`SectionsFields` solo desde la única página que debe mostrarlas (la landing page de cada sitio), o incrusta `<GlobalSectionsFields site="..." />` directamente, como hace `gnu/editable-sections` (una página anterior a este componente compartido que, por razones históricas, todavía tiene su propia copia local de varios editores).

**Comportamiento no obvio conocido**: se ha visto que `GET /api/admin/sections?site&page=` en al menos un sitio (`traninn-logistic`) regresa *todas* las secciones del sitio sin importar el filtro `page`. Para mantenerse correctos sin importar qué backend se comporte así, `loadPageSections`/`loadGlobalSections` resuelven el `page_id` numérico real desde `GET /api/admin/pages?site=` y filtran el resultado del lado del cliente en lugar de confiar en el filtro `page` del servidor — así cada página se autocorrige de forma defensiva aunque el filtro del backend no haga nada.

### Semántica de edición de secciones

- `PUT /api/admin/sections/{id}` es un **reemplazo completo** de `content`, no un parche — arreglos como `slides`/`items`/`logos` se reemplazan enteros. Cada editor mantiene todo el objeto `content` en su estado local y lo envía completo al guardar.
- Algunos campos son "fijos" del lado del servidor según el tipo de sección — p. ej. `lead_capture_form.fields[]` — el backend los excluye de la validación y vuelve a combinar el valor anterior, así que el admin no necesita (ni puede) cambiarlos; el editor solo los muestra en modo de solo lectura.
- Un `type` de sección sin editor correspondiente se renderiza como un bloque JSON de solo lectura con formato en lugar de un formulario, para que un tipo de sección recién sembrado nunca se vea roto en el admin — simplemente todavía no se puede editar desde la UI.

### Tipos de sección con editor real

| Tipo | Qué edita |
| :-- | :-- |
| `page_hero` | Título, subtítulo, imagen |
| `rich_text` | Título, cuerpo HTML, URL de video |
| `feature_grid` | Título de la sección + tarjetas (ícono, título, texto) |
| `clients_showcase` | Título de la sección + logos (imagen, nombre, liga, descripción, cita, autor de la cita) |
| `stations_map` | Título, centro/zoom del mapa (se coloca con clic) — **además** del `StationsEditor` incrustado para los pines reales de las estaciones de ese sitio |
| `lead_capture_form` | Título, introducción, texto del botón de envío (la lista `fields[]` está bloqueada) |
| `service_scheduling` | Título, introducción, mensaje de confirmación (los horarios disponibles para agendar están en duro en el backend, no son contenido) |
| `banner_carousel` | Slides (imagen, título, subtítulo, URL/texto de la liga) |
| `savings_simulator` | Título, introducción, filas de comparación de precios de combustible |
| `contact_info` | Dirección, teléfono, correo, horario, información adicional |
| `social_icons` | Lista de red + URL |
| `whatsapp_button` | Teléfono, mensaje prellenado |
| `image_gallery` | Título de la sección + imágenes (imagen, pie de foto, alt) |
| `testimonials` | Título de la sección + citas (foto, cita, autor, puesto) |

## Mapa de contenido por sitio

| Sitio | Blog | Contacto | Extras específicos del sitio |
| :-- | :-- | :-- | :-- |
| `gnu` | sí | leads + secciones | `desarrollo-sostenible` (padre + 4 hijos), `sobre-nosotros` (padre + 4 hijos), `nuestros-servicios` (padre + GNC/GND/GNV) |
| `gas-natural` | sí | leads + secciones | `nuestros-servicios` (padre + 5 páginas de servicio), `ubicaciones` (padre + 2 estaciones + `agenda-tu-verificacion` con su propia lista de citas + `talleres`) |
| `trainin` | sí | leads + secciones | `nuestros-servicios` (padre + 3 hijos), `sobre-nosotros` (padre + 3 hijos), `ubicaciones` (una sola página plana) |
| `tectuus` | **no** | leads (con una columna "Origen" — el formulario de leads de este sitio existe en más de una página) + secciones | `sobre-nosotros` (una sola página plana, sin hijos), `productos` (su propia sección `page_hero` **más** el CRUD completo del catálogo de categorías/productos — un recurso de datos aparte, no secciones del CMS) |

La landing page de cada sitio (`inicio`/`editable-sections`) se renderiza con `includeGlobals`, así que también es donde se editan `contact_info`/`social_icons`/`whatsapp_button`/`testimonials`.

## Accesos directos a la URL pública de cada sitio

`src/store/pageUrls.jsx` + `<SiteUrlLink site="..." />` (arriba de cada `select-page.jsx`) le permite a un editor ir directo a la URL pública en vivo de ese sitio, con un ícono de lápiz para actualizar la URL guardada ahí mismo. Es solo un marcador de conveniencia en `localStorage` — no tiene efecto en el ruteo, el CMS ni la compilación; aquí `site` debe ser la columna **llave del store `pageUrls`** de la tabla de identificadores de arriba, no la ruta del admin ni el slug del CMS.

## Reconstruir un sitio ("Reconstruir sitio")

Los sitios de Astro solo leen el CMS **en tiempo de compilación**, así que una edición guardada no se ve en el sitio público hasta que se reconstruye — y una SPA en el navegador no puede correr `npm run build` ni tocar por sí misma el sistema de archivos de un servidor. `<RebuildSiteButton site="..." />` (prefijo de ruta del admin) llama a un servicio de Node **independiente** y sin dependencias, `../build-server`, vía `rebuildSite`/`getRebuildStatus` en `fetch.jsx`.

- Configúralo con `VITE_BUILD_SERVER_URL` en el `.env` de **este** repo — solo la URL, nada más va aquí.
- Todo lo demás — el `CODE_PATH` de cada sitio (donde corre `npm run build`) y el `PUBLIC_PATH` (lo que sirve el servidor web, reemplazado por completo con `CODE_PATH/dist/` después de una compilación exitosa) — vive en el `.env` propio de `build-server`, nunca en este, ya que el `.env` de este repo se incluye en el bundle público del navegador y esas son rutas reales del sistema de archivos del servidor.
- Un sitio con rutas sin definir o de ejemplo hace que la compilación falle de forma cerrada con un error claro en lugar de arriesgarse a una operación destructiva en el sistema de archivos.
- Configuración completa, API y notas de seguridad: **[`../build-server/README.md`](../build-server/README.md)**.

## Compilar para producción

```bash
npm run build
```

Genera un sitio estático en `dist/` — `index.html` más una carpeta `assets/` (bundles de JS/CSS con hash). Es una SPA puramente del lado del cliente: **cada ruta debe caer de regreso a `index.html`**, ya que el `BrowserRouter` de `react-router` resuelve rutas como `/gnu/blog` en el cliente. Las dos opciones de despliegue de abajo toman esto en cuenta.

### Desplegar `dist/` en Nginx

1. Copia el contenido de `dist/` al servidor, p. ej. `/var/www/gnu-cms-admin`.
2. Bloque server de Nginx:

   ```nginx
   server {
       listen 80;
       server_name admin.example.com;

       root /var/www/gnu-cms-admin;
       index index.html;

       # fallback de SPA: cualquier ruta desconocida sirve index.html, react-router se encarga desde ahí
       location / {
           try_files $uri $uri/ /index.html;
       }

       # caché larga para los assets con hash de la compilación; index.html NO debe guardarse en caché
       location /assets/ {
           access_log off;
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       location = /index.html {
           add_header Cache-Control "no-cache";
       }
   }
   ```

3. Pon TLS al frente (p. ej. `certbot --nginx`) — el admin envía un bearer token en cada petición, así que solo debe servirse por HTTPS.
4. Recarga: `nginx -t && systemctl reload nginx`.

### Desplegar `dist/` en Amazon S3

1. Crea un bucket (el nombre del bucket no tiene que coincidir con el dominio, a menos que lo uses como destino apex/CNAME).
2. Activa **Static website hosting** en el bucket:
   - Index document: `index.html`
   - **Error document: `index.html`** — es el equivalente del fallback de SPA de la regla `try_files` de Nginx de arriba. Sin esto, recargar en `/gnu/blog` regresa la página 404 de S3 en lugar de la app.
3. Sube la compilación, reemplazando lo que hubiera antes:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```
4. Configura la política del bucket para permitir `s3:GetObject` público (o mantenlo privado y pon el Origin Access Control de CloudFront al frente — de todos modos es lo recomendado para HTTPS + un dominio propio).
5. **Recomendado**: pon una distribución de CloudFront al frente del bucket:
   - Origen: el bucket (vía OAC, no el endpoint público del sitio web)
   - Agrega una **respuesta de error personalizada**: HTTP 403 y 404 → página de respuesta `/index.html`, código HTTP `200` — este es el fallback de SPA a nivel de CloudFront (necesario porque un origen S3 con OAC no aplica la configuración "error document" propia del bucket).
   - Asocia un certificado de ACM para HTTPS y tu dominio.
6. Nuevos despliegues: vuelve a correr el comando `aws s3 sync` y luego invalida la caché de CloudFront para `/index.html` (`aws cloudfront create-invalidation --distribution-id <id> --paths "/index.html"`) para que los clientes no se queden con la compilación anterior en caché.

### Desplegar `dist/` en Azure Static Web Apps

La opción más sencilla de Azure para esta app: un host estático con fallback de SPA integrado, TLS administrado gratis en un dominio propio y (si lo vinculas a este repo) un pipeline de CI que Azure configura por ti.

1. Agrega `staticwebapp.config.json` en la **raíz del repo** (Azure lo busca junto a la app, o dentro de `dist/` si prefieres versionarlo ahí):

   ```json
   {
     "navigationFallback": {
       "rewrite": "/index.html",
       "exclude": ["/assets/*", "/favicon.svg", "/*.{png,jpg,svg,ico}"]
     },
     "globalHeaders": {
       "Cache-Control": "no-cache"
     },
     "mimeTypes": {
       ".json": "application/json"
     }
   }
   ```

   `navigationFallback` es el equivalente del fallback de SPA de las reglas `try_files` de Nginx / "error document" de S3 de arriba — cualquier ruta desconocida sirve `index.html` y `react-router` se encarga desde ahí, mientras que la lista `exclude` evita que la reescritura se trague las peticiones reales de assets (y los 404 legítimos de esos assets).

2. **Las variables de entorno son de tiempo de compilación, no de ejecución** — la misma advertencia que en todo este README. Azure Static Web Apps no tiene un servidor que lea "Application settings" en cada petición para una compilación estática como esta; `VITE_BASE_URL`/`VITE_BUILD_SERVER_URL` deben definirse como variables del pipeline/CI (o en un `.env.production` versionado) *antes* de que corra `npm run build`, no configurarse en el portal de Azure después del despliegue.
3. Despliega de alguna de estas formas:
   - **Con el CLI de Azure Static Web Apps**, apuntándolo directamente a la salida ya compilada: `swa deploy ./dist --env production` (después de `swa login`), o
   - **Con GitHub Actions**: al crear el recurso Static Web App en el portal de Azure y vincularlo a este repo, se genera un workflow que usa `Azure/static-web-apps-deploy@v1`. Define `app_location` como la raíz del repo, `output_location` como `dist`, y agrega un paso de compilación (`npm ci && npm run build`) antes del paso de despliegue — no dejes que el paso de compilación Oryx propio de la action corra `npm run build` por ti, a menos que las variables de entorno del pipeline también estén definidas en esa etapa.
4. Dominio propio + TLS: asocia el dominio en la sección **Custom domains** de la Static Web App — Azure emite y renueva el certificado automáticamente, no hace falta el paso de `certbot`.
5. Nuevos despliegues: vuelve a correr `swa deploy` (CLI) o simplemente haz push a la rama vinculada (GitHub Actions) — Azure Static Web Apps reemplaza el despliegue anterior y se encarga de invalidar la caché por ti.

Si prefieres usar la misma forma de bucket + CDN que en la sección de S3 de arriba en lugar de Static Web Apps, el equivalente en Azure es **Blob Storage static website hosting + Azure CDN/Front Door** al frente, con la respuesta de error personalizada del CDN (404 → `/index.html`, 200) en lugar de la de CloudFront.

## Limitaciones conocidas

- **No hay editor de títulos de página/menú.** El `title` propio de una página (que se usa p. ej. como texto de la etiqueta en las tarjetas de vista previa estilo `ServiceCards` de los sitios públicos) es dato del blueprint/seed — `UpdatePageRequest` solo acepta `is_published`, y nada en el admin expone una pantalla de configuración de página. Cambiar el título de una página requiere un cambio en el backend.
- **No hay UI para crear secciones.** El backend hace upsert de una sección por `(page_id, type)` vía `PUT`, pero el admin no tiene un control de "agregar una sección nueva a esta página" — las secciones se siembran del lado del servidor; el admin solo edita las existentes.
- **No hay UI para explorar/administrar la biblioteca de medios.** `uploadMedia()` (`POST /api/admin/media`) se usa en todos los lugares donde se elige un archivo, pero no hay pantalla para `GET /api/admin/media` (listar archivos subidos antes para reutilizarlos) ni para `DELETE /api/admin/media/{name}` (eliminar una carga vieja) — el backend ya soporta ambos.

## Otras notas relevantes

- **No hay backend en este repo.** Este proyecto solo se comunica con la API del CMS headless (y con el `build-server` aparte) por HTTP; aquí no hay código de servidor, base de datos ni SSR — una vez compilado es un bundle estático.
- **Sistema de diseño**: los colores, botones y estilos de tarjeta/glass están documentados en `CLAUDE.md`; mantén la UI nueva consistente con esa paleta en lugar de introducir colores nuevos.

## Ordenar categorías y productos en el sitio de Tectuus
- **Orden**: el CMS no tiene un campo de orden para categorías ni productos, así que los editores los ordenan con un prefijo numérico en el nombre (`1 - EDRM`, `2 - Compresores`; `1 - EDRM-500`). El prefijo solo define el orden y nunca se muestra en el sitio. Respeta el formato `N - Nombre` (número, guion).
  - Las **categorías** se ordenan por el prefijo en `fetchCategories()`, así que los chips, los estantes y el submenú de Productos comparten un mismo orden. Las categorías sin prefijo conservan el orden de la API después de las numeradas.
  - Los **productos** se ordenan dentro de su categoría con `orderByPrefix()`, en los estantes del catálogo y en la página del producto (título, lista "Más de …"). Una categoría solo se reordena cuando **todos** sus productos tienen prefijo y ninguno repite número. Si no, toda la categoría conserva el orden y los nombres del servidor sin cambios, prefijos incluidos.
