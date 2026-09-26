# Testimoniales, video en la portada,  biblioteca de medios

---


---


# Bloque 1 — Sección `testimonials` editable

*Habilita la edición de los testimonios de clientes desde el panel. Es una sección **global** del sitio (*`page_id = null`*): en el mapa del cliente aparece fuera de las columnas de navegación, así que aplica a todo el sitio y no a una página. Cierra el último tipo del catálogo que el panel rechazaba.*

## Flujo Simple

```css
Admin envía PUT /api/admin/sections/{id} con content.items[]
⬇️
Middleware auth:api valida el JWT
⬇️
UpdateSectionRequest lee el `type` de la sección YA CARGADA (nunca del payload)
⬇️
Busca 'testimonials' en SCHEMAS → existe → aplica sus reglas
⬇️
SectionController@update hace array_merge(content guardado, content validado)
⬇️
Respuesta {status, data, meta} con la sección fresca
```

## Decisiones Clave de Implementación

**Las reglas se declaran en **`SCHEMAS`**, no en un método**

El `type` nunca se acepta del cliente: se lee del modelo resuelto por route binding. Un tipo sin entrada en `SCHEMAS` se rechaza — cerrado por defecto.

```
// app/Http/Requests/Admin/UpdateSectionRequest.php
'testimonials' => [
    'title' => ['nullable', 'string', 'max:255'],
    'items' => ['present', 'array'],          // 'present' permite vaciar la colección
    'items.*.quote' => ['required', 'string', 'max:2000'],
    'items.*.author' => ['required', 'string', 'max:255'],
    'items.*.role' => ['nullable', 'string', 'max:255'],
    'items.*.photo' => ['nullable', 'string', 'max:2048'],
],
```

`items` usa `present` en lugar de `required` para que el admin pueda dejar la colección vacía sin que la validación lo bloquee. `quote` y `author` son obligatorios por ítem: un testimonio sin autor no es publicable.

**Sembrada como global, con posición 4**

```js
// database/seeders/GnuBlueprintSeeder.php — $page es null ⇒ sección global
$this->section($site, null, 'testimonials', 4, [
    'title' => 'Lo que dicen nuestros clientes',
    'items' => [
        ['quote' => 'Pendiente de redactar.', 'author' => 'Cliente de ejemplo', 'role' => null, 'photo' => null],
    ],
]);
```

El helper `section()` hace `updateOrCreate` por `(page_id, type)`, así que el seeder sigue siendo idempotente: volver a correrlo no duplica la fila.

## Implementación

**Estructura de la Petición**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Endpoint Principal**

```
PUT /api/admin/sections/{id}
```

**Ejemplo de Petición**

```json
{
    "content": {
        "title": "Testimonios",
        "items": [
            { "quote": "Bajamos el costo de combustible.", "author": "Ana Ruiz", "role": "Directora" },
            { "quote": "Excelente servicio.", "author": "Luis Mora" }
        ]
    }
}
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": {
        "id": 50,
        "type": "testimonials",
        "page_id": null,
        "content": { "title": "Testimonios", "items": [ "…" ] }
    },
    "meta": { "message": "Sección actualizada correctamente" }
}
```

**Error 422 — Testimonio sin autor**

```json
{
    "message": "El campo content.items.0.author es obligatorio.",
    "errors": { "content.items.0.author": ["El campo content.items.0.author es obligatorio."] }
}
```

## Endpoints

**Lectura pública (el front la consume junto al resto de las globales)**

```
GET /api/public/{site}/globals
```

```json
{
    "status": "success",
    "data": {
        "contact_info": { "…": "…" },
        "social_icons": { "…": "…" },
        "whatsapp_button": { "…": "…" },
        "testimonials": { "title": "Testimonios", "items": [ "…" ] }
    },
    "meta": { "site": "gnu" }
}
```

## Archivos involucrados

| Capa | Ruta | Rol |
| --- | --- | --- |
| Validación | app/Http/Requests/Admin/UpdateSectionRequest.php | Entrada `testimonials` en `SCHEMAS` |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Siembra la sección global, posición 4 |
| Pruebas | tests/Feature/HomeContentTest.php | `replaces the testimonials through the admin API`, `rejects a testimonial without an author` |

---

# Bloque 2 — Bloque de video en la portada

*Aterriza el requisito transversal «soporte para videos» en la página de inicio. No existe un tipo *`video_embed`*: el video vive en *`rich_text.video_url`*, y *`/`* no llevaba ningún *`rich_text`*, así que la página más visitada del sitio no tenía dónde alojar uno.*

