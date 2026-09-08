# Quiénes somos \- Tectuus



*Página institucional editable desde el panel: historia, misión, visión y valores, con soporte para video e imágenes. Es la columna «Sobre nosotros» del árbol del cliente.*


## Flujo Simple

```
ADMIN                                    PÚBLICO
─────                                    ───────
PUT /api/admin/sections/{id}
⬇️
auth:api (JWT)
⬇️
UpdateSectionRequest
 · el `type` se lee del MODELO, nunca del payload
 · busca el type en SCHEMAS → si no está, 422
 · valida solo los campos editables del tipo
⬇️
array_merge(content_guardado, content_validado)   GET /api/public/tectuus/pages/sobre-nosotros
 · los campos `fijo` sobreviven al merge          ⬇️
⬇️                                                solo si is_published
sections.content (JSON)                           ⬇️
⬇️                                                secciones ordenadas por `position`
200 {status, data, meta.message}                  ⬇️
                                                  200 {slug, path, title, sections[]}
```

## Decisiones Clave de Implementación

**«¿Quiénes somos?» es una sección, no una página hija**

El árbol del cliente cuelga un solo nodo de la columna *Sobre nosotros*. Aplicando la regla 1 de clasificación de `gnu.md`: un hijo único que nombra el contenido de su columna **es el contenido de la cabeza de columna**, no una hija. Misma lectura que «Captación de leads» bajo *Contacto* en Traninn Logistic.

Resultado: la columna es **una página con tres secciones**, y `data.1.children` del menú viene vacío.

**El requisito de «imágenes y videos» aterriza en tipos que ya existían**

No hizo falta ningún tipo de sección nuevo:

```
// database/seeders/TectuusBlueprintSeeder.php
private function aboutUs(Site $site): void
{
    $about = $this->page($site, 'sobre-nosotros', '/sobre-nosotros', 'Sobre nosotros', 2);

    $this->section($site, $about, 'page_hero', 1, [
        'title' => '¿Quiénes somos?',
        'subtitle' => 'Historia, misión, visión y valores.',
        'image' => null,
    ]);

    // El video vive aquí: `video_url` es el único lugar del catálogo
    // donde aterriza el requisito transversal de video.
    $this->section($site, $about, 'rich_text', 2, [
        'title' => null,
        'body' => '<p>Contenido pendiente de redactar.</p>',
        'video_url' => null,
    ]);

    $this->section($site, $about, 'image_gallery', 3, [
        'title' => 'Nuestra empresa',
        'images' => [
            ['image' => 'media/placeholder-foto-1.jpg', 'caption' => null, 'alt' => null],
            ['image' => 'media/placeholder-foto-2.jpg', 'caption' => null, 'alt' => null],
        ],
    ]);
}
```

- **Video** → `video_url` de `rich_text`. No existe un tipo `video_embed`; está explícitamente descartado del catálogo.
- **Imágenes** → `image_gallery`, una colección donde el admin agrega, quita y reordena. No se resolvió incrustando `<img>` en el HTML del `rich_text` porque así no serían contenido gestionable: sin orden, sin `alt`, sin forma de quitar una sin editar HTML a mano.

**El **`type`** se lee del modelo, nunca del payload**

Es una de las cuatro prohibiciones del contrato de editabilidad aplicadas en código:

```js
// app/Http/Controllers/Admin/SectionController.php
public function update(UpdateSectionRequest $request, Section $section): JsonResponse
{
    $section->update([
        'content' => array_merge($section->content, $request->validated('content')),
    ]);
    // ...
}
```

`UpdateSectionRequest` nunca incluye `type` en sus reglas. Y el `array_merge` sobre el contenido guardado es lo que hace que los campos `fijo` sobrevivan: como están ausentes de las reglas de validación, se caen del payload y el valor previo se conserva.

**Las reglas de los dos tipos editados**

```
// app/Http/Requests/Admin/UpdateSectionRequest.php — SCHEMAS
'rich_text' => [
    'title' => ['nullable', 'string', 'max:255'],
    'body' => ['required', 'string'],
    'video_url' => ['nullable', 'url', 'max:2048'],   // valida que sea URL
],
'image_gallery' => [
    'title' => ['nullable', 'string', 'max:255'],
    'images' => ['present', 'array'],                 // `present`: puede venir vacío pero debe venir
    'images.*.image' => ['required', 'string', 'max:2048'],
    'images.*.caption' => ['nullable', 'string', 'max:255'],
    'images.*.alt' => ['nullable', 'string', 'max:255'],
],
```

