# GNU Gas Natural — Landing

Sitio estático en Astro para GNU Gas Natural. El contenido (secciones de página, menú, entradas del blog, datos de contacto, redes sociales, estaciones, etc.) se captura en el CMS headless (gnu-cms-admin) y se trae por REST **en tiempo de compilación**; después se renderiza a HTML/CSS/JS plano.

## Estructura del proyecto

```text
/
├── public/                         # Archivos estáticos que se copian tal cual (favicon, cursor, imágenes)
├── src/
│   ├── assets/images/              # Imágenes que procesa el pipeline de assets de Astro (logos, sellos, insignias)
│   ├── components/
│   │   ├── CmsPage.astro           # Renderiza una página del CMS (GET pages/{slug}) en el orden de sus secciones
│   │   ├── SectionRenderer.astro   # Relaciona cada "type" de sección del CMS con su componente en sections/
│   │   ├── sections/               # Un componente por tipo de sección del CMS, más las bandas exclusivas de inicio
│   │   ├── BalancedGrid.astro      # Cuadrícula de tarjetas con filas balanceadas + paneles de la misma altura
│   │   ├── CardBadge.astro         # Insignia de flecha en los paneles de las tarjetas
│   │   ├── ServiceCards.astro      # Tarjetas tipo póster "Explora …" en /nuestros-servicios y /sobre-nosotros
│   │   ├── ChildPageCards.astro    # Tarjetas de páginas hijas en /desarrollo-sostenible
│   │   ├── BlogIndex.astro         # Listado del blog (lo usan /blog y /blog/pagina/[page])
│   │   ├── CertificacionesContent.astro  # Contenido solo del frontend para /sobre-nosotros/certificaciones
│   │   └── Simulator*.astro        # Formulario/resultado del simulador de ahorro y el botón flotante
│   ├── config/
│   │   ├── labelOverrides.ts       # Etiquetas de navegación/pestañas que difieren del título de la página en el CMS
│   │   ├── menuOrder.ts            # Orden en que se muestran los hijos del menú, por slug del padre
│   │   └── seo.ts                  # Valores SEO por defecto de todo el sitio
│   ├── functions/fetch.ts          # Cliente REST de bajo nivel (fetchData/sendData/updateData, mediaUrl)
│   ├── lib/
│   │   ├── cms.ts                  # Acceso tipado y memoizado al CMS (getPage, getMenu, getGlobals, childrenOf, …)
│   │   ├── richText.ts             # Limpia el texto enriquecido pegado desde el CMS
│   │   ├── media.ts, social.ts, clientLogos.ts
│   ├── layouts/Layout.astro        # Estructura compartida: encabezado, navegación, pie, botones flotantes, etiquetas SEO
│   ├── pages/                      # Rutas basadas en archivos: cada .astro aquí es una ruta
│   │   ├── index.astro             # Inicio: orden curado, no la lista de secciones tal como viene del CMS
│   │   ├── nuestros-servicios/     # + gnv, gnc, gnd
│   │   ├── sobre-nosotros/         # + nuestra-historia, proposito-empresarial, valores, certificaciones
│   │   ├── desarrollo-sostenible/  # + ecovadis, iniciativas-rse, voluntariado, distintivo-esr
│   │   ├── blog/                   # index, [slug], pagina/[page]
│   │   └── contacto/
│   ├── styles/                     # global.css, tokens.css (tokens de diseño)
│   └── types/globals.ts
├── certificaciones_images/         # Imágenes fuente + CAMPOS-BACKEND.md (campos que aún le faltan al CMS)
├── NEW-FIELDS.md                   # Campos que el frontend ya renderiza pero que el CMS todavía no tiene
├── astro.config.mjs
├── .env                            # CMS_API_URL (no se sube al repositorio)
└── package.json
```

