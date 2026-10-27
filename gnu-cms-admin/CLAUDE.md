# GNU CMS Admin

App de React + Vite con Tailwind CSS v4 (`@tailwindcss/vite`, sin archivo de configuración — las utilidades se usan directamente) y `react-router` v8 (importa de `"react-router"`, no de `react-router-dom`).

## Estructura del servidor (producción)

Cada sitio público vive como dos directorios **independientes** en el servidor — no anidados, sin carpeta padre compartida:

```
<CODE_PATH>/              ← el proyecto de Astro (package.json, src/, node_modules/ instalados) — aquí corre la compilación
└── dist/                   generado por `npm run build`

<PUBLIC_PATH>/            ← lo que el servidor web realmente sirve
├── _astro/                ┐
├── blog/ contacto/…       │ reemplazado por completo con el contenido de <CODE_PATH>/dist/ después de una reconstrucción
└── index.html             ┘
```

`administracion-cms` (la salida de la compilación de Vite de este mismo admin) y `build-server` se despliegan por separado y no forman parte de este par CODE_PATH/PUBLIC_PATH por sitio.

Prefijo de ruta del admin → proyecto del repo (`CODE_PATH`) → slug del CMS (los nombres no coinciden — ver `build-server/README.md`):

| Ruta del admin | Proyecto del repo | Slug del CMS |
| :-- | :-- | :-- |
| `/gnu` | `landing-gnu` | `gnu` |
| `/gas-natural` | `gas-gnu` | `gnu-vehicular` |
| `/trainin` | `trainin` | `traninn-logistic` |
| `/tectuus` | `tectuus` | `tectuus` |

## "Reconstruir sitio"

`src/components/rebuild-site-button.jsx` (en el `select-page.jsx` de cada sitio) publica las ediciones guardadas en el CMS. El navegador no puede correr `npm run build` ni tocar el sistema de archivos del servidor, así que el botón llama al servicio independiente `build-server/` (`VITE_BUILD_SERVER_URL`, ver `src/functions/fetch.jsx` → `rebuildSite` / `getRebuildStatus`) — solo esa URL va en el `.env` de este admin; las rutas reales del sistema de archivos `CODE_PATH`/`PUBLIC_PATH` viven en el `.env` propio de `build-server` (`VITE_<SITE>_CODE_PATH` / `VITE_<SITE>_PUBLIC_PATH`) y nunca se envían al navegador. El servicio corre `npm run build` en `CODE_PATH` y luego reemplaza por completo el contenido de `PUBLIC_PATH` con `CODE_PATH/dist/`. Ver `../build-server/README.md`.

## Rutas

- `src/App.jsx` es dueño del `<Routes>` de nivel superior y renderiza directamente la landing page.
- Los componentes de ruta viven en `src/pages/<name>/index.jsx` y se enrutan en `/<name>` (p. ej. `pages/login` → `/login`, `pages/home` → `/home`), no en `/pages/<name>`.
- `BrowserRouter` envuelve a `<App />` en `src/main.jsx`.

## Sistema de diseño

Marca oscura en violeta/azul, derivada de `public/favicon.svg` y `public/icons.svg`.

**Colores**
- Fondo: `#0b0611`
- Acento primario (violeta): `#863bff` / `#7e14ff`
- Acento secundario (azul): `#47bfff`
- Texto de acento claro (p. ej. etiquetas eyebrow): `#c9a3ff`
- Texto de cuerpo sobre fondo oscuro: `text-white` con opacidad reducida (`text-white/60`, `/70`, `/40`) en lugar de tonos grises

**Componentes**
- CTA primario: botón tipo píldora (`rounded-full`), degradado `from-[#863bff] to-[#47bfff]`, `shadow-lg shadow-[#863bff]/30`, `hover:brightness-110`
- Botón secundario/de navegación: `rounded-full border border-white/15`, en hover cambia a `border-white/30`
- Tarjetas/paneles: estilo "glass" — `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm`
- Inputs: `rounded-lg border border-white/15 bg-white/5`, `focus:border-[#863bff]`
- Texto de encabezado con degradado: envuelve la frase enfatizada en `bg-gradient-to-r from-[#863bff] to-[#47bfff] bg-clip-text text-transparent`
- `src/components/card.jsx` — tarjeta reutilizable (título, subtítulo, punto de estado, botón con ícono de flecha circular). El estado es semántico, no color de marca: `active` esmeralda, `pending` ámbar, `draft` white/40, `error` rosa. Reutiliza este conjunto para cualquier estado nuevo en lugar de inventar colores nuevos.

**Recursos**
- `public/favicon.svg` también funciona como el logo pequeño en los encabezados de página.
- `src/assets/hero.png` es la ilustración hero de la landing page.

Mantén las páginas nuevas consistentes con esta paleta y este conjunto de componentes en lugar de introducir colores o estilos de botón nuevos.
