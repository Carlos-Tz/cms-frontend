# Blog de GNU Gas Natural Vehicular \(gnu\-vehicular\)

*Activación del blog para el segundo sitio que lo tiene. No agrega código: el blog ya era site-agnóstico, lo que faltaba era la existencia del sitio en la base de datos. Complementa la documentación del blog general (misma API, mismas reglas de validación); aquí van solo las diferencias de este sitio.*

---

---

#### Flujo Simple

```
Paso 1: El seeder crea la fila del sitio (slug: gnu-vehicular)
⬇️
Paso 2: Crea la página `blog` (path /blog, posición 5) y su sección page_hero
⬇️
Paso 3: Crea los 4 artículos del blueprint con published_at escalonado
⬇️
Paso 4: El front pide GET /api/public/gnu-vehicular/pages/blog  → encabezado
⬇️
Paso 5: El front pide GET /api/public/gnu-vehicular/blog        → listado
⬇️
Paso 6: Backend filtra por site_id = 2 y por publicados → responde 200
```

**Antes del seeder** el paso 5 respondía `404`, no lista vacía: la ruta usa binding implícito `{site:slug}` y sin fila en `sites` falla antes de entrar al controlador.

#### Decisiones Clave de Implementación

1. **Siembra parcial: solo la columna Blog**

`references/gnu-vehicular.md` sigue en formato de árbol crudo del cliente y el skill indica migrarlo "cuando GNU valide el modelo". Por eso el seeder crea el sitio y su página de blog, **no el resto de las páginas**. Mismo precedente que `GnuBlueprintSeeder`, que hoy siembra 2 de las 17 páginas de `gnu`.

```js
// database/seeders/GnuVehicularBlueprintSeeder.php
$site = Site::updateOrCreate(
    ['slug' => 'gnu-vehicular'],
    ['name' => 'GNU Gas Natural Vehicular'],
);
```

**Consecuencia para el front:** hoy solo existe `/blog` en este sitio. `GET /api/public/gnu-vehicular/pages/inicio` responde `404` hasta que se siembre el resto.

1. **La página **`/blog`** va en posición 5, no en 6**

`position` de una página raíz ordena las columnas de la navegación principal. GNU Vehicular tiene una columna menos que el sitio institucional:

```js
// Inicio (1), Nuestros servicios (2), Ubicaciones (3), Contacto (4), Blog (5)
$blog = Page::updateOrCreate(
    ['site_id' => $site->id, 'slug' => 'blog'],
    ['path' => '/blog', 'title' => 'Blog', 'position' => 5, 'is_published' => true],
);
```

1. **Los slugs de artículo se repiten entre sitios y eso es correcto**

El único de la tabla es `[site_id, slug]`, no `slug`. `gas-natural-vs-otros-combustibles` existe en los dos sitios como dos artículos distintos:

| Sitio | `site_id` | slug del artículo |
| --- | --- | --- |
| `gnu` | 1 | `gas-natural-vs-otros-combustibles` |
| `gnu-vehicular` | 2 | `gas-natural-vs-otros-combustibles` |

**Consecuencia para el front:** el slug **no** identifica un artículo por sí solo, siempre va acompañado del sitio en la URL. Verificado: `GET /api/public/gnu/blog/seguridad-del-gnv` responde `404` porque ese artículo es de `gnu-vehicular`.

1. **El seeder es idempotente**

Cada `updateOrCreate` se llava por `[site_id, slug]` (artículos), `[site_id, slug]` (página) y `[page_id, type]` (sección). Re-ejecutar `php artisan db:seed` no duplica nada: verificado, sigue en 4 artículos por sitio.

1. **Cero cambios de código**

Ni migración, ni modelo, ni controlador, ni ruta, ni validación. El scope `published()` y la relación `Site::blogPosts()` ya filtraban por sitio, y el esquema de `page_hero` ya estaba registrado en `UpdateSectionRequest`. La única modificación fuera del seeder nuevo es la línea que lo registra en `DatabaseSeeder`.

#### Configuración

- Ejecutar el seeder: `php artisan db:seed --class=GnuVehicularBlueprintSeeder` (o `php artisan db:seed`, ya está registrado en `DatabaseSeeder`).
- `site_id` de este sitio en la base local: **2** (`gnu` es 1). No lo hardcodees en el front: el panel debe obtenerlo del listado de sitios; en la API pública nunca se usa, ahí manda el slug.
- Sin configuración adicional: mismo `.env`, mismo CORS, mismo JWT que el resto del CMS.

