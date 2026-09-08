# Blog \(artículos por sitio\)

*Alimenta la página *`/blog`* de los sitios que lo tienen (*`gnu`* y *`gnu-vehicular`*). El listado y el detalle salen de la tabla *`blog_posts`*; el encabezado de la página sale del blueprint como sección *`page_hero`*. El admin crea, edita y borra artículos; el front solo lee.*

---


---

#### Flujo Simple

**Lectura pública (front del sitio)**

```
Paso 1: El front pide el hero de la página → GET /api/public/{site}/pages/blog
⬇️
Paso 2: El front pide el listado → GET /api/public/{site}/blog?page=1
⬇️
Paso 3: Backend resuelve el sitio por slug (route binding) y filtra por site_id
⬇️
Paso 4: Filtra publicados (published_at no nulo y <= ahora) y ordena por fecha desc
⬇️
Paso 5: Responde {data:[...], meta:{paginación}} — sin el campo body
⬇️
Paso 6: El usuario abre un artículo → GET /api/public/{site}/blog/{postSlug} → incluye body (HTML)
```

**Escritura (panel de administración)**

```
Paso 1: POST /api/admin/auth/login → access_token JWT
⬇️
Paso 2: (opcional) POST /api/admin/media con la imagen → devuelve {path, url}
⬇️
Paso 3: POST /api/admin/blog-posts con Authorization: Bearer {token}
⬇️
Paso 4: BlogPostRequest valida; si no mandas slug lo deriva del título
⬇️
Paso 5: Se guarda la fila; published_at nulo = borrador (invisible al público)
⬇️
Paso 6: Respuesta 201 con el artículo creado y mensaje en español
```

#### Decisiones Clave de Implementación

1. **Un solo campo controla el estado de publicación**

No existe `is_published`. Todo se decide con `published_at`:

```
// app/Models/BlogPost.php
#[Scope]
protected function published(Builder $query): void
{
    $query->whereNotNull('published_at')->where('published_at', '<=', now());
}
```

| `published_at` | Estado | ¿Lo ve el público? |
| --- | --- | --- |
| `null` | Borrador | No |
| Fecha futura | Programado | No (aparece solo al llegar la fecha) |
| Fecha pasada | Publicado | Sí |

**Para el front:** `published_at` siempre llega como `"YYYY-MM-DD"` en la API pública (sin hora), listo para formatear.

1. **El listado no trae **`body`

El endpoint de listado omite el HTML del artículo a propósito: la lista solo necesita título, extracto e imagen. Para el contenido completo hay que pedir el detalle.

```js
// app/Http/Controllers/Public/BlogController.php
private function present(BlogPost $post, bool $withBody = false): array
{
    $data = [
        'slug' => $post->slug,
        'title' => $post->title,
        'excerpt' => $post->excerpt,
        'cover_image' => $post->cover_image,
        'published_at' => $post->published_at?->toDateString(),
    ];

    return $withBody ? [...$data, 'body' => $post->body] : $data;
}
```

1. **El aislamiento por sitio es del backend, nunca del cliente**

El sitio se resuelve por el slug de la URL y todas las consultas salen de la relación, así que un artículo de `gnu` jamás puede aparecer en `gnu-vehicular`:

```
$posts = $site->blogPosts()->published()->latest('published_at')->paginate(10);
```

Un sitio sin blog (`tectuus`, `traninn-logistic`) **no da error**: devuelve `data: []` con `meta.total = 0`. No hay bandera `has_blog` que consultar.

1. **El slug se deriva del título si no lo mandas**

```js
// app/Http/Requests/Admin/BlogPostRequest.php
protected function prepareForValidation(): void
{
    if ($this->missing('slug') && $this->filled('title')) {
        $this->merge(['slug' => Str::slug($this->string('title')->value())]);
    }
}
```

Si el slug generado ya existe en ese sitio, **falla la validación** en lugar de agregar un sufijo `-2`: la URL definitiva del artículo la decide el administrador. El mismo slug sí puede repetirse en sitios distintos (único por `[site_id, slug]`).

1. **El artículo no cambia de sitio**

`site_id` es obligatorio al crear y está **prohibido** al editar (`422` con `"Un artículo no puede cambiar de sitio."`). El `PUT` usa semántica de reemplazo: manda el payload completo, no campos sueltos.

1. **Sin categorías ni tags**