## Flujo Simple

```
Seeder inserta rich_text en / con position = 3
⬇️
clients_showcase y lead_capture_form se recorren a 4 y 5
⬇️
Admin envía PUT /api/admin/sections/{id} con body + video_url
⬇️
UpdateSectionRequest valida video_url con la regla 'url'
⬇️
GET /api/public/gnu/pages/inicio devuelve 5 secciones en orden
```

## Decisiones Clave de Implementación

**La sección se inserta y las posteriores se recorren en el mismo seeder**

```
// database/seeders/GnuBlueprintSeeder.php
$this->section($site, $home, 'rich_text', 3, [
    'title' => null,
    'body' => '<p>Contenido pendiente de redactar.</p>',
    'video_url' => null,
]);

$this->section($site, $home, 'clients_showcase', 4, [ /* … */ ]);  // era 3
$this->section($site, $home, 'lead_capture_form', 5, [ /* … */ ]); // era 4
```

**Sin migración ni comando de reordenamiento.** El helper `section()` pasa `position` en el array de *update* de `updateOrCreate`, así que volver a correr el seeder **corrige las posiciones de las filas ya existentes** en lugar de crear duplicados. Verificado contra la base real: `banner_carousel(1), savings_simulator(2), rich_text(3), clients_showcase(4), lead_capture_form(5)`.

**El helper de pruebas necesitó alcance por página**

`rich_text` pasó de 11 a 12 instancias en el sitio, así que buscarlo solo por tipo devolvía una arbitraria:

```
// tests/Feature/HomeContentTest.php
function sectionOfType(string $type, ?string $pageSlug = null): Section
{
    return Site::where('slug', 'gnu')->firstOrFail()
        ->sections()
        ->where('type', $type)
        ->when(
            $pageSlug !== null,
            fn ($query) => $query->whereHas('page', fn ($page) => $page->where('slug', $pageSlug)),
        )
        ->firstOrFail();
}
```

El parámetro es opcional para no tocar las llamadas existentes de los tipos únicos (`banner_carousel`, `lead_capture_form`, `savings_simulator`, `contact_info`).

## Implementación

**Endpoint Principal**

```
PUT /api/admin/sections/{id}
```

**Ejemplo de Petición**

```json
{
    "content": {
        "body": "<p>Conoce nuestra operación.</p>",
        "video_url": "https://www.youtube.com/watch?v=abc123"
    }
}
```

`video_url` acepta cualquier URL válida (`max:2048`) — no se restringe el proveedor. `body` es obligatorio; una sección de solo video se guarda con un `body` mínimo.

## Endpoints

**Lectura pública de la portada**

```
GET /api/public/{site}/pages/inicio
```

```json
{
    "status": "success",
    "data": {
        "slug": "inicio",
        "path": "/",
        "title": "Inicio",
        "sections": [
            { "type": "banner_carousel",   "content": { "…": "…" } },
            { "type": "savings_simulator", "content": { "…": "…" } },
            { "type": "rich_text",         "content": { "body": "…", "video_url": "…" } },
            { "type": "clients_showcase",  "content": { "…": "…" } },
            { "type": "lead_capture_form", "content": { "…": "…" } }
        ]
    },
    "meta": { "site": "gnu" }
}
```

## Archivos involucrados

| Capa | Ruta | Rol |
| --- | --- | --- |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Inserta el `rich_text` y recorre las posiciones 4 y 5 |
| Pruebas | tests/Feature/HomeContentTest.php | Helper `sectionOfType()` con alcance por página, orden de las 5 secciones, `stores a video url on the home page rich text` |

---

# Bloque 3 — Biblioteca de media

*Convierte los 4 stubs del *`MediaController`* en una biblioteca real de imágenes: listar y borrar, sobre la carpeta *`media`* del disco *`public`*. **Sin tabla ***`media`* — los únicos metadatos que hoy se necesitan (nombre y URL) salen del disco.*

## Flujo Simple

```
Admin sube imagen  →  POST /api/admin/media (multipart, campo `file`)
⬇️
Valida image|max:5120 y guarda en media/ del disco public
⬇️
Devuelve {path, url} 201 — el `path` es lo que se guarda en el JSON de la sección
⬇️
Admin lista  →  GET /api/admin/media  (lee el disco, más reciente primero)
⬇️
Admin borra  →  DELETE /api/admin/media/{nombre}
⬇️
basename() confina la ruta a media/ → abort_unless(exists) → delete
```

## Decisiones Clave de Implementación

`index`** lee el disco, no una tabla**

