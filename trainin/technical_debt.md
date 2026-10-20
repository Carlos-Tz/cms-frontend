# Deuda técnica — trainin (sitio `traninn-logistic`)

Todo lo que hoy vive **en el front end** porque el CMS no lo soporta, o porque
el panel de administración no permite editarlo.

Cada entrada dice **qué** está en duro, **por qué**, y **qué hace falta** para
poder borrarla.

> Regla general: si un texto o una imagen que el cliente puede querer cambiar
> está en el repositorio y no en el CMS, pertenece a este archivo.

---

## 1. Bloque de tarjetas de la portada — SIN campos en el backend

**Archivo:** `src/components/OperationHighlights.astro`
**Se renderiza en:** `/`, justo después del `rich_text` (inyectado desde
`src/components/PageSections.astro`, caso `rich_text`, cuando `slug === "inicio"`).

Encabezado, cuatro tarjetas (índice, categoría, antetítulo, título, texto) e
**imágenes**: todo escrito en el componente. **Ninguno de estos campos existe
en el CMS**: no hay un tipo de sección que lleve un encabezado + tarjetas con
imagen + título + texto.

Contenido en duro hoy:

| # | Badge | Antetítulo | Título | Imagen |
| --- | --- | --- | --- | --- |
| 01 | Planeación | Optimización operativa | Eficiencia | `/cards/eficiencia.webp` |
| 02 | Sostenibilidad | Mejora continua | Operación responsable | `/cards/operacion-responsable.webp` |
| 03 | Calidad | Protocolos rigurosos | Seguridad y control | `/cards/seguridad-y-control.webp` |
| 04 | Servicio | Acompañamiento continuo | Atención y seguimiento | `/cards/atencion-y-seguimiento.webp` |

Los textos de cada tarjeta también están en el componente (los redactó el
cliente, no vienen de la API).

**Imágenes:** entregadas por el cliente en la carpeta `traninin tarjeta
inicio/` (PNG de ~2 MB c/u). Se convirtieron a WebP de 1400 px de ancho en
`public/cards/` (88–137 KB c/u). **Si se reemplaza una, hay que volver a
convertirla**; el original queda en esa carpeta como referencia.

**Qué hace falta en el backend:** un tipo de sección —por ejemplo
`image_feature_grid`— con:

| campo | tipo | nota |
| --- | --- | --- |
| `title` | string | el encabezado del bloque |
| `items[].image` | media path | la imagen de cada tarjeta |
| `items[].title` | string | título de cada tarjeta |
| `items[].text` | string | texto de cada tarjeta |
| `items[].eyebrow` | string (opcional) | el antetítulo rojo |
| `items[].badge` | string (opcional) | la etiqueta sobre la imagen |

Con eso: borrar `OperationHighlights.astro`, quitar su `case` especial de
`PageSections.astro` y renderizarlo como cualquier otra sección.

> Alternativa sin backend nuevo: el `feature_grid` que ya existe cubre
> `title` + `items[].title/text` y tiene `items[].icon` (ruta de media), que
> podría servir como imagen de la tarjeta si se acepta ese nombre de campo.
> Quedarían fuera el antetítulo y el badge.

---

## 2. Títulos de página que el panel no puede editar

**Archivo:** `src/functions/labels.ts` → `TITLE_OVERRIDES`

