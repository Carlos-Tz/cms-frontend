# Deuda técnica — tectuus (sitio `tectuus`)

Todo lo que hoy vive **en el front end** porque el CMS no lo soporta, o porque
el panel de administración no permite editarlo.

Cada entrada dice **qué** está en duro, **por qué**, y **qué hace falta** para
poder borrarla.

> Regla general: si un texto o una imagen que el cliente puede querer cambiar
> está en el repositorio y no en el CMS, pertenece a este archivo.

---

## 1. Ilustración del panel de contacto

**Archivo:** `src/components/ContactPanel.astro`
**Imagen:** `public/contact-illustration.png`
**Se renderiza en:** junto a cada formulario de contacto — `/contacto`, la
sección de cotización de `/productos/[slug]` y cualquier `lead_capture_form`
que se agregue desde el panel (`src/components/SectionRenderer.astro`).

La ilustración (persona con audífonos frente a una laptop) está en duro en el
componente. El tipo de sección `lead_capture_form` **no tiene campo de
imagen**, y el panel de contacto es un bloque del front que el CMS no conoce.

**Imagen:** entregada por el cliente como `image-removebg-preview.png`
(650×384, PNG con fondo transparente, 239 KB). Se copió tal cual a
`public/contact-illustration.png`; el original queda en la raíz del repo como
referencia. Una versión anterior con fondo blanco (`image.png`) ya no se usa.

Como es un recorte con fondo transparente, se pinta **sin tarjeta detrás**,
directo sobre el fondo de la sección (claro en `/contacto`, azul tinta en
productos). **Si se reemplaza por una imagen con fondo sólido**, habrá que
devolverle el marco en `.contact-panel__art` (`src/styles/global.css`).

**Qué hace falta en el backend:** un campo de imagen para el bloque de
contacto, por ejemplo:

| campo | tipo | nota |
| --- | --- | --- |
| `lead_capture_form.image` | media path (opcional) | ilustración junto al formulario de esa sección |
| `globals.contact_info.image` | media path (opcional) | alternativa: una sola imagen para todo el sitio, editable en *Datos de contacto* |

Con cualquiera de los dos: leer la imagen en `ContactPanel.astro` (con
`mediaUrl`) y dejar `/contact-illustration.png` solo como respaldo si el campo
viene vacío.

---

## 2. Secciones ocultas desde el front

**Archivo:** `src/components/SectionRenderer.astro` → `HIDDEN_ON_PAGE`

El CMS las sigue sirviendo; el sitio decide no pintarlas.

| sección | página | motivo |
| --- | --- | --- |
| `image_gallery` ("Nuestra experiencia") | `sobre-nosotros` | temporal: las tres imágenes son la misma foto y los pies son de relleno (`Descripción de la imágen`, `DEscripción de la imágen 2`…) |

Para volver a mostrarla basta con borrar su entrada de `HIDDEN_ON_PAGE`.

**Qué hace falta:** poder despublicar una **sección** desde el panel (hoy solo
se puede despublicar una página completa). Mientras tanto, cargar las fotos y
los pies reales en el CMS y quitar la entrada.

---

## 3. Bloque "Ingeniería que transforma necesidades en soluciones" (portada)

**Archivo:** `src/components/EngineeringHighlight.astro`
**Imagen:** `public/home/ingenieria-soluciones.jpg`
**Se renderiza en:** `/`, justo después del primer `rich_text` (slot
`after-rich_text` de `src/components/SectionRenderer.astro`, pasado desde
`src/pages/index.astro`).

Imagen, título, tres párrafos y el remate en cursiva (*"Ingeniería y control
que impulsan cada proyecto."*): todo escrito en el componente, a pedido del
cliente. Ningún tipo de sección del CMS lleva **imagen + título + texto**.

**Imagen:** entregada como `Ingeniería que transforma necesidades en
soluciones.png` (2048×768, 2.1 MB). Se convirtió a JPEG de 1600 px en
`public/home/ingenieria-soluciones.jpg` (136 KB); el original queda en la raíz
del repo. **Si se reemplaza, hay que volver a convertirla.**

**Qué hace falta en el backend:** un campo de imagen en `rich_text`, por
ejemplo:

| campo | tipo | nota |
| --- | --- | --- |
| `rich_text.image` | media path (opcional) | imagen arriba del título |

Con eso: crear este bloque como un segundo `rich_text` en la página `inicio`,
borrar `EngineeringHighlight.astro` y quitar el slot de `index.astro`.

---

## 4. Segunda imagen junto al texto de "Sobre nosotros"

**Archivo:** `src/components/SectionRenderer.astro` → `EXTRA_RICH_TEXT_IMAGES`
**Imagen:** `public/about/nuestra-experiencia.jpg`
**Se renderiza en:** `/sobre-nosotros`, en la columna derecha del primer
`rich_text`, debajo de su imagen de portada (`image_video_url`, que sí viene
del CMS). Ambas imágenes acompañan al texto mientras se hace scroll.

El `rich_text` del CMS admite **una sola** imagen (`image_video_url`); esta
segunda imagen se agrega desde el front, con su texto alternativo, por slug de
página.

**Imagen:** entregada como `Nuestra experiencia.png` (2048×768, 2.1 MB). Se
convirtió a JPEG de 1600 px en `public/about/nuestra-experiencia.jpg` (140 KB);
el original queda en la raíz del repo. **Si se reemplaza, hay que volver a
convertirla.**

**Qué hace falta en el backend:** que `rich_text` acepte varias imágenes, por
ejemplo:

| campo | tipo | nota |
| --- | --- | --- |
| `rich_text.images[].image` | media path | cada imagen de la columna lateral |
| `rich_text.images[].alt` | string (opcional) | texto alternativo |

Con eso: leer `images[]` en `RichText.astro` y borrar
`EXTRA_RICH_TEXT_IMAGES` de `SectionRenderer.astro`.
