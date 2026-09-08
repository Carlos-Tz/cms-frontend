# Gestión de contenido — Sobre nosotros



*Habilita que el administrador lea y edite el contenido de las 5 páginas de la columna «Sobre nosotros» (la cabecera + Propósito empresarial, Valores, Certificaciones, Nuestra historia) a través de la API admin ya existente. No se agregaron rutas, controladores ni tablas: solo faltaban las reglas de validación de dos tipos de sección y las filas en la base de datos.*

---


---

#### Flujo Simple

```sql
Paso 1: El admin obtiene su token
        POST /api/admin/auth/login
⬇️
Paso 2: Descubre las secciones de la página
        GET /api/admin/sections?site=gnu&page=valores
        (SectionController@index filtra por slug de sitio y de página vía whereHas)
⬇️
Paso 3: Envía el contenido completo de una sección
        PUT /api/admin/sections/{id}
⬇️
Paso 4: Middleware auth:api valida el JWT
⬇️
Paso 5: UpdateSectionRequest lee el `type` del modelo ya cargado
        y aplica el esquema correspondiente (rich_text | feature_grid | …)
        → sin esquema: 422 «El tipo de sección «X» aún no es editable»
⬇️
Paso 6: array_merge(contenido guardado, contenido validado)
        → los campos `fijo` sobreviven porque no están en las reglas
⬇️
Paso 7: UPDATE sections SET content = …
⬇️
Paso 8: El front consume GET /api/public/gnu/pages/{slug}
        con las secciones ordenadas por `position`
```

#### Decisiones Clave de Implementación

1. **Dos esquemas nuevos, no dos controladores** — `app/Http/Requests/Admin/UpdateSectionRequest.php`

El CRUD de secciones ya existía y es genérico. Lo único que bloqueaba estas páginas era la ausencia de sus tipos en la constante `SCHEMAS`, que está cerrada por defecto.

```
'rich_text' => [
    'title' => ['nullable', 'string', 'max:255'],
    'body' => ['required', 'string'],          // HTML libre, igual que BlogPostRequest
    'video_url' => ['nullable', 'url', 'max:2048'],
],
'feature_grid' => [
    'title' => ['nullable', 'string', 'max:255'],
    // `present` y no `required`: permite vaciar la colección,
    // mismo criterio que slides, logos, fuel_prices y networks.
    'items' => ['present', 'array'],
    'items.*.icon' => ['nullable', 'string', 'max:2048'],  // ruta que devuelve POST /api/admin/media
    'items.*.title' => ['required', 'string', 'max:255'],
    'items.*.text' => ['required', 'string', 'max:2000'],
],
```

1. **Un solo tipo para Valores y Certificaciones**

Ambas páginas son la misma forma: una rejilla de tarjetas con ícono, título y texto. Comparten `feature_grid`, por lo que comparten endpoint, validación y componente del panel. Se descartó un tipo `certifications` con `issuer` / `expires_at` / `file_url` — el catálogo ya lo había descartado una vez por ser «una página disfrazada de bloque».

1. `feature_grid`** en Propósito empresarial**

Misión, Visión y Propósito son tarjetas estructuradas, no encabezados enterrados en el HTML. El `rich_text` queda como introducción. Es la única desviación respecto al blueprint original, y quedó registrada en `references/gnu.md`.

1. **Helper **`page()`** en el seeder** — `database/seeders/GnuBlueprintSeeder.php`

El `updateOrCreate` de página se repetía 7 veces y las 4 hijas necesitan `parent_id`:

```js
private function page(
    Site $site, string $slug, string $path, string $title,
    int $position, ?Page $parent = null,
): Page {
    return Page::updateOrCreate(
        ['site_id' => $site->id, 'slug' => $slug],   // clave de upsert → idempotente
        [
            'parent_id' => $parent?->id,
            'path' => $path,
            'title' => $title,
            'position' => $position,
            'is_published' => true,
        ],
    );
}
```

