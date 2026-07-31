# GNU CMS — Design Guidelines

Design language used by the GNU CMS Admin panel (`gnu-cms-admin`), for the page projects it manages — Página web GNU, Gas natural vehicular, Trainnin Logistic, Tectuus — to follow so the admin and the published sites feel like one product.

The admin is built with React + Tailwind CSS v4. The page projects are built with **Astro** and plain CSS (no Tailwind), so everything below is given as **CSS custom properties and vanilla class recipes** you can drop into a global stylesheet or a shared `<Layout>` — plus the Tailwind utility equivalent in parentheses, for cross-reference.

## 1. Tokens

Add these to a global stylesheet (e.g. `src/styles/tokens.css`, imported once from your base `Layout.astro`):

```css
:root {
  /* Background */
  --color-bg: #0b0611;

  /* Brand */
  --color-primary: #863bff;
  --color-primary-alt: #7e14ff;
  --color-accent: #47bfff;
  --color-primary-tint: #c9a3ff; /* eyebrow labels, small accents on dark bg */
  --color-primary-soft: #ede6ff; /* brand tint on light backgrounds */

  /* Status */
  --color-status-active: #34d399; /* emerald-400 */
  --color-status-pending: #fbbf24; /* amber-400 */
  --color-status-draft: rgba(255, 255, 255, 0.4);
  --color-status-error: #fb7185; /* rose-400 */

  /* Text on dark backgrounds */
  --color-text: #ffffff;
  --color-text-60: rgba(255, 255, 255, 0.6);
  --color-text-40: rgba(255, 255, 255, 0.4);

  /* Borders / surfaces on dark backgrounds */
  --color-border: rgba(255, 255, 255, 0.15);
  --color-border-hover: rgba(255, 255, 255, 0.3);
  --color-surface: rgba(255, 255, 255, 0.05);

  /* Radius & shadow */
  --radius-lg: 1rem; /* rounded-2xl */
  --radius-md: 0.5rem; /* rounded-lg */
  --radius-full: 999px;
  --shadow-cta: 0 10px 30px -5px rgba(134, 59, 255, 0.3);
}
```

Brand gradient: `linear-gradient(to right, var(--color-primary), var(--color-accent))` (Tailwind: `bg-gradient-to-r from-[#863bff] to-[#47bfff]`).

## 2. Typography

- Body font: system UI stack (no custom webfont currently in use) — `font-family: system-ui, -apple-system, "Segoe UI", sans-serif;`
- Headlines: bold, tight tracking. `font-weight: 700; letter-spacing: -0.01em;`
- Sizes roughly follow: hero `2.25–3rem`, section heading `1.5rem`, card title `1rem`, body `0.875–1rem`, hint/meta text `0.75rem`.
- Emphasis phrases inside a headline use the brand gradient as text fill:

```css
.gradient-text {
  background: linear-gradient(to right, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## 3. Components

### Primary CTA button

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

### Secondary / nav button

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

### Danger / destructive button

Same shape as secondary, but rose-tinted:

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

### Card / panel ("glass" surface)

Used for feature cards, dashboard cards, form sections.

```css
.card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  backdrop-filter: blur(6px);
  padding: 1.25rem 1.5rem;
}
```

A dashboard-style card adds a title, subtitle, a status dot + label, and a circular icon button:

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

Status colors are **semantic**, not brand colors — reuse this exact 4-state set (`active` / `pending` / `draft` / `error`) for any content-state indicator instead of inventing new ones.

### Form fields

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

Grouped fields sit inside a `.card` acting as a `<fieldset>`, with a small-caps brand-tinted legend:

```css
.field-group legend {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-primary-tint);
}
```

### Pill / eyebrow label

Small tag used above headlines (e.g. "Open source CMS"):

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

- Page container: `max-width: 72rem` (`max-w-6xl`), centered, `padding: 0 1.5rem`.
- Section rhythm: generous vertical spacing between sections (`4–6rem` between major sections, `1.5–2rem` between fields/cards within one).
- Grids: feature/card rows use `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` (or fixed 2/3/4-column breakpoints) with `gap: 1.5rem`.
- Hero sections: two-column on desktop (copy left, illustration right), single column stacked on mobile.

## 5. Assets

- Reuse the GNU CMS mark (`public/favicon.svg` in the admin repo) as the shared logo icon in headers.
- Keep the violet/blue brand gradient as the one recurring visual signature (buttons, headline emphasis, focus rings) — don't introduce additional accent colors outside the status set above.

## 6. Using this in an Astro project

- Put the `:root` tokens in a global stylesheet imported once from your base layout, so every page and component can reference `var(--color-*)`.
- Prefer the class recipes above (`.btn-primary`, `.card`, `.field`, etc.) over ad hoc inline styles, so a change to a token cascades everywhere.
- These pages currently skew light-themed with a green accent (see the legacy admin form in `sample.astro`) — moving to this dark violet/blue system is an intentional rebrand to match the CMS admin, not an incremental tweak.