`present` en la colección es deliberado: enviar `images: []` **vacía la galería**, pero omitir la clave es un error de validación. Así no se borra una colección por descuido.

**Lo que el admin NO puede hacer aquí**

| Prohibición | Dónde se aplica |
| --- | --- |
| Agregar o borrar secciones | `routes/admin.php`: `sections` es `only(['index','show','update'])` |
| Cambiar el `type` de una sección | `UpdateSectionRequest` nunca lo incluye en las reglas |
| Crear o borrar la página | `pages` es `only(['index','show','update'])` |
| Cambiar título o ruta de la página | `UpdatePageRequest` solo admite `is_published` |

## Configuración

Ninguna. Las imágenes se suben antes con `POST /api/admin/media`, que devuelve `{path, url}`; el `path` es lo que se guarda en los campos de tipo `media`.

## Implementación

**Estructura de la Petición**

```
Headers requeridos:
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

**Endpoint Principal** — editar el texto y el video

```
PUT /api/admin/sections/{id}
```

```json
{
    "content": {
        "title": "Nuestra historia",
        "body": "<p>Fundada en 2010 en Morelia, Tectuus provee equipo industrial...</p>",
        "video_url": "https://www.youtube.com/watch?v=abc123"
    }
}
```

**Respuesta Exitosa (HTTP 200)**

```json
{
    "status": "success",
    "data": {
        "id": 7,
        "site_id": 4,
        "page_id": 2,
        "type": "rich_text",
        "position": 2,
        "content": {
            "title": "Nuestra historia",
            "body": "<p>Fundada en 2010 en Morelia...</p>",
            "video_url": "https://www.youtube.com/watch?v=abc123"
        }
    },
    "meta": { "message": "Sección actualizada correctamente" }
}
```

**Reemplazar la galería**

```json
{
    "content": {
        "title": "Nuestras instalaciones",
        "images": [
            { "image": "media/planta.jpg", "caption": "Planta Morelia", "alt": "Vista de la planta" },
            { "image": "media/equipo.jpg", "caption": "Nuestro equipo", "alt": null }
        ]
    }
}
```

## Endpoints

**Consumo público de la página**

```
GET /api/public/tectuus/pages/sobre-nosotros
```

```html
{
    "status": "success",
    "data": {
        "slug": "sobre-nosotros",
        "path": "/sobre-nosotros",
        "title": "Sobre nosotros",
        "sections": [
            { "type": "page_hero", "content": { "title": "¿Quiénes somos?", "subtitle": "Historia, misión, visión y valores.", "image": null } },
            { "type": "rich_text", "content": { "title": "Nuestra historia", "body": "<p>...</p>", "video_url": "https://www.youtube.com/watch?v=abc123" } },
            { "type": "image_gallery", "content": { "title": "Nuestras instalaciones", "images": [ ... ] } }
        ]
    },
    "meta": { "site": "tectuus" }
}
```

Las secciones llegan **en orden de blueprint** (`position`). Si la página está despublicada, este endpoint responde 404.

**Endpoints Adicionales**

| Método | URI | Nota |
| --- | --- | --- |
| GET | `/api/admin/sections?site=tectuus&page=sobre-nosotros` | las 3 secciones de la página, con sus `id` |
| GET | `/api/admin/sections/{id}` | una sección |
| PUT/PATCH | `/api/admin/sections/{id}` | edita solo `content` |
| PUT | `/api/admin/pages/{id}` | `{"is_published": false}` — despublicar |
| GET | `/api/public/tectuus/menu` | el árbol; *Sobre nosotros* es `data.1`, con `children: []` |

**Respuestas de Error Comunes**

**Error 422 — **`video_url`** inválida**

```json
{
    "message": "El campo video url debe ser una URL válida.",
    "errors": { "content.video_url": ["El campo video url debe ser una URL válida."] }
}
```

**Error 422 — tipo de sección sin reglas** (no aplica a estos tres tipos; documenta el comportamiento cerrado por defecto)

```json
{
    "message": "El tipo de sección «X» aún no es editable desde el panel.",
    "errors": { "content": ["El tipo de sección «X» aún no es editable desde el panel."] }
}
```

**Error 404 — página despublicada en la API pública**

```json
{ "status": "error", "data": null, "meta": { "message": "No encontrado." } }
```