`pages.title` alimenta el menú, la columna del footer, el badge de las
tarjetas, el `<h1>` de la página y el `<title>` del navegador. El endpoint de
administración **solo acepta `is_published`** (`UpdatePageRequest`: *"Route,
title, position and parent belong to the blueprint"*), así que los textos
nuevos del cliente se sobrescriben aquí, por slug.

| slug | se muestra como |
| --- | --- |
| `transporte-de-gnc` | Transporte especializado de GNC |
| `carga-pesada` | Servicio dedicado de transporte |
| `logistica` | Planeación logística |
| `que-hacemos` | Filosofía empresarial |
| `proposito-empresarial` | Compromiso que nos mueve, visión que nos guía |
| `nuestra-historia` | ¿Por qué traninn? |

**Qué hace falta:** permitir editar `title` desde el panel, o actualizarlo en
`cms-backend/database/seeders/TraninnLogisticBlueprintSeeder.php` y resembrar.

---

## 3. Orden del menú

**Archivo:** `src/functions/labels.ts` → `ORDER_OVERRIDES`

El CMS ordena por `pages.position`, que tampoco es editable desde el panel.
El cliente pidió otro orden para los servicios:

```
nuestros-servicios → transporte-de-gnc, carga-pesada, logistica
```

**Qué hace falta:** `position` editable, o cambiarlo en el seeder.

---

## 4. Secciones ocultas desde el front

**Archivo:** `src/components/PageSections.astro` → `HIDDEN` y `HIDDEN_ON_PAGE`

El CMS las sigue sirviendo; el sitio decide no pintarlas.

| sección | alcance |
| --- | --- |
| `savings_simulator` | todo el sitio |
| `clients_showcase` | todo el sitio (temporal) |
| `feature_grid` | solo en `transporte-de-gnc` y `carga-pesada` |

**Qué hace falta:** poder despublicar una **sección** desde el panel (hoy solo
se puede despublicar una página completa).

---

## 5. `page_hero.subtitle` no se muestra

**Archivos:** `src/components/PageHero.astro`, `src/components/PageSections.astro`

Por decisión de diseño el banner de página muestra **solo el título**. El CMS
sigue sirviendo `subtitle` y el panel lo deja editar, pero no se pinta. Las
tarjetas de `ChildPageCards` sí lo siguen usando como encabezado.

**Qué hace falta:** nada técnico — es una decisión. Revertir = volver a pasar
y renderizar el campo.

---

## 6. Entrada "Blog" en el menú

**Archivo:** `src/components/Header.astro`

`GET /menu` se deriva del árbol de páginas y el blog no es una página del
blueprint, así que la entrada se agrega en duro junto a las del CMS.

**Qué hace falta:** que el blog aparezca en el menú, o un campo de enlaces
extra para la navegación.

---

## 7. Encabezados de las tarjetas de sub-páginas

**Archivos:** `src/pages/nuestros-servicios/index.astro`,
`src/pages/sobre-nosotros/index.astro`

El bloque `ChildPageCards` recibe su encabezado como prop en duro:
`"Nuestros servicios"` y `"Conoce Traninn Logistic"` (el default del
componente es `"Explora esta sección"`). Las tarjetas en sí sí vienen del CMS.

**Qué hace falta:** un campo para ese encabezado, o un tipo de sección propio
para "sub-páginas de esta página".

---

## 8. Blog: título, imagen de portada y textos de interfaz

**Archivos:** `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`

El listado **no tiene una página en el CMS**, así que todo su encabezado está
en duro:

| qué | valor | dónde |
| --- | --- | --- |
| Título | `"Blog"` | `<title>` y `page_hero` |
| Imagen del banner | `/blog-hero.webp` | `page_hero` del listado |
| Textos de interfaz | `"Leer más"`, `"Aún no hay entradas publicadas."`, `"Volver al blog"` | tarjetas y entrada |

**Imagen:** entregada por el cliente como `ChatGPT Image 25 sept 2026,
12_36_52.png` (2048×768, 1.9 MB). Se convirtió a WebP de 1920 px en
`public/blog-hero.webp` (111 KB); el original queda en la raíz del repo como
referencia. **Si se reemplaza, hay que volver a convertirla.**

**Qué hace falta:** una página `blog` en el blueprint con su `page_hero`
—`title` + `image` saldrían del CMS como en cualquier otra página, y
landing-gnu ya lo resuelve así (`getPage("blog")`). Los textos de interfaz
("Leer más", etc.) son de UI y pueden quedarse en el código.

---

## 9. Etiquetas del formulario de contacto

**Archivo:** `src/components/Contacto.astro` → `contactFieldMeta`

El CMS manda `fields: ["name","email","phone","message"]` —solo las claves—,
así que las etiquetas y los *placeholders* visibles (`Nombre`, `Correo
electrónico`, `Tu nombre`, `Cuéntanos brevemente qué necesitas`…) viven en el
front. Un campo que no esté en ese diccionario se renderiza con la clave
capitalizada.

**Qué hace falta:** que `lead_capture_form` sirva `label` y `placeholder` por
campo. Nota: `fields[]` está deliberadamente bloqueado en el panel porque cada
clave corresponde a una columna de `leads`.

---

## 10. Iconografía deducida del texto

**Archivos:** `src/components/FeatureGrid.astro`, `src/components/ChildPageCards.astro`

Cuando el CMS no manda imagen, el icono (Font Awesome) se elige con una tabla
de palabras clave sobre el título/slug: `ruta` → `fa-route`, `gnc|gas` →
`fa-gas-pump`, etc. Funciona, pero el contenido decide el icono por accidente.

**Qué hace falta:** un campo de icono real (o que `items[].icon` se use
siempre como imagen; ver el punto 1).

---

## 11. Secciones del CMS que el front no sabe pintar

**Archivo:** `src/components/PageSections.astro` → `default: return null`

El backend declara 17 tipos de sección; este sitio renderiza 9. Si alguien
agrega en el panel `trust_strip`, `stats_band`, `image_text`, `testimonials` o
`service_scheduling` a una página de `traninn-logistic`, **se guarda bien y no
se ve nada**, sin aviso.

**Qué hace falta:** componerlos (los tres primeros ya existen en landing-gnu)
o aceptar explícitamente que no aplican a este sitio.

---

## 12. Mapa de Google sin API key

**Archivo:** `src/components/StationsMap.astro`

El mapa usa `https://maps.google.com/maps?q=lat,lng&output=embed`, una forma
**sin llave y no documentada**. La vía oficial (Maps Embed API) requiere API
key y facturación.

Consecuencias: Google podría cambiarla sin aviso, y el *embed* muestra **un
solo lugar a la vez** (con varias estaciones, el nombre de cada una cambia el
mapa; no hay varios pines simultáneos).

**Qué hace falta:** una API key. Con ella:
`https://www.google.com/maps/embed/v1/place?key=…&q=lat,lng`.

---

## 13. Logos y artefactos generados

**Archivos:** `public/logo*.png`, `src/components/Logo.astro`

| archivo | origen |
| --- | --- |
| `logo-lockup.png` | entregado (`Recurso 1-8 2.png`) |
| `logo-lockup-dark-bg.png` | entregado (`Recurso 1-8 1 (2).png`) |
| `logo.png` | entregado (`IMG_7638.PNG`) — monograma TL, también el favicon |
| `logo-white.png` | **generado** desde `logo.png` (tinta casi negra → blanco) |
| `cursor.png`, `cursor-pointer.png` | **generados** desde `PUNTERO traninn.png` (redimensionados a 28 y 40 px) |

**Qué hace falta:** nada del CMS. Solo recordar que los **generados** hay que
regenerarlos si cambia su origen, o los dos se desincronizan.

---

## 14. Contenido pendiente en el CMS (no es deuda de código)

- `proposito-empresarial` → cuatro captions de la galería tienen la última
  letra duplicada: `Innovaciónn`, `Servicioo`, `Responsabilidadd`,
  `Trabajo en equipoo`. Se muestran como título de la tarjeta.
- `nuestra-historia` → `image_gallery` sin imágenes y sin título.
- `carga-pesada` → `page_hero.image` vacío: la tarjeta usa un panel de marca.
- Estaciones: las coordenadas que sirve `GET /stations`
  (`19.692421695287,-101.23997368974`) no coinciden con las que indicó el
  cliente (`19.705476258951,-101.24344534471`) — ~1.5 km de diferencia. Se
  editan desde el panel (`PUT /api/admin/stations/{id}`).