No existen (`/api/admin/blog-categories` responde `404`). Si el diseño del front necesita filtros por categoría, hay que pedirlo como cambio de backend.

1. **La página **`/blog`** es estructura, no datos**

El título y la imagen del encabezado viven en la sección `page_hero` de la página `blog`, y se piden por separado. El front **no** debe hardcodear ese texto.

#### Configuración

- **Nada por configurar del lado del front** más allá de la URL base y el slug del sitio.
- Base local: `http://gnu-headless-cms.test` (Laravel Herd).
- CORS: solo se permiten orígenes `localhost` / `127.0.0.1` con cualquier puerto (`config/cors.php`). Para desplegar un front en otro dominio hay que agregarlo ahí.
- Slugs de sitio válidos: `gnu`, `gnu-vehicular`, `traninn-logistic`, `tectuus` (los dos últimos sin blog).
- `per_page` está fijo: **10** en el público, **20** en el admin. No es configurable por query string.
- Imágenes: `cover_image` es una ruta relativa (`media/archivo.jpg`) sobre el disco público. La URL absoluta es `{BASE_URL}/storage/{cover_image}`.

#### Implementación

**Estructura de la Petición — API pública**

```
Sin autenticación.
Headers requeridos:
Accept: application/json
```

**Estructura de la Petición — API admin**

```
Headers requeridos:
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

**Envoltura de todas las respuestas** (excepto errores de validación, ver más abajo)

```json
{
    "status": "success",
    "data": "...",
    "meta": { }
}
```

#### Endpoints

##### API pública (consumo del sitio web)

1. **Listar artículos publicados**

```
GET /api/public/{site}/blog?page=1
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": [
        {
            "slug": "gas-natural-vs-otros-combustibles",
            "title": "Gas natural vs otros combustibles",
            "excerpt": "Resumen pendiente de redactar.",
            "cover_image": null,
            "published_at": "2026-07-27"
        }
    ],
    "meta": {
        "site": "gnu",
        "page": 1,
        "per_page": 10,
        "total": 4,
        "last_page": 1
    }
}
```

Orden: del más reciente al más antiguo. Paginación con `?page=N`; usa `meta.last_page` para el paginador.

1. **Detalle de un artículo**

```
GET /api/public/{site}/blog/{postSlug}
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": {
        "slug": "beneficios-del-gas-natural",
        "title": "Beneficios del gas natural",
        "excerpt": "Resumen pendiente de redactar.",
        "cover_image": null,
        "published_at": "2026-07-25",
        "body": "<p>Contenido pendiente de redactar.</p>"
    },
    "meta": { "site": "gnu" }
}
```

`body` es **HTML** generado por el editor del panel: renderízalo como HTML, no como texto plano.

1. **Encabezado de la página de blog**

```
GET /api/public/{site}/pages/blog
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
                    "subtitle": "Noticias y artículos sobre el gas natural.",
                    "image": null
                }
            }
        ]
    },
    "meta": { "site": "gnu" }
}
```

##### API admin (panel, requiere JWT)

1. **Login**

```
POST /api/admin/auth/login
```

```json
{ "email": "admin@gnu-headless-cms.test", "password": "password" }
```

Respuesta: `data.access_token`, `data.token_type`, `data.expires_in` (segundos).

1. **Listar artículos, borradores incluidos**

```
GET /api/admin/blog-posts?site=gnu&page=1
```

Devuelve los modelos completos (con `id`, `site_id`, `body`, `created_at`…). Orden: publicados más recientes primero, **borradores al final**. `?site=` es opcional; sin él lista los de todos los sitios.

1. **Crear artículo**

```
POST /api/admin/blog-posts
```

**Ejemplo de Petición** (mínimo viable: `slug` y `published_at` son opcionales)

```json
{
    "site_id": 1,
    "title": "Cómo instalar GNV en tu flotilla",
    "excerpt": "Guía rápida de requisitos, costos y tiempos.",
    "body": "<p>Contenido en HTML.</p>",
    "cover_image": "media/portada-gnv.jpg",
    "published_at": "2026-07-28 10:00:00"
}
```

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": {
        "id": 5,
        "site_id": 1,
        "slug": "como-instalar-gnv-en-tu-flotilla",
        "title": "Cómo instalar GNV en tu flotilla",
        "excerpt": "Guía rápida de requisitos, costos y tiempos.",
        "body": "<p>Contenido en HTML.</p>",
        "cover_image": "media/portada-gnv.jpg",
        "published_at": "2026-07-28T10:00:00.000000Z",
        "created_at": "2026-07-28T21:40:00.000000Z",
        "updated_at": "2026-07-28T21:40:00.000000Z"
    },
    "meta": { "message": "Artículo creado correctamente" }
}
```