#### Implementación

**Estructura de la Petición — API pública**

```
Sin autenticación.
Headers requeridos:
Accept: application/json
```

**Contenido sembrado** (valores placeholder que el administrador reemplaza)

| # | Artículo | slug | `published_at` |
| --- | --- | --- | --- |
| 1 | Verificación anual | `verificacion-anual` | hace 4 días |
| 2 | Transporte sostenible | `transporte-sostenible` | hace 3 días |
| 3 | Seguridad del GNV | `seguridad-del-gnv` | hace 2 días |
| 4 | Gas natural vs otros combustibles | `gas-natural-vs-otros-combustibles` | hace 1 día |

`excerpt` = `"Resumen pendiente de redactar."`, `body` = `"<p>Contenido pendiente de redactar para «{título}».</p>"`, `cover_image` = `null`. El orden del listado es inverso a esta tabla (más reciente primero).

#### Endpoints

1. **Listado del blog**

```
GET /api/public/gnu-vehicular/blog?page=1
```

**Respuesta Exitosa (HTTP 200)** — verificada contra el servidor

```json
{
    "status": "success",
    "data": [
        {
            "slug": "gas-natural-vs-otros-combustibles",
            "title": "Gas natural vs otros combustibles",
            "excerpt": "Resumen pendiente de redactar.",
            "cover_image": null,
            "published_at": "2026-08-02"
        }
    ],
    "meta": {
        "site": "gnu-vehicular",
        "page": 1,
        "per_page": 10,
        "total": 4,
        "last_page": 1
    }
}
```

1. **Detalle de un artículo**

```
GET /api/public/gnu-vehicular/blog/{postSlug}
```

Igual que el listado más el campo `body` (HTML). Ejemplo verificado: `/blog/seguridad-del-gnv` → `"<p>Contenido pendiente de redactar para «Seguridad del GNV».</p>"`.

1. **Encabezado de la página**

```
GET /api/public/gnu-vehicular/pages/blog
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": {
        "slug": "blog",
        "path": "/blog",
        "title": "Blog",
        "sections": [
            {
                "type": "page_hero",
                "content": {
                    "title": "Blog",
                    "subtitle": "Noticias y guías sobre gas natural vehicular.",
                    "image": null
                }
            }
        ]
    },
    "meta": { "site": "gnu-vehicular" }
}
```

1. **Administración de estos artículos** (requiere JWT)

```
GET    /api/admin/blog-posts?site=gnu-vehicular
POST   /api/admin/blog-posts          → con "site_id": 2
PUT    /api/admin/blog-posts/{id}
DELETE /api/admin/blog-posts/{id}
```

Reglas de validación, derivación del slug y formato de errores: idénticos al blog general ya documentado. Solo cambia el `site_id` del payload.

**Respuestas de Error Comunes**

**Error 404 — Sitio no sembrado o artículo de otro sitio**

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "Recurso no encontrado" }
}
```

Se produce en tres casos que conviene distinguir en el front:

1. El slug de sitio no existe en `sites` (ej. `traninn-logistic` hoy).
2. El artículo existe pero pertenece a otro sitio.
3. El artículo es borrador o está programado a futuro.

**Error 401 — Sin token** (solo API admin)

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "No autenticado" }
}
```

#### Archivos involucrados

| Capa | Ruta | Descripción |
| --- | --- | --- |
| Seeder | database/seeders/GnuVehicularBlueprintSeeder.php | **Nuevo.** Sitio, página `/blog`, `page_hero` y los 4 artículos |
| Seeder | database/seeders/DatabaseSeeder.php | Registra el seeder nuevo después del de `gnu` |
| Pruebas | tests/Feature/BlogTest.php | 2 casos nuevos: 404 antes de sembrar, 4 artículos después, y aislamiento entre los dos blogs |
| Blueprint | `.claude/skills/sitios-web-gnu/references/gnu-vehicular.md` | Fuente de los 4 títulos y del orden de las columnas de navegación |
| Sin cambios | `app/Models/BlogPost.php`, `app/Http/Controllers/{Public,Admin}/Blog*`, `routes/*.php`, migraciones | El blog ya era site-agnóstico |