Se usa junto al helper `section()` que ya existía (upsert por `site_id` + `page_id` + `type`). Re-ejecutar el seeder restaura los valores placeholder sin duplicar filas.

1. **Ninguna página repite un tipo de sección**

Por eso no hizo falta agregar la columna `key` a `sections`. En cuanto una página lleve dos `rich_text`, esa columna será obligatoria para distinguirlos.

#### Configuración

Ninguna nueva. Se reutiliza lo ya configurado:

- `JWT_SECRET` en `.env` para el guard `api` (`php artisan jwt:secret` si falta).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`config/admin.php`, por defecto `admin@gnu-headless-cms.test` / `password`).
- Para aplicar los cambios: `php artisan db:seed --class=GnuBlueprintSeeder` (idempotente, no requiere `migrate:fresh`).

#### Implementación

**Estructura de la Petición (API admin)**

```
Headers requeridos:
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

El token viene de `POST /api/admin/auth/login`, en `data.access_token` (no `data.token`).

**Páginas sembradas**

| slug | path | padre | pos | secciones (en orden) |
| --- | --- | --- | --- | --- |
| `sobre-nosotros` | `/sobre-nosotros` | — | 3 | `page_hero`, `rich_text` |
| `proposito-empresarial` | `/sobre-nosotros/proposito-empresarial` | `sobre-nosotros` | 1 | `page_hero`, `rich_text`, `feature_grid` |
| `valores` | `/sobre-nosotros/valores` | `sobre-nosotros` | 2 | `page_hero`, `feature_grid` |
| `certificaciones` | `/sobre-nosotros/certificaciones` | `sobre-nosotros` | 3 | `page_hero`, `feature_grid` |
| `nuestra-historia` | `/sobre-nosotros/nuestra-historia` | `sobre-nosotros` | 4 | `page_hero`, `rich_text` |

11 secciones en total.

#### Endpoints

**Listar las secciones de una página**

```
GET /api/admin/sections?site=gnu&page=valores
```

Respuesta (HTTP 200):

```json
{
    "status": "success",
    "data": [
        { "id": 10, "type": "page_hero",    "position": 1, "content": { "…": "…" } },
        { "id": 11, "type": "feature_grid", "position": 2, "content": { "…": "…" } }
    ],
    "meta": { "total": 2 }
}
```

**Editar Valores o Certificaciones (**`feature_grid`**)**

```
PUT /api/admin/sections/{id}
```

El `PUT` reemplaza la colección completa: agregar, quitar y reordenar tarjetas es enviar el arreglo `items` como debe quedar.

```json
{
    "content": {
        "title": "Nuestros valores",
        "items": [
            { "icon": "media/seguridad.svg", "title": "Seguridad",  "text": "Primero, siempre." },
            { "icon": null,                  "title": "Innovación", "text": "Buscamos mejores formas." }
        ]
    }
}
```

Respuesta (HTTP 200):

```json
{
    "status": "success",
    "data": {
        "id": 11,
        "site_id": 1,
        "page_id": 4,
        "type": "feature_grid",
        "position": 2,
        "content": {
            "title": "Nuestros valores",
            "items": [
                { "icon": "media/seguridad.svg", "title": "Seguridad", "text": "Primero, siempre." },
                { "icon": null, "title": "Innovación", "text": "Buscamos mejores formas." }
            ]
        }
    },
    "meta": { "message": "Sección actualizada correctamente" }
}
```

**Editar Propósito empresarial o Nuestra historia (**`rich_text`**)**

```
PUT /api/admin/sections/{id}
```

```json
{
    "content": {
        "title": "Desde 1998",
        "body": "<p>Nuestra historia empieza en Monterrey.</p>",
        "video_url": "https://www.youtube.com/watch?v=abc123"
    }
}
```

**Subir el ícono de una tarjeta**

```
POST /api/admin/media
```

Devuelve `data.path`, que es el valor que se guarda en `items[].icon` y en `page_hero.image`.

**Consumo público (sin autenticación)**

```
GET /api/public/gnu/pages/{slug}
```

```json
{
    "status": "success",
    "data": {
        "slug": "proposito-empresarial",
        "path": "/sobre-nosotros/proposito-empresarial",
        "title": "Propósito empresarial",
        "sections": [
            { "type": "page_hero",    "content": { "title": "…", "subtitle": "…", "image": null } },
            { "type": "rich_text",    "content": { "title": null, "body": "<p>…</p>", "video_url": null } },
            { "type": "feature_grid", "content": { "title": null, "items": [ { "icon": null, "title": "Misión", "text": "…" } ] } }
        ]
    },
    "meta": { "site": "gnu" }
}
```

Las secciones llegan ordenadas por `position`; el front las renderiza en ese orden sin reordenar nada. Una página con `is_published = false` responde 404.

**Respuestas de Error Comunes**

**Error 422 — Validación**

```json
{
    "message": "El campo content.items.0.title es obligatorio.",
    "errors": {
        "content.items.0.title": ["El campo content.items.0.title es obligatorio."]
    }
}
```

**Error 422 — Tipo aún no editable** (cerrado por defecto, no es un bug)

```json
{
    "message": "El tipo de sección «testimonials» aún no es editable desde el panel.",
    "errors": {
        "content": ["El tipo de sección «testimonials» aún no es editable desde el panel."]
    }
}
```

**Error 401 — No autenticado**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

**Error 404 — Página no encontrada o despublicada**

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

**Error 405 — Crear o borrar secciones**

`POST /api/admin/sections` y `DELETE /api/admin/sections/{id}` no existen: el contrato de editabilidad prohíbe que el admin altere la estructura. Solo se exponen `index`, `show` y `update`.

#### Archivos involucrados

| Capa | Ruta | Descripción |
| --- | --- | --- |
| Validación | app/Http/Requests/Admin/UpdateSectionRequest.php | **Modificado.** Dos entradas nuevas en `SCHEMAS`: `rich_text` y `feature_grid`. Sube de 8 a 10 los tipos editables |
| Seeder | database/seeders/GnuBlueprintSeeder.php | **Modificado.** Método `aboutUs()` con las 5 páginas y 11 secciones + helper `page()` idempotente |
| Pruebas | tests/Feature/AboutContentTest.php | **Nuevo.** 6 tests: orden de secciones, reemplazo de la colección, y los dos casos de rechazo |
| Controlador (admin) | app/Http/Controllers/Admin/SectionController.php | Sin cambios. `index` / `show` / `update` ya cubrían el caso |
| Controlador (público) | app/Http/Controllers/Public/PageController.php | Sin cambios. `show()` ya sirve cualquier página publicada con sus secciones |
| Modelo | app/Models/Page.php | Sin cambios. `parent_id` ya estaba en `#[Fillable]` |
| Migración | database/migrations/2026\_07\_27\_042543\_create\_pages\_table.php | Sin cambios. `parent_id` autorreferenciado ya existía |
| Rutas | routes/admin.php · routes/public.php | Sin cambios |
| Blueprint | .claude/skills/sitios-web-gnu/references/gnu.md | **Actualizado.** `feature_grid` agregado a Propósito empresarial, con su justificación |
| Blueprint | .claude/skills/sitios-web-gnu/references/section-types.md | **Actualizado.** Redacción del conteo de páginas genéricas |
| Estado | .claude/skills/sitios-web-gnu/references/implementation-status.md | **Actualizado.** `rich_text` y `feature_grid` a ✅; 7 de 17 páginas sembradas |
| Estado | .claude/skills/cms-gnu-backend/references/functionality-map.md | **Actualizado.** 10 de 12 tipos editables; el hueco #5 se reduce a `testimonials` y `stations_map` |

---

**Estado de la suite:** 51 tests, 196 aserciones, todos verdes. Verificado además contra Herd (`http://gnu-headless-cms.test`) con el ciclo completo login → listar → actualizar → leer en público.

**Pendiente conocido:** `Admin\PageController` sigue siendo stub, así que el panel necesita conocer los slugs de antemano y despublicar una página exige entrar a la base de datos.