**Reglas de validación**

| Campo | Reglas | Notas |
| --- | --- | --- |
| `site_id` | requerido al crear, **prohibido** al editar | entero existente en `sites` |
| `slug` | requerido, máx 255, `/^[a-z0-9-]+$/`, único por sitio | se deriva del título si se omite |
| `title` | requerido, máx 255 |  |
| `excerpt` | opcional, máx 500 | texto plano para el listado |
| `body` | requerido | HTML |
| `cover_image` | opcional, máx 2048 | ruta devuelta por `POST /api/admin/media` |
| `published_at` | opcional, fecha válida | omitir o `null` = borrador |

1. **Ver, actualizar y eliminar**

```
GET    /api/admin/blog-posts/{id}
PUT    /api/admin/blog-posts/{id}
DELETE /api/admin/blog-posts/{id}
```

El `PUT` requiere el payload completo (`slug`, `title`, `body`…), sin `site_id`. El `DELETE` es definitivo (no hay papelera).

1. **Subir la imagen de portada**

```
POST /api/admin/media
Content-Type: multipart/form-data
```

Campo `file`, solo imágenes, máximo 5 MB.

**Respuesta Exitosa (HTTP 201)**

```json
{
    "data": {
        "path": "media/xY12ab.jpg",
        "url": "http://gnu-headless-cms.test/storage/media/xY12ab.jpg"
    }
}
```

Guarda `path` en `cover_image`. Usa `url` solo para la vista previa.

**Respuestas de Error Comunes**

**Error 404 — Artículo o sitio no encontrado** (también cuando el artículo es borrador o programado)

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "Recurso no encontrado" }
}
```

**Error 401 — Sin token o token expirado** (solo API admin)

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "No autenticado" }
}
```

**Error 422 — Validación.** Atención: **no usa la envoltura **`{data, meta}`, es el formato estándar de Laravel.

```json
{
    "message": "Ya existe un artículo con ese slug en este sitio.",
    "errors": {
        "slug": ["Ya existe un artículo con ese slug en este sitio."]
    }
}
```

#### Archivos involucrados

| Capa | Ruta | Descripción |
| --- | --- | --- |
| Migración | database/migrations/2026\_07\_28\_213407\_create\_blog\_posts\_table.php | Tabla `blog_posts`; único `[site_id, slug]`, índice `[site_id, published_at]` |
| Modelo | app/Models/BlogPost.php | Campos asignables, cast de `published_at`, scope `published()` |
| Modelo | app/Models/Site.php | Relación `blogPosts()` — punto de entrada del filtro por sitio |
| Rutas públicas | routes/public.php | `GET {site}/blog`, `GET {site}/blog/{postSlug}` |
| Rutas admin | routes/admin.php | `apiResource blog-posts` bajo `auth:api` |
| Controlador público | app/Http/Controllers/Public/BlogController.php | Listado paginado sin `body` y detalle con `body` |
| Controlador admin | app/Http/Controllers/Admin/BlogPostController.php | CRUD completo, filtro `?site=`, incluye borradores |
| Validación | app/Http/Requests/Admin/BlogPostRequest.php | Reglas, derivación del slug, mensajes en español |
| Validación | app/Http/Requests/Admin/UpdateSectionRequest.php | Esquema de `page_hero` (encabezado de la página de blog) |
| Controlador público | app/Http/Controllers/Public/PageController.php | Sirve la página `blog` con su `page_hero` |
| Controlador admin | app/Http/Controllers/Admin/MediaController.php | Subida de la imagen de portada |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Página `/blog`, su `page_hero` y los 4 artículos semilla |
| Factory | database/factories/BlogPostFactory.php | Estados `draft()` y `scheduled()` para pruebas |
| Pruebas | tests/Feature/BlogTest.php | 12 casos: visibilidad, slugs, CRUD, autenticación |
| Manejo de errores | bootstrap/app.php | Respuestas 401 y 404 en español para `api/*` |

**Nota para el front:** `gnu-vehicular` ya funciona a nivel de código, pero su blueprint aún no está sembrado, así que hoy no tiene página `/blog` ni artículos. Su listado responde `200` con `data: []`.Blog (artículos por sitio)

