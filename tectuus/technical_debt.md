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
