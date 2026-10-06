# New CMS fields needed

Fields the frontend is already built to render, but that don't exist in the
CMS/admin yet. Each entry: the section type, the field, its shape, and where
it's used.

---

## `feature_grid.image`

An optional 16:9 banner image above the section title, rendered on top of
the existing icon-card grid (`feature_grid.items`). Reference size: **1024 x
576px** (16:9), same convention as `page_hero.image`.

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

| Field   | Type             | Required | Notes                                   |
| ------- | ---------------- | -------- | ---------------------------------------- |
| `image` | string (media path) or null | No | 1024x576px (16:9). Section renders without a banner when omitted — fully backward compatible with existing `feature_grid` sections (e.g. `/sobre-nosotros/valores`). |

Frontend: `src/components/sections/FeatureGrid.astro` already reads
`Astro.props.image` and renders it via `mediaUrl()` — nothing else to change
once the admin exposes the field and a page sets it.