*Alimenta la página *`/blog`* de los sitios que lo tienen (*`gnu`* y *`gnu-vehicular`*). El listado y el detalle salen de la tabla *`blog_posts`*; el encabezado de la página sale del blueprint como sección *`page_hero`*. El admin crea, edita y borra artículos; el front solo lee.*

#### Flujo Simple

**Lectura pública (front del sitio)**

```
Paso 1: El front pide el hero de la página → GET /api/public/{site}/pages/blog
⬇️
Paso 2: El front pide el listado → GET /api/public/{site}/blog?page=1
⬇️
Paso 3: Backend resuelve el sitio por slug (route binding) y filtra por site_id
⬇️
Paso 4: Filtra publicados (published_at no nulo y <= ahora) y ordena por fecha desc
⬇️
Paso 5: Responde {data:[...], meta:{paginación}} — sin el campo body
⬇️
Paso 6: El usuario abre un artículo → GET /api/public/{site}/blog/{postSlug} → incluye body (HTML)
```

**Escritura (panel de administración)**

```
Paso 1: POST /api/admin/auth/login → access_token JWT
⬇️
Paso 2: (opcional) POST /api/admin/media con la imagen → devuelve {path, url}
⬇️
Paso 3: POST /api/admin/blog-posts con Authorization: Bearer {token}
⬇️
Paso 4: BlogPostRequest valida; si no mandas slug lo deriva del título
⬇️
Paso 5: Se guarda la fila; published_at nulo = borrador (invisible al público)
⬇️
Paso 6: Respuesta 201 con el artículo creado y mensaje en español
```

#### Decisiones Clave de Implementación

1. **Un solo campo controla el estado de publicación**

No existe `is_published`. Todo se decide con `published_at`:

```
// app/Models/BlogPost.php
#[Scope]
protected function published(Builder $query): void
{
    $query->whereNotNull('published_at')->where('published_at', '<=', now());
}
```

| `published_at` | Estado | ¿Lo ve el público? |
| --- | --- | --- |
| `null` | Borrador | No |
| Fecha futura | Programado | No (aparece solo al llegar la fecha) |
| Fecha pasada | Publicado | Sí |

**Para el front:** `published_at` siempre llega como `"YYYY-MM-DD"` en la API pública (sin hora), listo para formatear.

1. **El listado no trae **`body`

El endpoint de listado omite el HTML del artículo a propósito: la lista solo necesita título, extracto e imagen. Para el contenido completo hay que pedir el detalle.

```js
// app/Http/Controllers/Public/BlogController.php
private function present(BlogPost $post, bool $withBody = false): array
{
    $data = [
        'slug' => $post->slug,
        'title' => $post->title,
        'excerpt' => $post->excerpt,
        'cover_image' => $post->cover_image,
        'published_at' => $post->published_at?->toDateString(),
    ];

    return $withBody ? [...$data, 'body' => $post->body] : $data;
}
```

1. **El aislamiento por sitio es del backend, nunca del cliente**

El sitio se resuelve por el slug de la URL y todas las consultas salen de la relación, así que un artículo de `gnu` jamás puede aparecer en `gnu-vehicular`:

```
$posts = $site->blogPosts()->published()->latest('published_at')->paginate(10);
```

Un sitio sin blog (`tectuus`, `traninn-logistic`) **no da error**: devuelve `data: []` con `meta.total = 0`. No hay bandera `has_blog` que consultar.

1. **El slug se deriva del título si no lo mandas**

```js
// app/Http/Requests/Admin/BlogPostRequest.php
protected function prepareForValidation(): void
{
    if ($this->missing('slug') && $this->filled('title')) {
        $this->merge(['slug' => Str::slug($this->string('title')->value())]);
    }
}
```

Si el slug generado ya existe en ese sitio, **falla la validación** en lugar de agregar un sufijo `-2`: la URL definitiva del artículo la decide el administrador. El mismo slug sí puede repetirse en sitios distintos (único por `[site_id, slug]`).

1. **El artículo no cambia de sitio**

`site_id` es obligatorio al crear y está **prohibido** al editar (`422` con `"Un artículo no puede cambiar de sitio."`). El `PUT` usa semántica de reemplazo: manda el payload completo, no campos sueltos.

1. **Sin categorías ni tags**

No existen (`/api/admin/blog-categories` responde `404`). Si el diseño del front necesita filtros por categoría, hay que pedirlo como cambio de backend.

