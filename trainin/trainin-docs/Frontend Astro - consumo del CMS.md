# Frontend Astro — consumo del CMS

*Cómo el sitio Astro `trainin` pinta el contenido de `traninn-logistic`. Todo el contenido visible sale de la API: no hay copias hardcodeadas de textos, precios, logos ni estaciones. Un tipo de sección nuevo se resuelve en **un componente + un `case`**; una página nueva del blueprint, en **un archivo de 5 líneas**.*

---

## Flujo Simple

```
Paso 1: Layout.astro pide lo que comparten todas las páginas
        GET /menu      → header y footer
        GET /globals   → contacto, redes, WhatsApp
⬇️
Paso 2: La página pide su propio contenido
        GET /pages/{slug}  →  data.sections[]
⬇️
Paso 3: PageSections.astro recorre sections[] en el orden de la API
        y por cada `type` elige un componente
⬇️
Paso 4: Las secciones que necesitan datos de sitio los piden ellas mismas
        stations_map      → GET /stations
        lead_capture_form → GET /globals (solo el WhatsApp)
⬇️
Paso 5: El visitante envía el formulario
        POST /leads  con `source` = slug de la página
```

---

## Decisiones Clave de Implementación

### 1. El orden lo manda la API, no el archivo

`PageSections.astro` recorre `data.sections` y elige componente por `type`. No hay orden fijo en el código: reordenar las secciones en el panel reordena la página. Un `type` desconocido cae en `default: return null`, así que **sembrar un tipo nuevo no rompe el build** — solo no se ve hasta que tenga componente.

```js
// src/components/PageSections.astro
sections.map((section, index) => {
    switch (section.type) {
        case "banner_carousel": { … }
        case "page_hero": { … }
        …
        default:
            return null;   // tipo sin componente todavía
    }
})
```

Por eso las 11 rutas del sitio son el mismo archivo cambiando un slug:

```js
const pageResponse = await fetchData("pages/logistica");
const page = pageResponse?.data;
---
<Layout title={page?.title}>
  <PageSections sections={page?.sections ?? []} slug={page?.slug} />
</Layout>
```

### 2. Cero contenido hardcodeado, y qué implica

Se quitaron todos los `fallback*` de contenido que traían los componentes (títulos, intros, precios de combustible, logos de ejemplo, tarjetas de servicios). Consecuencia deliberada: **si el CMS no manda un campo, no se pinta nada** — un `rich_text` con `title: null` sale sin encabezado, y un `page_hero` sin `title` no renderiza la sección.

Los únicos textos que quedan en el código son de interfaz, no de contenido: las etiquetas de los campos del formulario (`Nombre`, `Correo electrónico`…, porque el CMS solo manda `fields[]` con las claves), el enlace *Volver al blog*, el estado *Enviando…* y la entrada **Blog** del menú (ver 6).

### 3. `stations_map` no trae pines → el componente los pide

La nota de lectura del doc de *Ubicaciones* está implementada tal cual: la sección solo da encuadre (`center`, `zoom`), y `StationsMap.astro` hace su propio `GET /stations`. Así la sección funciona en cualquier página donde el panel la siembre, sin que la página tenga que saber nada de estaciones.

- El mapa es **Leaflet 1.9.4 + tiles de OpenStreetMap**, desde CDN con hash SRI. Sin API key y sin dependencia en `package.json`.
- La **lista de bases se renderiza en el servidor** junto al mapa: nombre, dirección, horario y teléfono como `tel:`. Si Leaflet o los tiles no cargan, el contenido sigue ahí.
- `center` se parsea de `"19.7028,-101.1920"`; si falta o viene mal, se cae a la primera estación. Con más de un pin se hace `fitBounds`, así que el encuadre real lo terminan definiendo las estaciones.

### 4. `source` viaja en cada lead

El sitio tiene dos formularios (`inicio` y `contacto`) y la bandeja los distingue por `source`. La página conoce su slug, así que se pasa hacia abajo — `PageSections` → `Contacto.astro` → cuerpo del `POST`:

```js
body: JSON.stringify(leadSource ? { ...data, source: leadSource } : data),
```

El envío muestra `meta.message` del CMS cuando responde 201, y también cuando falla: un **422** de validación o un **429** del `throttle:10,1` se le enseñan al visitante en vez de un mensaje genérico.

`details` no se manda: ninguno de los dos formularios declara campos extra en `fields[]`, y el backend rechaza claves no declaradas.

### 5. `/globals` para lo que es de sitio, no de página

Redes sociales, WhatsApp y datos de contacto se leen de `GET /globals`, no de las secciones de `/pages/inicio`. El header y el footer los reciben del `Layout`; el `lead_capture_form` resuelve su botón de WhatsApp por su cuenta, porque puede vivir en una página que no los tenga a mano.

