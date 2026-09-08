# Sobre nosotros \- tipo image\_gallery y clientes con testimonio

*Siembra la segunda columna de navegación de *`traninn-logistic`* (4 páginas nuevas) e incorpora al catálogo lo único que faltaba para cubrirla: un tipo de sección nuevo para galerías de imágenes y tres campos nuevos en «Nuestros clientes». **Sin migraciones**: *`sections.type`* es un *`string`* libre y *`content`* es JSON, así que un tipo nuevo cuesta una entrada de validación y su renglón en el catálogo.*

## Flujo Simple

```
Paso 1: Clasificar los nodos del árbol del cliente
        (regla de gnu.md: ¿página, sección o fila de tabla?)
⬇️
Paso 2: Detectar qué requisitos NO cubre el catálogo actual
        → «imágenes» sueltas · descripción + testimonio por cliente
⬇️
Paso 3: Ampliar el catálogo — image_gallery (nuevo) y
        clients_showcase (+3 campos nullable)
⬇️
Paso 4: Declarar sus reglas en UpdateSectionRequest::SCHEMAS
        (sin este paso el tipo nace cerrado: 422 «aún no es editable»)
⬇️
Paso 5: TraninnLogisticBlueprintSeeder::aboutUs() siembra
        4 páginas + 13 secciones con valores placeholder
⬇️
Paso 6: El admin edita por PUT /api/admin/sections/{id}
        y el front consume GET /api/public/traninn-logistic/pages/{slug}
```

---

## Decisiones Clave de Implementación

### 1. Clasificación de los cuatro nodos — la regla decidió, no el criterio

El árbol del cliente lista cuatro hijos bajo *Sobre nosotros*. La regla de `gnu.md` («Clasificación de los nodos del árbol original») los separa sin ambigüedad:

| nodo | resultado | regla aplicada |
| --- | --- | --- |
| ¿Qué hacemos? | **página** | Regla 3: todo hijo fuera de *Inicio* / *Contacto* es página |
| Propósito empresarial | **página** | ídem |
| Nuestra historia | **página** | ídem |
| Nuestros clientes | **sección** de `/sobre-nosotros` | **Excepción** de la regla 3: su nombre coincide con un tipo del catálogo |

La excepción no es nueva: es el mismo caso del nodo homónimo bajo *Nuestros servicios* en `gnu` (GnuBlueprintSeeder.php:152). Clasificar por nombre falla en general, pero aquí el nombre *es* la excepción documentada.

### 2. `image_gallery` — tipo genérico nuevo

El cliente pidió «imágenes» aparte de los banners en tres páginas. No había tipo que lo cubriera: una imagen suelta solo cabía incrustada a mano en el HTML de `rich_text`, sin `alt`, sin orden y sin forma de quitarla sin editar etiquetas.

```
// app/Http/Requests/Admin/UpdateSectionRequest.php
'image_gallery' => [
    'title' => ['nullable', 'string', 'max:255'],
    'images' => ['present', 'array'],
    'images.*.image' => ['required', 'string', 'max:2048'],
    'images.*.caption' => ['nullable', 'string', 'max:255'],
    'images.*.alt' => ['nullable', 'string', 'max:255'],
],
```

**Sin **`layout`** ni **`columns`**.** Cómo se acomoda la rejilla es decisión del front-end, no contenido — el mismo criterio con el que se descartó `autoplay_seconds` en `banner_carousel` y `position` en `whatsapp_button`.

Se ubicó entre los **tipos genéricos** (junto a `page_hero`, `rich_text` y `feature_grid`), no como tipo exclusivo de un sitio: cualquier sitio puede usarlo.

### 3. `clients_showcase` extendido con tres campos nullable

El requisito era *«imágenes, título y descripción de nuestros clientes, además de un pequeño testimonial de cada uno»*. El tipo guardaba solo `image`, `name` y `url`.

```
// Tres campos nuevos dentro de cada ítem de logos[]
'logos.*.description' => ['nullable', 'string', 'max:1000'],
'logos.*.quote' => ['nullable', 'string', 'max:2000'],
'logos.*.quote_author' => ['nullable', 'string', 'max:255'],
```

Tres decisiones detrás de eso:

- **Nullable, no un tipo nuevo.** Es literalmente el mecanismo que prescribe el spec en «Prohibido: overrides por página»: *«Si un campo aplica en una página y no en otra, el campo es nullable en el tipo y esa instancia lo deja vacío.»* Las dos instancias de `gnu` siguen válidas sin esas claves.
- **El testimonio va dentro del cliente**, no en una sección `testimonials` aparte. Con dos secciones separadas el front tendría que adivinar qué testimonio corresponde a qué logo (¿por orden? ¿por nombre?). `testimonials` sigue existiendo para los testimonios que no pertenecen a un cliente del muro.
- **Se conserva la clave **`logos[]` aunque ahora cargue más que un logo: renombrarla obligaría a migrar el JSON ya sembrado de `gnu` sin ganar nada.