1. **La página **`/blog`** es estructura, no datos**

El título y la imagen del encabezado viven en la sección `page_hero` de la página `blog`, y se piden por separado. El front **no** debe hardcodear ese texto.

#### Configuración

- **Nada por configurar del lado del front** más allá de la URL base y el slug del sitio.
- Base local: `http://gnu-headless-cms.test` (Laravel Herd).
- CORS: solo se permiten orígenes `localhost` / `127.0.0.1` con cualquier puerto (`config/cors.php`). Para desplegar un front en otro dominio hay que agregarlo ahí.
- Slugs de sitio válidos: `gnu`, `gnu-vehicular`, `traninn-logistic`, `tectuus` (los dos últimos sin blog).
- `per_page` está fijo: **10** en el público, **20** en el admin. No es configurable por query string.
- Imágenes: `cover_image` es una ruta relativa (`media/archivo.jpg`) sobre el disco público. La URL absoluta es `{BASE_URL}/storage/{cover_image}`.

#### Implementación

**Estructura de la Petición — API pública**

```
Sin autenticación.
Headers requeridos:
Accept: application/json
```

**Estructura de la Petición — API admin**

```
Headers requeridos:
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

**Envoltura de todas las respuestas** (excepto errores de validación, ver más abajo)

```json
{
    "status": "success",
    "data": "...",
    "meta": { }
}
```

#### Endpoints

##### API pública (consumo del sitio web)

1. **Listar artículos publicados**

```
GET /api/public/{site}/blog?page=1
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": [
        {
            "slug": "gas-natural-vs-otros-combustibles",
            "title": "Gas natural vs otros combustibles",
            "excerpt": "Resumen pendiente de redactar.",
            "cover_image": null,
            "published_at": "2026-07-27"
        }
    ],
    "meta": {
        "site": "gnu",
        "page": 1,
        "per_page": 10,
        "total": 4,
        "last_page": 1
    }
}
```

Orden: del más reciente al más antiguo. Paginación con `?page=N`; usa `meta.last_page` para el paginador.

1. **Detalle de un artículo**

```
GET /api/public/{site}/blog/{postSlug}
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": {
        "slug": "beneficios-del-gas-natural",
        "title": "Beneficios del gas natural",
        "excerpt": "Resumen pendiente de redactar.",
        "cover_image": null,
        "published_at": "2026-07-25",
        "body": "<p>Contenido pendiente de redactar.</p>"
    },
    "meta": { "site": "gnu" }
}
```

`body` es **HTML** generado por el editor del panel: renderízalo como HTML, no como texto plano.

1. **Encabezado de la página de blog**

```
GET /api/public/{site}/pages/blog
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
                    "subtitle": "Noticias y artículos sobre el gas natural.",
                    "image": null
                }
            }
        ]
    },
    "meta": { "site": "gnu" }
}
```

##### API admin (panel, requiere JWT)

1. **Login**

```
POST /api/admin/auth/login
```

```json
{ "email": "admin@gnu-headless-cms.test", "password": "password" }
```

Respuesta: `data.access_token`, `data.token_type`, `data.expires_in` (segundos).

1. **Listar artículos, borradores incluidos**

```
GET /api/admin/blog-posts?site=gnu&page=1
```

Devuelve los modelos completos (con `id`, `site_id`, `body`, `created_at`…). Orden: publicados más recientes primero, **borradores al final**. `?site=` es opcional; sin él lista los de todos los sitios.

1. **Crear artículo**

```
POST /api/admin/blog-posts
```

**Ejemplo de Petición** (mínimo viable: `slug` y `published_at` son opcionales)

```json
{
    "site_id": 1,
    "title": "Cómo instalar GNV en tu flotilla",
    "excerpt": "Guía rápida de requisitos, costos y tiempos.",
    "body": "<p>Contenido en HTML.</p>",
    "cover_image": "media/portada-gnv.jpg",
    "published_at": "2026-07-28 10:00:00"
}
```

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": {
        "id": 5,
        "site_id": 1,
        "slug": "como-instalar-gnv-en-tu-flotilla",
        "title": "Cómo instalar GNV en tu flotilla",
        "excerpt": "Guía rápida de requisitos, costos y tiempos.",
        "body": "<p>Contenido en HTML.</p>",
        "cover_image": "media/portada-gnv.jpg",
        "published_at": "2026-07-28T10:00:00.000000Z",
        "created_at": "2026-07-28T21:40:00.000000Z",
        "updated_at": "2026-07-28T21:40:00.000000Z"
    },
    "meta": { "message": "Artículo creado correctamente" }
}
```