`social_icons` manda `network` + `url`; el **path SVG de cada icono está en el código** (un diccionario por nombre de red) y las redes que no estén en él se descartan. Es catálogo de interfaz, no contenido.

### 6. El blog no está en el menú

`GET /menu` deriva del árbol de páginas publicadas y el blog no es una página del blueprint, así que no aparece. Se agrega **una** entrada fija en `Header.astro`, junto a las del CMS:

```js
// The CMS menu endpoint does not list the blog, so it is appended alongside it.
const blogItem: MenuItem = { slug: "blog", path: "/blog", title: "Blog", children: [] };
const navItems = [...(menu?.length ? menu : fallbackMenu), blogItem];
```

`/blog` lista siguiendo `meta.last_page` (no se detiene en los primeros 10) y `/blog/{slug}` es una ruta estática por entrada: `getStaticPaths` pide el detalle de cada una, porque el listado no trae `body`.

### 7. Índices por `slug`, nunca por posición

El aviso de *«cambio incompatible»* del doc del menú (2 → 4 columnas, *Sobre nosotros* de `data.1` a `data.2`) no aplica a este front: nada indexa el menú por posición. El header recorre el árbol completo y el footer arma una columna por entrada **que tenga hijos**, así que publicar o despublicar una página cambia ambos sin tocar código.

### 8. El `banner_carousel` en página interior se pinta distinto

Las páginas hijas de *Sobre nosotros* llevan `page_hero` **y** `banner_carousel`. Renderizados igual, quedaban dos franjas a sangre pegadas una a la otra. Cuando el carrusel **no** es la primera sección (`index > 0`) se pinta compacto: alto `min(22rem, 45vh)`, ancho de contenedor con esquinas redondeadas y aire arriba y abajo. En `/` sigue a sangre y a pantalla completa.

---

## Implementación

### Rutas y su origen

| ruta | endpoint |
| --- | --- |
| `/` | `pages/inicio` |
| `/nuestros-servicios` + 3 hijas | `pages/{slug}` |
| `/sobre-nosotros` + 3 hijas | `pages/{slug}` |
| `/ubicaciones` | `pages/ubicaciones` + `stations` |
| `/contacto` | `pages/contacto` |
| `/blog` | `blog` (paginado) |
| `/blog/{slug}` | `blog` + `blog/{slug}` |

### Tipos de sección → componente

| `type` | componente | notas |
| --- | --- | --- |
| `banner_carousel` | `Hero.astro` | compacto si no es la primera sección |
| `page_hero` | `PageHero.astro` | `image` opcional de fondo |
| `savings_simulator` | `Simulador.astro` | tasas derivadas de `equivalence_factor`; el cálculo corre en el cliente |
| `rich_text` | `RichText.astro` | `set:html` + `video_url` convertido a embed (YouTube/Vimeo) |
| `feature_grid` | `FeatureGrid.astro` | `icon` opcional |
| `image_gallery` | `ImageGallery.astro` | `alt` cae a `caption` y luego a `""` |
| `clients_showcase` | `Clientes.astro` | con `description`/`quote` pinta tarjetas; sin ellos, rejilla de logos |
| `stations_map` | `StationsMap.astro` | pide `stations` |
| `lead_capture_form` | `Contacto.astro` | `POST /leads` con `source` |

### Archivos

| Capa | Archivo | Rol |
| --- | --- | --- |
| Layout | `src/layouts/Layout.astro` | `menu` + `globals`; envuelve todas las páginas |
| Router de secciones | `src/components/PageSections.astro` | `type` → componente, en el orden de la API |
| API | `src/functions/fetch.ts` | `BASE_URL`, `mediaUrl()`, `fetchData()`, `sendData()` |
| API | `src/functions/globals.ts` | `fetchGlobals()`, `whatsappHref()` |
| API | `src/functions/blog.ts` | `fetchBlogPosts()` (paginado), `formatPublishedAt()` |
| Tipos | `src/types/globals.ts` | forma de `/globals` |

`CMS_API_URL` es la única variable de entorno: apunta a `…/api/public/traninn-logistic/` **con la barra final** (todo se concatena como sufijo). `mediaUrl()` deja pasar las URL absolutas y prefija `…/storage/` a las rutas relativas como `media/placeholder-logo.png`.

---

## Pendientes conocidos

| Pendiente | Detalle |
| --- | --- |
| Menú móvil | El `<nav>` se oculta bajo 900px y no hay alternativa desplegable |
| Rutas huérfanas | `/servicios` y `/nosotros` son restos con texto de relleno; el menú no los enlaza |
| `rich_text` vacío | Casi todas las páginas traen `<p>Contenido pendiente de redactar.</p>`: es contenido por redactar en el panel, no un bug del front |
| `<h1>` duplicado en el blog | El `body` de la entrada trae su propio `<h1>`, además del título de la página |
| `contact_info` solo en el footer | `address` y `schedule` no se pintan en `/contacto`, aunque el CMS los tiene |