La lógica reutilizable que no es un componente debe vivir en un archivo `.ts` plano, no en un `.astro`. Consulta [Notas y advertencias](#notas-y-advertencias).

## Configuración del entorno

El sitio lee la URL base del CMS de una sola variable de entorno:

```env
# .env
CMS_API_URL=https://gnu-headless-cms.165.227.59.215.sslip.io/api/public/gnu/
```

- Crea `.env` en la raíz del proyecto antes de correr dev o build. **No** se sube a git.
- `src/functions/fetch.ts` la lee con `import.meta.env.CMS_API_URL` y, si no está definida, usa `http://localhost:3000/`.
- **Es un valor de tiempo de compilación.** El sitio se compila a salida estática (sin adaptador de servidor), así que todas las llamadas al CMS ocurren durante `npm run build`, y el HTML en `dist/` se queda con lo que apuntaba `CMS_API_URL` en ese momento. Para apuntar a otro CMS, edita `.env` y vuelve a compilar.
- No nombres `BASE_URL` a una variable de entorno propia. Vite/Astro reservan ese nombre y lo sobrescriben en silencio con `"/"`. Lo mismo aplica para `MODE`, `DEV`, `PROD`, `SSR`, `SITE` y `ASSETS_PREFIX`.

## Cómo se comunica el sitio con el CMS

Las páginas y los componentes leen el CMS a través de [src/lib/cms.ts](src/lib/cms.ts), que envuelve al cliente de bajo nivel de [src/functions/fetch.ts](src/functions/fetch.ts):

| Función | Endpoint | Uso |
| :------- | :------- | :-- |
| `getPage(slug)` | `GET pages/{slug}` | Las secciones de una página (`{ type, content }[]`) |
| `getMenu()` | `GET menu` | Árbol de navegación; los hijos se reordenan según `config/menuOrder.ts` |
| `getGlobals()` | `GET globals` | Datos de contacto del pie, redes sociales, botón de WhatsApp, testimonios |
| `getBlogList(page)`, `getAllBlogPosts()`, `getBlogPost(slug)` | `GET blog…` | Listado y entradas del blog |
| `childrenOf(slug)` | (desde `menu`) | Las páginas hijas publicadas de un hub, para sus tarjetas |
| `sectionOf(page, type)`, `heroOf(page)` | — | Sacan una sección de una página ya cargada |

Las respuestas se memoizan por endpoint, así que una compilación completa hace una sola petición por endpoint sin importar cuántas páginas lo usen. `fetch.ts` también expone `sendData`/`updateData` (POST/PUT, los usan los formularios) y `mediaUrl(path)`, que convierte las rutas de medios del CMS en URLs absolutas.

La mayoría de las rutas son un solo `<CmsPage slug="…" />`. [SectionRenderer.astro](src/components/SectionRenderer.astro) relaciona cada `type` de sección con su componente. Para agregar un bloque nuevo controlado por el CMS:

1. Crea un componente en `src/components/sections/`.
2. Agrega un caso para su `type` en `SectionRenderer.astro`.
3. Haz que el CMS emita secciones de ese `type`.

El sitio también llama un endpoint en vivo desde el navegador: el simulador de ahorro trae los precios actuales de `GET savings-simulator?page=…` cuando un visitante hace un cálculo.

## Ajustes del lado del frontend

Algunas decisiones de presentación viven en este repositorio y no en el CMS. Cuando algo del sitio no coincida con el panel, revisa aquí primero.

| Qué | Dónde |
| :--- | :---- |
| Etiquetas de navegación (p. ej. Distintivo ESR → "Reconocimientos") | `src/config/labelOverrides.ts` |
| Orden de los hijos del menú de Sobre nosotros y Desarrollo sostenible | `src/config/menuOrder.ts` |
| Ocultar secciones del CMS en una página | `excludeTypes` en `<CmsPage>` (Propósito empresarial: `feature_grid`; GNC/GND: `savings_simulator`; Nuestros servicios: `clients_showcase`; Certificaciones: `feature_grid`) |
| Simulador de ahorro que solo se muestra en GNV, tomado de la página GNC del CMS | `insertSection` en `src/pages/nuestros-servicios/gnv/index.astro` |
| Cuerpo de la página Certificaciones (bloque ISO 9001) | `src/components/CertificacionesContent.astro`, hasta que existan en el CMS los campos de `certificaciones_images/CAMPOS-BACKEND.md` |
| Lista de estaciones en orden inverso al de la API | `src/components/sections/StationsMap.astro` |
| Títulos/subtítulos de las secciones de los hubs (bloques "Explora …") | El propio `src/pages/**/index.astro` del hub |

## 🧞 Comandos

| Comando | Acción |
| :------ | :----- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Levanta el servidor de desarrollo local en `localhost:4321` |
| `npm run build` | Trae el contenido del CMS y compila la salida estática en `./dist/` |
| `npm run preview` | Sirve localmente el `./dist/` compilado, tal como se va a desplegar |
| `npm run astro ...` | Corre comandos del CLI como `astro add`, `astro check` |

## Desarrollo

1. `npm install`
2. Crea `.env` con `CMS_API_URL` apuntando a un CMS accesible (local o remoto).
3. `npm run dev`

**Reinicia el servidor de desarrollo para ver los cambios del CMS.** La caché memoizada de `src/lib/cms.ts` dura lo que dure el proceso del servidor de desarrollo, así que las páginas siguen mostrando el contenido que se trajo en la primera petición hasta que lo reinicies. Los cambios en el código del frontend sí se recargan en caliente.

Para revisar una compilación de producción sin tocar `dist/`, compila a una carpeta temporal: `npx astro build --outDir <temp-dir>`.

Cuando levantes el servidor de desarrollo para una tarea automatizada o en segundo plano, usa `astro dev --background` y adminístralo con `astro dev status`, `astro dev logs` y `astro dev stop`.

## Compilar para producción

```sh
npm run build
npm run preview   # verifica localmente antes de desplegar
```

Esto genera un sitio totalmente estático en `dist/`, sin necesidad de un runtime de servidor. El contenido se trae en tiempo de compilación, así que **cualquier cambio de contenido en el CMS necesita una nueva compilación y despliegue** para aparecer en el sitio en vivo.

## Despliegue

`dist/` es un paquete estático, así que se puede hospedar en cualquier lugar que sirva archivos estáticos. El sitio se despliega en AWS S3, Azure y un VPS con nginx; cada uno se explica abajo.

Dos cosas aplican a todos los destinos:

- **URLs de carpeta**: cada página se compila como una carpeta con un `index.html` (p. ej. `/sobre-nosotros/valores/` es `dist/sobre-nosotros/valores/index.html`). El hosting debe servir `index.html` para una URL de carpeta, no solo en la raíz.
- **Encabezados de caché**: el HTML debe revalidarse en cada visita (`Cache-Control: no-cache`) para que los visitantes reciban las compilaciones nuevas de inmediato. Los archivos bajo `/_astro/` llevan un hash de contenido en el nombre y se pueden cachear por un año (`public, max-age=31536000, immutable`).

### AWS S3 (+ CloudFront)

1. **Compila** localmente o en CI con `CMS_API_URL` definida: `npm ci && npm run build`.
2. **Sube** en dos pasadas para que cada tipo de archivo reciba el encabezado de caché correcto, y para que `--delete` borre los archivos de compilaciones anteriores:

   ```sh
   BUCKET=s3://your-bucket

   # Assets con hash: caché de un año.
   aws s3 sync dist/_astro "$BUCKET/_astro" --delete \
     --cache-control "public, max-age=31536000, immutable"

   # Todo lo demás (HTML, archivos de public/): revalidar siempre.
   aws s3 sync dist "$BUCKET" --delete --exclude "_astro/*" \
     --cache-control "no-cache"
   ```

3. **Sírvelo** de una de estas dos formas:
   - **Hosting de sitio web estático de S3 (sin CloudFront)**: actívalo en el bucket con documento índice `index.html` y documento de error `404.html` si agregas uno. El endpoint de sitio web resuelve las URLs de carpeta por sí solo. Solo funciona con HTTP, y el bucket debe permitir lecturas públicas.
   - **CloudFront delante de un bucket privado (recomendado, HTTPS)**: usa el endpoint REST del bucket como origen con Origin Access Control, y configura `index.html` como objeto raíz por defecto. El origen REST **no** resuelve las URLs de carpeta, así que `/sobre-nosotros/` devolvería un error. Agrega esta CloudFront Function en el evento *viewer request*:

     ```js
     function handler(event) {
       var request = event.request;
       var uri = request.uri;
       if (uri.endsWith("/")) {
         request.uri += "index.html";
       } else if (!uri.split("/").pop().includes(".")) {
         request.uri += "/index.html";
       }
       return request;
     }
     ```

4. **Después de cada despliegue con CloudFront**, invalida el HTML en caché para que el edge sirva la compilación nueva. Los archivos de `/_astro/*` no lo necesitan, porque las compilaciones nuevas usan nombres de archivo nuevos:

   ```sh
   aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
   ```

### Azure

Dos opciones:

**Sitio web estático de Azure Storage (Blob)**, lo más parecido a S3:

1. En la cuenta de almacenamiento, activa *Static website* con documento índice `index.html`. Azure crea un contenedor `$web`, y el documento índice también aplica a las subcarpetas, así que las URLs de carpeta funcionan.
2. Sube en dos pasadas, en este orden. La primera sube todo con `no-cache`; la segunda vuelve a subir `_astro/` con el encabezado de caché largo:

   ```sh
   ACCOUNT=yourstorageaccount

   az storage blob upload-batch --account-name "$ACCOUNT" -d '$web' -s dist \
     --overwrite --content-cache-control "no-cache"

   az storage blob upload-batch --account-name "$ACCOUNT" -d '$web' -s dist \
     --pattern "_astro/*" --overwrite \
     --content-cache-control "public, max-age=31536000, immutable"
   ```

   `upload-batch` no borra los archivos de compilaciones anteriores. Limpia los archivos viejos con `az storage blob delete-batch` o `azcopy sync --delete-destination=true`.

3. Para HTTPS en un dominio propio, pon **Azure Front Door** (o Azure CDN) delante y purga su caché después de cada despliegue.

**Azure Static Web Apps**, un servicio administrado de compilación y hosting:

1. Crea el recurso apuntando a este repositorio/rama, con ubicación de la app `/` y ubicación de salida `dist`. A partir de ahí, cada push compila y despliega automáticamente.
2. Agrega `CMS_API_URL` en *Configuration → Environment variables*. Se lee en tiempo de compilación.
3. Las URLs de carpeta funcionan desde el principio. Define los encabezados de caché en un `staticwebapp.config.json` dentro de `public/`, para que se copie a `dist/`:

   ```json
   {
     "globalHeaders": { "Cache-Control": "no-cache" },
     "routes": [
       {
         "route": "/_astro/*",
         "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
       }
     ]
   }
   ```

4. Los cambios de contenido en el CMS no hacen push al repositorio, así que dispara un nuevo despliegue desde el portal de Azure o con un `workflow_dispatch` de GitHub Actions después de editar contenido.

### Otros hostings estáticos (Vercel, Netlify, Cloudflare Pages)

1. Define `CMS_API_URL` como variable de entorno de tiempo de compilación en la configuración del proyecto en la plataforma.
2. Comando de compilación: `npm run build`; directorio de salida: `dist`.
3. Dispara un nuevo despliegue cada vez que cambie el contenido del CMS.

### VPS con nginx

1. Instala Node `>=22.12.0` (según `engines` en `package.json`), o compila en otro lado y sube solo `dist/`.
2. Configura `.env` con el `CMS_API_URL` correcto y luego corre `npm ci && npm run build`.
3. Sirve `dist/` con nginx:

   ```nginx
   server {
       listen 80;
       server_name gnugas.mx www.gnugas.mx;

       root /var/www/landing-gnu/dist;
       index index.html;

       location / {
           try_files $uri $uri/ $uri.html =404;
           # Revalidar siempre el HTML para que los visitantes reciban las compilaciones nuevas (304 baratos vía ETag).
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

Sin el encabezado `Cache-Control` en el HTML, los navegadores adivinan cuánto tiempo conservar las páginas y pueden mostrar una compilación anterior después de un despliegue. El servidor nginx de `gnu.165.227.59.215.sslip.io` hoy no envía ese encabezado.

## Notas y advertencias

- **Salida estática, datos en tiempo de compilación**: cada fetch al CMS corre una sola vez en `astro build`, no en cada petición en producción. Cambiar variables de entorno en el servidor no tiene efecto sin volver a compilar.
- **Nombres de variables de entorno reservados**: nunca uses `BASE_URL` (ni `MODE`, `DEV`, `PROD`, `SSR`, `SITE`, `ASSETS_PREFIX`) para un valor propio en `.env`.
- **Nada de lógica compartida en archivos `.astro`**: deja las funciones reutilizables que no son de UI en archivos `.ts` (`src/lib/`, `src/functions/`, `src/config/`). Astro maneja el alcance de los `const`/`let` de nivel superior en el frontmatter de un componente de forma distinta a un `export function` en el mismo frontmatter, así que una constante simple puede ser `undefined` dentro de una función exportada en tiempo de ejecución.
- **URLs de medios**: las rutas de medios relativas del CMS se resuelven con `mediaUrl()` contra el origen del CMS bajo `/storage/<path>`. No pongas en duro el host del CMS en ningún otro lugar.
- **Tamaños de medios del hero**: el carrusel de inicio está dimensionado para banners de 1138×474 (800×340 también cabe, con franjas laterales delgadas). Los heroes de las páginas internas esperan imágenes de 2048×768 y GIFs de 800×320. Los GIFs siempre se muestran completos (sin recorte ni zoom) sobre una copia desenfocada de sí mismos.
- **Campos faltantes en el CMS**: los campos que el frontend ya soporta pero que el CMS todavía no expone están listados en `NEW-FIELDS.md` y `certificaciones_images/CAMPOS-BACKEND.md`.