**Reglas de validación**

| Campo | Reglas | Notas |
| --- | --- | --- |
| `site_id` | requerido al crear, **prohibido** al editar | entero existente en `sites` |
| `slug` | requerido, máx 255, `/^[a-z0-9-]+$/`, único por sitio | se deriva del título si se omite |
| `title` | requerido, máx 255 |  |
| `excerpt` | opcional, máx 500 | texto plano para el listado |
| `body` | requerido | HTML |
| `cover_image` | opcional, máx 2048 | ruta devuelta por `POST /api/admin/media` |
| `published_at` | opcional, fecha válida | omitir o `null` = borrador |

1. **Ver, actualizar y eliminar**

```
GET    /api/admin/blog-posts/{id}
PUT    /api/admin/blog-posts/{id}
DELETE /api/admin/blog-posts/{id}
```

El `PUT` requiere el payload completo (`slug`, `title`, `body`…), sin `site_id`. El `DELETE` es definitivo (no hay papelera).

1. **Subir la imagen de portada**

```
POST /api/admin/media
Content-Type: multipart/form-data
```

Campo `file`, solo imágenes, máximo 5 MB.

**Respuesta Exitosa (HTTP 201)**

```json
{
    "data": {
        "path": "media/xY12ab.jpg",
        "url": "http://gnu-headless-cms.test/storage/media/xY12ab.jpg"
    }
}
```

Guarda `path` en `cover_image`. Usa `url` solo para la vista previa.

**Respuestas de Error Comunes**

**Error 404 — Artículo o sitio no encontrado** (también cuando el artículo es borrador o programado)

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "Recurso no encontrado" }
}
```

**Error 401 — Sin token o token expirado** (solo API admin)

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "No autenticado" }
}
```

**Error 422 — Validación.** Atención: **no usa la envoltura **`{data, meta}`, es el formato estándar de Laravel.

```json
{
    "message": "Ya existe un artículo con ese slug en este sitio.",
    "errors": {
        "slug": ["Ya existe un artículo con ese slug en este sitio."]
    }
}
```

#### Archivos involucrados

| Capa | Ruta | Descripción |
| --- | --- | --- |
| Migración | database/migrations/2026\_07\_28\_213407\_create\_blog\_posts\_table.php | Tabla `blog_posts`; único `[site_id, slug]`, índice `[site_id, published_at]` |
| Modelo | app/Models/BlogPost.php | Campos asignables, cast de `published_at`, scope `published()` |
| Modelo | app/Models/Site.php | Relación `blogPosts()` — punto de entrada del filtro por sitio |
| Rutas públicas | routes/public.php | `GET {site}/blog`, `GET {site}/blog/{postSlug}` |
| Rutas admin | routes/admin.php | `apiResource blog-posts` bajo `auth:api` |
| Controlador público | app/Http/Controllers/Public/BlogController.php | Listado paginado sin `body` y detalle con `body` |
| Controlador admin | app/Http/Controllers/Admin/BlogPostController.php | CRUD completo, filtro `?site=`, incluye borradores |
| Validación | app/Http/Requests/Admin/BlogPostRequest.php | Reglas, derivación del slug, mensajes en español |
| Validación | app/Http/Requests/Admin/UpdateSectionRequest.php | Esquema de `page_hero` (encabezado de la página de blog) |
| Controlador público | app/Http/Controllers/Public/PageController.php | Sirve la página `blog` con su `page_hero` |
| Controlador admin | app/Http/Controllers/Admin/MediaController.php | Subida de la imagen de portada |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Página `/blog`, su `page_hero` y los 4 artículos semilla |
| Factory | database/factories/BlogPostFactory.php | Estados `draft()` y `scheduled()` para pruebas |
| Pruebas | tests/Feature/BlogTest.php | 12 casos: visibilidad, slugs, CRUD, autenticación |
| Manejo de errores | bootstrap/app.php | Respuestas 401 y 404 en español para `api/*` |

**Nota para el front:** `gnu-vehicular` ya funciona a nivel de código, pero su blueprint aún no está sembrado, así que hoy no tiene página `/blog` ni artículos. Su listado responde `200` con `data: []`.