### 4. Cero migraciones

Verificado antes de planear: la tabla `sections` declara `$table->string('type')` — sin `enum` ni `check`— y `$table->json('content')`. Un tipo nuevo y campos nuevos dentro del JSON **no tocan el esquema**. El costo real fue la entrada en `SCHEMAS` (sin ella el tipo nace cerrado y responde *«El tipo de sección «image\_gallery» aún no es editable desde el panel»*) y su renglón en el catálogo.

### 5. `page_hero` **junto con** `banner_carousel` en las páginas hijas

Es la primera vez en el proyecto que una página interior lleva carrusel, así que quedó anotado en el código y en el blueprint para que no se lea como contradicción:

```
// On an inner page the carousel is a content block, not the hero: the
// «carousel is the hero» rule applies only to `/`, which carries no
// `page_hero` at all.
$this->section($site, $whatWeDo, 'banner_carousel', 2, $this->banners('Transporte de GNC'));
```

### 6. El seeder reusa el base extraído en el commit anterior

`aboutUs()` no redefine nada: usa `page()` y `section()` heredados de BlueprintSeeder.php. Se sumaron tres helpers privados y chicos — `body()`, `banners()` y `gallery()` — porque la forma se repite entre las tres páginas hijas.

---

## Configuración

Ninguna variable de entorno nueva, **ninguna migración**. Para aplicar el commit:

```
# Idempotente: re-sembrar no duplica filas (updateOrCreate por site+slug y site+page+type)
php artisan db:seed --class=TraninnLogisticBlueprintSeeder

# O reconstruir todo
php artisan migrate:fresh --seed
```

---

## Implementación

### Mapa de páginas sembrado

| # | ruta | título | padre | pos | secciones (en orden) |
| --- | --- | --- | --- | --- | --- |
| 2 | `/sobre-nosotros` | Sobre nosotros | — | 3 | `page_hero`, `rich_text`, `clients_showcase` |
| 3 | `/sobre-nosotros/que-hacemos` | ¿Qué hacemos? | `/sobre-nosotros` | 1 | `page_hero`, `banner_carousel`, `rich_text`, `image_gallery` |
| 4 | `/sobre-nosotros/proposito-empresarial` | Propósito empresarial | `/sobre-nosotros` | 2 | `page_hero`, `rich_text`, `image_gallery` |
| 5 | `/sobre-nosotros/nuestra-historia` | Nuestra historia | `/sobre-nosotros` | 3 | `page_hero`, `banner_carousel`, `rich_text`, `image_gallery` |

`pos = 3` en la cabeza de columna respeta el orden de navegación del sitio: Inicio (1), Nuestros servicios (2), **Sobre nosotros (3)**, Contacto (4), Ubicaciones (5). Las columnas 2, 4 y 5 no están sembradas y el menú público simplemente las omite.

**Total: 4 páginas y 13 secciones nuevas.** Ninguna página repite un tipo, así que sigue sin hacer falta la columna `key` en `sections`.

### Campos que gestiona el admin, por sección nueva

| tipo | campos editables | fijos |
| --- | --- | --- |
| `page_hero` | `title`, `subtitle`, `image` | — |
| `banner_carousel` | `slides[]` → `image`, `title`, `subtitle`, `link_url`, `link_label` | — |
| `rich_text` | `title`, `body` (HTML), `video_url` | — |
| `image_gallery` | `title`, `images[]` → `image`, `caption`, `alt` | — |
| `clients_showcase` | `title`, `logos[]` → `image`, `name`, `url`, `description`, `quote`, `quote_author` | — |

### Estructura de la petición

