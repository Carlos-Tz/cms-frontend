# Campos nuevos que necesita el CMS

Campos que el frontend ya está preparado para renderizar, pero que todavía no
existen en el CMS/panel. Cada entrada indica: el tipo de sección, el campo, su
forma y dónde se usa.

---

## `feature_grid.image`

Una imagen de banner 16:9 opcional arriba del título de la sección, que se renderiza
encima de la cuadrícula de tarjetas con ícono que ya existe (`feature_grid.items`).
Tamaño de referencia: **1024 x 576px** (16:9), la misma convención que `page_hero.image`.

```json
{
  "type": "feature_grid",
  "content": {
    "title": "Características",
    "image": "media/some-banner.jpg",
    "items": [
      { "icon": "media/icon.png", "title": "Profesionalismo", "text": "..." }
    ]
  }
}
```

| Campo   | Tipo             | Requerido | Notas                                   |
| ------- | ---------------- | -------- | ---------------------------------------- |
| `image` | string (ruta de medio) o null | No | 1024x576px (16:9). Si se omite, la sección se renderiza sin banner — totalmente compatible con las secciones `feature_grid` existentes (p. ej. `/sobre-nosotros/valores`). |

Frontend: `src/components/sections/FeatureGrid.astro` ya lee
`Astro.props.image` y la renderiza con `mediaUrl()` — no hay nada más que
cambiar una vez que el panel exponga el campo y una página lo defina.
