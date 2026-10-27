# Clases para el contenido del CMS (`rich_text`)

Guía para quien escribe el HTML que va en el campo **body** de una sección
`rich_text` del administrador.

El cuerpo se inserta tal cual en la página, dentro de un contenedor con la
clase `.prose`. Eso significa dos cosas:

1. **Las etiquetas normales ya vienen con estilo.** No hace falta clase alguna
   para `<p>`, `<h2>`–`<h4>`, `<ul>`, `<ol>`, `<table>`, `<blockquote>`,
   `<img>`, `<figure>`/`<figcaption>`, `<hr>`, `<strong>` o `<a>`.
2. **Solo funcionan las clases que el sitio ya conoce.** Una clase inventada
   no rompe nada, pero tampoco hace nada: el navegador no encuentra reglas
   para ella y el bloque se ve como texto normal.

Lo que sigue es la lista completa de clases que sí hacen algo.

---

## Diseño en dos columnas

### `rich_row` + `rich_column`

Convierte su contenido en una rejilla de dos columnas. En pantallas de menos
de 640 px las columnas se apilan solas.

```html
<div class="rich_row">
  <div class="rich_column">
    <h3>Primera columna</h3>
    <p>…</p>
  </div>
  <div class="rich_column">
    <h3>Segunda columna</h3>
    <p>…</p>
  </div>
</div>
```

Detalles útiles:

- La sección que contiene un `rich_row` **se ensancha sola** a 64rem
  (`.rich-text:has(.rich_row)`), porque el ancho de lectura de una sola
  columna queda chico para dos.
- El primer elemento de cada `rich_column` pierde su margen superior, para que
  ambas columnas arranquen a la misma altura.
- Son `<div>` a propósito: el editor del panel no permite insertar markup
  semántico, así que esta convención existe para que ese HTML plano se vea
  como dos columnas de verdad.

### `rich_block`

Se pone en **un párrafo dentro de cada `rich_column`** y hace que todos los
párrafos marcados así dentro del mismo `rich_row` midan lo mismo de alto.

```html
<div class="rich_row">
  <div class="rich_column">
    <h3>Estación A</h3>
    <p class="rich_block">Descripción larga…</p>
    <h4>Dirección</h4>
    <address>…</address>
  </div>
  <div class="rich_column">
    <h3>Estación B</h3>
    <p class="rich_block">Descripción más corta.</p>
    <h4>Dirección</h4>
    <address>…</address>
  </div>
</div>
```

**Para qué sirve:** sin él, si una descripción es más larga que la otra, todo
lo que va debajo (dirección, horario, botón) queda desalineado entre columnas.
Con `rich_block` los dos párrafos se igualan al más alto y lo de abajo vuelve a
coincidir.

**Cómo funciona por dentro:** cada párrafo vive en una rama distinta del DOM
(dentro de su propia `rich_column`), así que ni grid ni flex pueden igualarlos
—solo igualan hijos directos—. Un script en `RichText.astro` los mide y les
aplica la misma `min-height`, y lo repite al cambiar el tamaño de la ventana.

> Necesita **al menos dos** `rich_block` en el mismo `rich_row`; con uno solo
> no hace nada.

---

## Botones

### `btn-primary` / `btn-secondary`

Convierten un enlace en botón, con los mismos estilos que el resto del sitio.

```html
<p>
  <a class="btn-primary"
     href="https://www.google.com/maps/dir/?api=1&amp;destination=19.7048,-101.2440">
    Cómo llegar →
  </a>
</p>
```

Dentro de `.prose` se les quita el subrayado y el color de enlace que tendría
un `<a>` normal, así que se ven como botones y no como texto enlazado.

---

## Línea de tiempo

### `prose-timeline`

Dibuja una línea vertical con un punto por cada `<h3>`. Útil para historia,
etapas o procesos.

```html
<div class="prose-timeline">
  <h3>2015</h3>
  <p>…</p>
  <h3>2019</h3>
  <p>…</p>
</div>
```

Los `<h3>` que estén **directamente** dentro del contenedor reciben el punto.

---

## Errores comunes

| Problema | Qué pasa | Cómo se escribe |
| --- | --- | --- |
| `</br>` | No existe; el navegador la ignora o la trata como `<br>` suelta | `<br>` (o mejor, un `<p>` aparte) |
| `&` suelto en una URL | Puede cortar el enlace | `&amp;` — p. ej. `?api=1&amp;destination=…` |
| Espaciado con `<br>` entre bloques | Frágil | Deja que el espaciado lo ponga el CSS; `.prose` ya separa los elementos |
| Clase inventada (`mi_caja`) | No hace nada | Usa una de esta lista, o pide que se agregue |
| `rich_block` en una sola columna | No hace nada | Necesita dos o más dentro del mismo `rich_row` |
| Encabezados saltados (`<h2>` → `<h4>`) | Mala accesibilidad | Baja un nivel a la vez |

---

## Antes de que existan estas clases: el texto pegado desde PDF

El contenido pegado desde un PDF suele llegar como **un solo `<p>`** con un
salto de línea cada ~85 caracteres y los subtítulos como líneas sueltas. Antes
de pintarlo, `src/lib/richText.ts` lo reconstruye: vuelve a armar los párrafos,
convierte esas líneas cortas en `<h3>` y arma listas numeradas de verdad.

Si escribes HTML bien formado (como el de esta guía), esa limpieza no te toca
nada. Solo actúa sobre el texto plano pegado.

---

## Nota sobre los otros sitios

Estas clases son de **gas-gnu**. Los demás sitios del CMS tienen su propio
juego y no coinciden:

- **trainin** soporta `card` + `tittle` (tarjetas dentro del cuerpo) y
  `btn-primary`, pero **no** `rich_row`, `rich_column`, `rich_block` ni
  `prose-timeline`.

Si copias contenido de un sitio a otro, revisa que las clases existan del otro
lado o el bloque se verá como texto plano.
