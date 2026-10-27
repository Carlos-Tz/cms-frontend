# GNU CMS — Lineamientos de diseño

Lenguaje de diseño que usa el panel de administración de GNU CMS (`gnu-cms-admin`), para que lo sigan los proyectos de páginas que administra — Página web GNU, Gas natural vehicular, Trainnin Logistic, Tectuus — y así el admin y los sitios publicados se sientan como un solo producto.

El admin está hecho con React + Tailwind CSS v4. Los proyectos de páginas están hechos con **Astro** y CSS plano (sin Tailwind), así que todo lo de abajo se da como **custom properties de CSS y recetas de clases en CSS puro** que puedes poner en una hoja de estilos global o en un `<Layout>` compartido — más el equivalente en utilidades de Tailwind entre paréntesis, como referencia cruzada.

## 1. Tokens

Agrega esto a una hoja de estilos global (p. ej. `src/styles/tokens.css`, importada una sola vez desde tu `Layout.astro` base):

```css
:root {
  /* Fondo */
  --color-bg: #0b0611;

  /* Marca */
  --color-primary: #863bff;
  --color-primary-alt: #7e14ff;
  --color-accent: #47bfff;
  --color-primary-tint: #c9a3ff; /* etiquetas eyebrow, acentos pequeños sobre fondo oscuro */
  --color-primary-soft: #ede6ff; /* tinte de marca sobre fondos claros */

  /* Estado */
  --color-status-active: #34d399; /* emerald-400 */
  --color-status-pending: #fbbf24; /* amber-400 */
  --color-status-draft: rgba(255, 255, 255, 0.4);
  --color-status-error: #fb7185; /* rose-400 */

  /* Texto sobre fondos oscuros */
  --color-text: #ffffff;
  --color-text-60: rgba(255, 255, 255, 0.6);
  --color-text-40: rgba(255, 255, 255, 0.4);

  /* Bordes / superficies sobre fondos oscuros */
  --color-border: rgba(255, 255, 255, 0.15);
  --color-border-hover: rgba(255, 255, 255, 0.3);
  --color-surface: rgba(255, 255, 255, 0.05);

  /* Radio y sombra */
  --radius-lg: 1rem; /* rounded-2xl */
  --radius-md: 0.5rem; /* rounded-lg */
  --radius-full: 999px;
  --shadow-cta: 0 10px 30px -5px rgba(134, 59, 255, 0.3);
}
```

Degradado de marca: `linear-gradient(to right, var(--color-primary), var(--color-accent))` (Tailwind: `bg-gradient-to-r from-[#863bff] to-[#47bfff]`).

## 2. Tipografía

- Fuente del cuerpo: stack de system UI (por ahora no se usa ninguna webfont personalizada) — `font-family: system-ui, -apple-system, "Segoe UI", sans-serif;`
- Títulos: en negritas, con tracking cerrado. `font-weight: 700; letter-spacing: -0.01em;`
- Los tamaños siguen más o menos esto: hero `2.25–3rem`, título de sección `1.5rem`, título de tarjeta `1rem`, cuerpo `0.875–1rem`, texto de ayuda/meta `0.75rem`.
- Las frases de énfasis dentro de un título usan el degradado de marca como relleno del texto:

```css
.gradient-text {
  background: linear-gradient(to right, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## 3. Componentes

### Botón CTA principal

```css
.btn-primary {
  border-radius: var(--radius-full);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  background: linear-gradient(to right, var(--color-primary), var(--color-accent));
  box-shadow: var(--shadow-cta);
  transition: filter 0.15s ease;
}
.btn-primary:hover {
  filter: brightness(1.1);
}
```

(Tailwind: `rounded-full bg-gradient-to-r from-[#863bff] to-[#47bfff] px-6 py-3 text-sm font-semibold shadow-lg shadow-[#863bff]/30 hover:brightness-110`)

### Botón secundario / de navegación

```css
.btn-secondary {
  border-radius: var(--radius-full);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-60);
  border: 1px solid var(--color-border);
  transition: color 0.15s ease, border-color 0.15s ease;
}
.btn-secondary:hover {
  color: var(--color-text);
  border-color: var(--color-border-hover);
}
```

### Botón de peligro / destructivo

Misma forma que el secundario, pero con tono rose:

```css
.btn-danger {
  border-radius: var(--radius-full);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-status-error);
  border: 1px solid rgba(251, 113, 133, 0.4);
}
.btn-danger:hover {
  border-color: rgba(251, 113, 133, 0.7);
}
```

### Tarjeta / panel (superficie "glass")

Se usa en tarjetas de características, tarjetas del dashboard y secciones de formularios.

```css
.card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(6px);
  padding: 1.25rem 1.5rem;
}
```

Una tarjeta estilo dashboard agrega un título, un subtítulo, un punto de estado + etiqueta y un botón circular con ícono:

```html
<div class="card card--item">
  <div class="card__head">
    <div>
      <h3 class="card__title">Página web GNU</h3>
      <p class="card__subtitle">Updated 2 hours ago</p>
    </div>
    <button class="card__action" aria-label="Open">→</button>
  </div>
  <div class="card__status">
    <span class="status-dot status-dot--active"></span>
    <span class="status-label status-label--active">active</span>
  </div>
</div>
```

```css
.card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.card__title { font-size: 1rem; font-weight: 600; color: var(--color-text); }
.card__subtitle { margin-top: 0.25rem; font-size: 0.875rem; color: var(--color-text-60); }
.card__action {
  width: 2rem; height: 2rem; border-radius: var(--radius-full);
  border: 1px solid var(--color-border); color: var(--color-text-60);
  display: flex; align-items: center; justify-content: center;
}
.card__action:hover { border-color: var(--color-border-hover); color: var(--color-text); }
.card__status { margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.status-dot { width: 0.5rem; height: 0.5rem; border-radius: var(--radius-full); }
.status-dot--active { background: var(--color-status-active); }
.status-dot--pending { background: var(--color-status-pending); }
.status-dot--draft { background: var(--color-status-draft); }
.status-dot--error { background: var(--color-status-error); }
.status-label { font-size: 0.75rem; font-weight: 500; text-transform: capitalize; }
.status-label--active { color: #6ee7b7; }
.status-label--pending { color: #fcd34d; }
.status-label--draft { color: var(--color-text-40); }
.status-label--error { color: #fda4af; }
```

Los colores de estado son **semánticos**, no colores de marca — reutiliza exactamente este conjunto de 4 estados (`active` / `pending` / `draft` / `error`) para cualquier indicador de estado de contenido en lugar de inventar nuevos.

### Campos de formulario

```css
.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-60);
}
.field input,
.field select,
.field textarea {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text);
}
.field input::placeholder,
.field textarea::placeholder {
  color: var(--color-text-40);
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
.field .hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-40);
}
```

Los campos agrupados van dentro de una `.card` que funciona como `<fieldset>`, con un legend en versalitas y con tinte de marca:

```css
.field-group legend {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary-tint);
}
```

### Etiqueta pill / eyebrow

Etiqueta pequeña que va arriba de los títulos (p. ej. "Open source CMS"):

```css
.eyebrow {
  display: inline-block;
  border-radius: var(--radius-full);
  border: 1px solid rgba(134, 59, 255, 0.4);
  background: rgba(134, 59, 255, 0.1);
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary-tint);
}
```

## 4. Layout

- Contenedor de página: `max-width: 72rem` (`max-w-6xl`), centrado, `padding: 0 1.5rem`.
- Ritmo entre secciones: espaciado vertical generoso entre secciones (`4–6rem` entre secciones principales, `1.5–2rem` entre campos/tarjetas dentro de una misma sección).
- Grids: las filas de características/tarjetas usan `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` (o breakpoints fijos de 2/3/4 columnas) con `gap: 1.5rem`.
- Secciones hero: dos columnas en escritorio (texto a la izquierda, ilustración a la derecha), una sola columna apilada en móvil.

## 5. Recursos

- Reutiliza la marca de GNU CMS (`public/favicon.svg` en el repo del admin) como ícono de logo compartido en los encabezados.
- Mantén el degradado violeta/azul de la marca como la única firma visual recurrente (botones, énfasis en títulos, anillos de foco) — no introduzcas colores de acento adicionales fuera del conjunto de estados de arriba.

## 6. Cómo usar esto en un proyecto Astro

- Pon los tokens de `:root` en una hoja de estilos global importada una sola vez desde tu layout base, para que cualquier página o componente pueda usar `var(--color-*)`.
- Prefiere las recetas de clases de arriba (`.btn-primary`, `.card`, `.field`, etc.) en lugar de estilos inline improvisados, para que un cambio en un token se propague a todos lados.
- Hoy estas páginas tienden a un tema claro con acento verde (ver el formulario del admin anterior en `sample.astro`) — pasar a este sistema oscuro violeta/azul es un rebranding intencional para empatar con el admin del CMS, no un ajuste incremental.
