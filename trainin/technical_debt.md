# Deuda técnica — trainin (sitio `traninn-logistic`)

Cosas que hoy viven en el front end porque el backend todavía no las soporta.
Cada entrada dice **qué** está en duro, **por qué**, y **qué hace falta** para
poder borrarla.

---

## 1. Bloque de tarjetas de la portada — SIN campos en el backend

**Archivo:** `src/components/OperationHighlights.astro`
**Se renderiza en:** `/` justo después del `rich_text` (inyectado desde
`src/components/PageSections.astro`, caso `rich_text`, cuando `slug === "inicio"`).

El contenido completo está escrito en el componente. **Ninguno de estos campos
existe en el CMS**: no hay un tipo de sección que lleve un encabezado + un
conjunto de tarjetas (título + texto) + una imagen.

Contenido en duro hoy:

```html
<h1>Detrás de cada entrega, hay una operación bien coordinada.</h1>

<div class="card">
  <div class="tittle">Eficiencia</div>
  <p>Planeamos y coordinamos cada servicio buscando aprovechar de manera eficiente
     los recursos disponibles, optimizar recorridos y mantener una operación competitiva.</p>
</div>

<div class="card">
  <div class="tittle">Operación responsable:</div>
  <p>Buscamos mejorar continuamente nuestros procesos, el aprovechamiento de recursos
     y la gestión de nuestras unidades</p>
</div>

<div class="card">
  <div class="tittle">Seguridad y control:</div>
  <p>Trabajamos bajo procesos definidos de planeación, inspección, seguimiento y entrega
     para mantener el control de cada servicio.</p>
</div>

<div class="card">
  <div class="tittle">Atención y seguimiento:</div>
  <p>Acompañamos cada operación con comunicación y seguimiento de acuerdo con las
     necesidades del servicio.</p>
</div>
```

**Imágenes:** cada tarjeta lleva `public/image.png`, un *placeholder* gris
(1200×800). El mismo archivo en las cuatro, a propósito: así se lee como
relleno y no como cuatro fotos elegidas. No es arte definitivo.

**Qué hace falta en el backend:** un tipo de sección —por ejemplo
`image_feature_grid`— con:

| campo | tipo | nota |
| --- | --- | --- |
| `title` | string | el encabezado del bloque |
| `items[].image` | media path | la imagen de cada tarjeta |
| `items[].title` | string | título de cada tarjeta |
| `items[].text` | string | texto de cada tarjeta |

Con eso: borrar `OperationHighlights.astro`, quitar su `case` especial de
`PageSections.astro` y renderizarlo como cualquier otra sección.

> Alternativa sin backend nuevo: el `feature_grid` que ya existe cubre
> `title` + `items[].title/text` y tiene `items[].icon` (ruta de media), que
> podría servir como imagen de la tarjeta si se acepta ese nombre de campo.

---

## 2. Títulos de página que el panel no puede editar

**Archivo:** `src/functions/labels.ts` → `TITLE_OVERRIDES`

`pages.title` alimenta el menú, la columna del footer, el badge de las
tarjetas, el `<h1>` de la página y el `<title>` del navegador. El endpoint de
administración **solo acepta `is_published`** (`UpdatePageRequest`: *"Route,
title, position and parent belong to the blueprint"*), así que los textos
nuevos del cliente se sobrescriben aquí, por slug.

Vigentes hoy: `que-hacemos`, `proposito-empresarial`, `nuestra-historia`,
`carga-pesada`, `logistica`, `transporte-de-gnc`.

**Qué hace falta:** permitir editar `title` desde el panel, o actualizarlo en
`cms-backend/database/seeders/TraninnLogisticBlueprintSeeder.php` y resembrar.
Cada entrada se borra en cuanto el CMS entregue el texto correcto.

---

## 3. Orden del menú

**Archivo:** `src/functions/labels.ts` → `ORDER_OVERRIDES`

El CMS ordena por `pages.position`, que tampoco es editable desde el panel. El
cliente pidió otro orden para los servicios, así que se reordena en el front:

```
nuestros-servicios → transporte-de-gnc, carga-pesada, logistica
```

**Qué hace falta:** lo mismo que el punto 2 — `position` editable, o cambiarlo
en el seeder.

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

## 5. Entrada "Blog" en el menú

**Archivo:** `src/components/Header.astro`

`GET /menu` se deriva del árbol de páginas y el blog no es una página del
blueprint, así que la entrada se agrega en duro junto a las del CMS.

**Qué hace falta:** que el blog aparezca en el menú, o un campo de enlaces
extra para la navegación.

---

## 6. Logo en versión *knockout*

**Archivos:** `public/logo.png`, `public/logo-white.png`

`logo-white.png` está **generado** a partir de `logo.png` (se pasa a blanco la
tinta casi negra y se conserva el rojo) para que el monograma se vea sobre el
footer oscuro. Si se reemplaza `logo.png`, hay que regenerarlo o los dos se
desincronizan.

---

## 7. Contenido pendiente en el CMS (no es deuda de código)

- `proposito-empresarial` → `page_hero.subtitle` vacío.
- `nuestra-historia` → subtítulo con el texto de relleno "Subtitulo".
- `carga-pesada` → `page_hero.image` vacío: la tarjeta usa un panel de marca.
- `proposito-empresarial` → la galería apunta a `media/placeholder-foto-1.jpg`
  y `-2.jpg`, que responden **404**.