```js
public function index(): JsonResponse
{
    $disk = Storage::disk('public');

    $files = collect($disk->files('media'))
        ->sortByDesc(fn (string $path) => $disk->lastModified($path))  // más reciente primero
        ->map(fn (string $path) => [
            'path' => $path,
            'name' => basename($path),
            'url' => $disk->url($path),
        ])
        ->values();  // reindexa: sortByDesc conserva las claves originales

    return response()->json([
        'status' => 'success',
        'data' => $files,
        'meta' => ['total' => $files->count()],
    ]);
}
```

`->values()` es necesario: `sortByDesc` preserva las claves, y sin reindexar el JSON saldría como objeto (`{"2":…}`) en vez de arreglo.

`destroy`** recibe el nombre del archivo, no un id**

```js
public function destroy(string $medium): JsonResponse
{
    $path = 'media/'.basename($medium);

    abort_unless(Storage::disk('public')->exists($path), 404);

    Storage::disk('public')->delete($path);

    return response()->json([
        'status' => 'success',
        'data' => null,
        'meta' => ['message' => 'Archivo eliminado correctamente'],
    ]);
}
```

**Sobre el path traversal, con una corrección importante.** Escribí primero el comentario diciendo que `basename()` era la protección. Al verificarlo con un probe descubrí que **el router hace 404 antes de llegar al controlador**: `{medium}` matchea un solo segmento de ruta, así que `..%2Fsecreto.txt` nunca ejecuta la acción. El probe lo demostró — el archivo objetivo dentro de `media/` no se borró, señal de que `basename()` jamás corrió. El `basename()` se conserva como segunda línea de defensa y el comentario dice eso, no más.

El `abort_unless(…, 404)` aprovecha el handler de `NotFoundHttpException` en `bootstrap/app.php`, que ya devuelve el envelope en español — no hace falta formatear el error aquí.

`show`** y **`update`** se eliminaron**

Un archivo no tiene detalle que mostrar ni nada que parchear. Dejar stubs que devuelven `null` es peor que no tener la ruta:

```
// routes/admin.php
Route::apiResource('media', MediaController::class)->only(['index', 'store', 'destroy']);
```

Consistente con `pages`, `sections` y `leads`, que ya declaran su `only()`. La superficie de API bajó de **50 a 48 rutas**.

## Configuración

- `php artisan storage:link` es obligatorio para que las URLs resuelvan. Verificado: el symlink `public/storage` ya existe en este entorno.
- `filesystems.disks.public.url` → `http://gnu-headless-cms.test/storage` (lo sirve Laravel Herd).
- Límite de subida: `5120` KB (5 MB) y solo imágenes, en la regla `image|max:5120`.
- **Sin migración ni variables de entorno nuevas.**

## Implementación

**Estructura de la Petición (subida)**

```
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binario, imagen, máx. 5 MB)
```

## Endpoints

**Subir una imagen**

```
POST /api/admin/media
```

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": {
        "path": "media/9xKq2fT.jpg",
        "url": "http://gnu-headless-cms.test/storage/media/9xKq2fT.jpg"
    },
    "meta": { "message": "Archivo subido correctamente" }
}
```

**Listar imágenes**

```
GET /api/admin/media
```

```json
{
    "status": "success",
    "data": [
        {
            "path": "media/9xKq2fT.jpg",
            "name": "9xKq2fT.jpg",
            "url": "http://gnu-headless-cms.test/storage/media/9xKq2fT.jpg"
        }
    ],
    "meta": { "total": 1 }
}
```

**Eliminar una imagen**

```
DELETE /api/admin/media/{nombre}
```

```json
{
    "status": "success",
    "data": null,
    "meta": { "message": "Archivo eliminado correctamente" }
}
```

**Respuestas de Error Comunes**

**Error 404 — Archivo inexistente o traversal rechazado**

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

**Error 401 — Sin token**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

**Error 405 — **`show`** / **`update`** ya no existen**

```
GET /api/admin/media/{nombre}   → 405 Method Not Allowed
PUT /api/admin/media/{nombre}   → 405 Method Not Allowed
```

## Archivos involucrados

| Capa | Ruta | Rol |
| --- | --- | --- |
| Controlador | app/Http/Controllers/Admin/MediaController.php | `index` y `destroy` reales; `show` y `update` eliminados |
| Rutas | routes/admin.php | `only(['index','store','destroy'])` |
| Pruebas | tests/Feature/HomeContentTest.php | 5 tests: listar/borrar, 404, traversal, 405, 401 |

---