```
Headers requeridos:
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## Endpoints

Ningún endpoint nuevo. Los existentes ahora sirven la columna:

### Descubrir los IDs de sección

```
GET /api/admin/sections?site=traninn-logistic&page=que-hacemos
```

### Editar una galería de imágenes

```
PUT /api/admin/sections/{id}
```

```json
{
  "content": {
    "title": "Nuestra flota",
    "images": [
      { "image": "media/flota-1.jpg", "caption": "Unidad de GNC", "alt": "Tracto con cisterna" },
      { "image": "media/flota-2.jpg", "caption": null, "alt": null },
      { "image": "media/flota-3.jpg", "caption": "Patio de maniobras", "alt": null }
    ]
  }
}
```

**Respuesta exitosa (HTTP 200)**

```json
{
  "status": "success",
  "data": {
    "id": 104,
    "type": "image_gallery",
    "position": 4,
    "content": {
      "title": "Nuestra flota",
      "images": [
        { "image": "media/flota-1.jpg", "caption": "Unidad de GNC", "alt": "Tracto con cisterna" },
        { "image": "media/flota-2.jpg", "caption": null, "alt": null },
        { "image": "media/flota-3.jpg", "caption": "Patio de maniobras", "alt": null }
      ]
    }
  },
  "meta": { "message": "Sección actualizada correctamente" }
}
```

> ⚠️ El merge de `SectionController@update` es **superficial**: la colección se manda completa en cada `PUT`. Para quitar una imagen, se envía el array sin ella. El orden del array es el orden en pantalla.

Las rutas de `image` salen de `POST /api/admin/media` (multipart), que ya existía.

### Editar «Nuestros clientes» con descripción y testimonio

```
PUT /api/admin/sections/{id}
```

```json
{
  "content": {
    "title": "Nuestros clientes",
    "logos": [
      {
        "image": "media/cliente-uno.png",
        "name": "Cliente Uno",
        "url": "https://cliente-uno.mx",
        "description": "Transportamos su gas natural desde 2021.",
        "quote": "Nunca hemos parado la planta por falta de suministro.",
        "quote_author": "Jefe de operaciones"
      }
    ]
  }
}
```

> El sitio lleva **dos** `clients_showcase` — `/` y `/sobre-nosotros` — y cada instancia guarda sus propios valores. Editar una no toca la otra; hay un test que lo verifica.

### Consultar desde el front

```
GET /api/public/traninn-logistic/menu
GET /api/public/traninn-logistic/pages/sobre-nosotros
GET /api/public/traninn-logistic/pages/que-hacemos
GET /api/public/traninn-logistic/pages/proposito-empresarial
GET /api/public/traninn-logistic/pages/nuestra-historia
```

### Respuestas de error comunes

**422 — imagen de galería sin archivo**

```json
{
  "message": "El campo content.images.0.image es obligatorio.",
  "errors": { "content.images.0.image": ["El campo content.images.0.image es obligatorio."] }
}
```

**422 — tipo sin reglas declaradas** (el mecanismo de «cerrado por defecto» que este commit desactiva para `image_gallery`)

```json
{
  "message": "El tipo de sección «X» aún no es editable desde el panel.",
  "errors": { "content": ["El tipo de sección «X» aún no es editable desde el panel."] }
}
```

**401 — sin token**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

---

## Pruebas incluidas

`tests/Feature/TraninnAboutTest.php` — 6 tests nuevos:

| Test | Qué protege |
| --- | --- |
| `lists the about column with its three child pages in the menu` | La columna y sus 3 hijas en orden, y que el menú omita las columnas sin sembrar |
| `carries the clients showcase as a section of the column head` | Que *Nuestros clientes* sea sección y no una cuarta página |
| `returns the child pages with their sections in blueprint order` | El orden de secciones de las 3 páginas hijas |
| `replaces the images of a gallery through the admin API` | Que el admin reemplace la colección de imágenes |
| `rejects a gallery image without a file` | Que `images.*.image` sea obligatorio (422) |
| `stores a description and a testimonial per client…` | Los 3 campos nuevos, y que la instancia de la portada **no** se toque |

`tests/Feature/TraninnHomeTest.php` — ajuste obligado: al existir dos `clients_showcase`, el helper `traninnSection()` dejó de ser inequívoco y ganó el parámetro opcional de página, copiando `vehicularSection()` de VehicularHomeTest.php:23.

```
function traninnSection(string $type, ?string $pageSlug = null): Section
```

**Suite completa: 165 tests, 693 aserciones, todos verdes** (eran 159 antes del commit). Pint sin observaciones. Se corrió la suite entera y no solo el filtro, porque `clients_showcase` es un tipo compartido con `gnu`.

---

## Archivos involucrados

| Capa | Archivo | Cambio |
| --- | --- | --- |
| Validación | `app/Http/Requests/Admin/UpdateSectionRequest.php` | +14 líneas: entrada `image_gallery` en `SCHEMAS` y 3 reglas nullable en `clients_showcase` |
| Seeder | `database/seeders/TraninnLogisticBlueprintSeeder.php` | +169 líneas: método `aboutUs()` y helpers `body()`, `banners()`, `gallery()` |
| Test | `tests/Feature/TraninnAboutTest.php` | **Nuevo** — 6 tests feature |
| Test | `tests/Feature/TraninnHomeTest.php` | Helper `traninnSection()` con filtro por página |
| Doc / catálogo | `.claude/skills/sitios-web-gnu/references/section-types.md` | Tabla de `image_gallery` y 3 filas nuevas en `clients_showcase`, cada una con su motivo |
| Doc / índice | `.claude/skills/sitios-web-gnu/SKILL.md` | `image_gallery` en el índice de tipos genéricos |
| Doc / blueprint | `.claude/skills/sitios-web-gnu/references/traninn-logistic.md` | Mapa de páginas con 4 filas nuevas, «2 de 5 columnas» y 4 notas de lectura |
| Doc / estado | `.claude/skills/sitios-web-gnu/references/implementation-status.md` | `image_gallery` en la tabla (14 tipos editables), `clients_showcase` actualizado |
| Doc / estado | `.claude/skills/cms-gnu-backend/references/functionality-map.md` | Fila 18: 1 → **2 de 5 columnas**; tests 159 → 165 |
