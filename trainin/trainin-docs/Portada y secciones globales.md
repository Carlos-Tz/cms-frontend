# Portada y secciones globales



*Siembra la columna «Inicio» del sitio *`traninn-logistic`* y sus secciones globales, para que el administrador pueda gestionar el contenido de la portada. Extrae además el seeder base compartido por los tres sitios. **No hay código nuevo de backend**: los controladores y las reglas de validación ya cubrían los cinco tipos de sección que lleva esa portada.*


---

---

## Flujo Simple

```
Paso 1: Blueprint en markdown (references/traninn-logistic.md)
        define qué páginas y qué secciones lleva el sitio
⬇️
Paso 2: TraninnLogisticBlueprintSeeder traduce ese blueprint a filas
        (sites → pages → sections) con valores placeholder
⬇️
Paso 3: El admin lista y edita las secciones
        GET/PUT /api/admin/sections  (JWT, guard `api`)
⬇️
Paso 4: UpdateSectionRequest valida contra SCHEMAS por `type`
        y descarta los campos `fijo` del payload
⬇️
Paso 5: array_merge sobre sections.content — lo editable se reemplaza,
        lo fijo se conserva
⬇️
Paso 6: El front consume la portada ya publicada
        GET /api/public/traninn-logistic/pages/inicio
```

---

## Decisiones Clave de Implementación

### 1. La portada es dato, no código

El hallazgo que define el tamaño del commit: los cinco tipos de la portada (`banner_carousel`, `savings_simulator`, `rich_text`, `clients_showcase`, `lead_capture_form`) ya tenían reglas en `UpdateSectionRequest::SCHEMAS`, y todos los controladores filtran genéricamente por `site_id`. **Migrar una columna es sembrar datos.** Por eso el commit no toca ni un controlador, ni una ruta, ni una migración.

### 2. `BlueprintSeeder` — seeder base abstracto (archivo nuevo)

Salda una deuda que estaba marcada explícitamente en el código:

```
// Antes, en GnuVehicularBlueprintSeeder.php:
// ponytail: duplicated from GnuBlueprintSeeder. Extract a base seeder when
// the third site lands — two copies do not pay for an abstraction yet.
```

Traninn es el tercer sitio, así que se extrajo. Suben **solo los dos helpers idénticos** en los tres seeders; el resto (`body()`, `cards()`, `leadForm()`, `map()`, `fuelPrices()`, `posts()`, `stations()`) diverge entre sitios y se queda en cada subclase.

```js
abstract class BlueprintSeeder extends Seeder
{
    /**
     * Upsert de una página por (sitio, slug). `position` ordena la columna de navegación.
     * Idempotente: re-ejecutar el seeder no duplica filas.
     */
    protected function page(
        Site $site,
        string $slug,
        string $path,
        string $title,
        int $position,
        ?Page $parent = null,
    ): Page {
        return Page::updateOrCreate(
            ['site_id' => $site->id, 'slug' => $slug],
            [
                'parent_id' => $parent?->id,
                'path' => $path,
                'title' => $title,
                'position' => $position,
                'is_published' => true,
            ],
        );
    }

    /**
     * Upsert de una sección por (sitio, página, tipo).
     * `$page = null` produce una sección global (page_id = null).
     */
    protected function section(Site $site, ?Page $page, string $type, int $position, array $content): void
    {
        $site->sections()->updateOrCreate(
            ['page_id' => $page?->id, 'type' => $type],
            ['position' => $position, 'content' => $content],
        );
    }
}
```

`GnuBlueprintSeeder` y `GnuVehicularBlueprintSeeder` pasaron de `extends Seeder` a `extends BlueprintSeeder` y borraron sus copias privadas: **−83 líneas** entre ambos, sin cambio de comportamiento.

### 3. Clasificación página vs. sección

El árbol que entregó el cliente mezcla páginas y bloques sin marcarlos. Se aplicó la misma regla que en `gnu`: **bajo *****Inicio***** y *****Contacto*****, los hijos son contenido de la página, no páginas hijas.**

```
Árbol del cliente          →   Blueprint
─────────────────────────      ──────────────────────────────
Inicio                     →   página `/` (inicio)
├── Carrusel de banners    →   sección `banner_carousel`   pos 1
├── Simulador de ahorro    →   sección `savings_simulator` pos 2
├── Nuestros clientes      →   sección `clients_showcase`  pos 4
└── Contacto               →   sección `lead_capture_form` pos 5
```

Consecuencia: el «Contacto» de la portada **no** es la columna *Contacto* del menú. Son dos cosas distintas con el mismo nombre.

### 4. La portada no lleva `page_hero`

Igual que en `gnu` y `gnu-vehicular`: el `banner_carousel` es el hero de `/`. Es una regla del catálogo de tipos, no una omisión.

### 5. El `rich_text` que no está en el árbol

El cliente declaró «soporte para videos» en *Requisitos principales*, no en el árbol de navegación. `video_url` de `rich_text` es el único lugar del catálogo donde ese requisito aterriza (no existe un tipo `video_embed`), así que la portada lleva un `rich_text` en la posición 3.

```
// Carries the home page video: `video_url` is where the blueprint's
// «soporte para videos» requirement lands, and `rich_text` is the only
// type that has it. Same criterion as the institutional site.
$this->section($site, $home, 'rich_text', 3, [
    'title' => null,
    'body' => '<p>Contenido pendiente de redactar.</p>',
    'video_url' => null,
]);
```

### 6. Precios propios del simulador

Cada instancia de `savings_simulator` guarda sus propios precios de referencia. Traninn vende **flete**, no conversiones vehiculares, así que su precio base difiere del de los otros dos sitios:

```js
$this->section($site, $home, 'savings_simulator', 2, [
    'title' => 'Simulador de ahorro',
    'intro' => 'Compara el costo de tu combustible actual contra el gas natural.',
    'fuel_prices' => [
        // La fila `gas-natural` es la base de todo comparativo: factor 1.
        ['fuel' => 'gas-natural', 'label' => 'Gas natural comprimido',
         'price_per_unit' => 12.80, 'unit' => 'm³',    'equivalence_factor' => 1],
        ['fuel' => 'diesel',      'label' => 'Diésel',
         'price_per_unit' => 26.40, 'unit' => 'litro', 'equivalence_factor' => 0.95],
        ['fuel' => 'gasolina',    'label' => 'Gasolina',
         'price_per_unit' => 24.90, 'unit' => 'litro', 'equivalence_factor' => 0.84],
    ],
]);
```

Como es la **única** instancia del sitio, el endpoint público la resuelve sin el parámetro `?page=`.

### 7. `fields[]` del formulario, bloqueado

```js
$this->section($site, $home, 'lead_capture_form', 5, [
    'title' => 'Contacto',
    'intro' => 'Déjanos tus datos y un asesor se comunicará contigo.',
    'submit_label' => 'Enviar',
    // Locked: the four core entries map to columns of `leads`, and this
    // form declares no extras, so it accepts nothing beyond them.
    'fields' => ['name', 'email', 'phone', 'message'],
]);
```

El bloqueo no se implementó aquí: es un efecto del diseño existente. `fields` **no aparece** en `UpdateSectionRequest::SCHEMAS['lead_capture_form']`, así que se cae del payload validado y el `array_merge` del controlador conserva el valor sembrado. Está bloqueado porque `POST /api/public/{site}/leads` valida los envíos contra esa declaración: si el admin anunciara un campo que el backend rechaza, el formulario quedaría roto en silencio.

### 8. Lo que este sitio **no** lleva

| Ausencia | Motivo |
| --- | --- |
| `stations_map` y filas de `stations` | *Ubicaciones* no declara mapa interactivo en el spec |
| `blog_posts` y página `/blog` | El sitio no tiene blog (tabla comparativa de `SKILL.md`) |
| `testimonials` | Tipo declarado solo para `gnu` y `gnu-vehicular` |

> ⚠️ **Vigencia (2026-09-07).** Las tres ausencias eran ciertas *en este commit* y ya no lo son:
> - `stations_map` + 2 filas de `stations` se sembraron en *Nuestros servicios y Ubicaciones*.
> - El blog **sí** existe: `GET /blog` y `GET /blog/{slug}` responden con entradas.
> - Los testimonios llegaron **dentro de **`clients_showcase` (`description`, `quote`, `quote_author`), no como tipo `testimonials` — ver *Sobre nosotros*.
>
> Se anota aquí en vez de reescribir la tabla: el documento narra un commit.

---

## Configuración

Ninguna variable de entorno nueva. Para aplicar el commit en un entorno existente:

```
# Opción A — sembrar solo el sitio nuevo (idempotente, no toca los otros dos)
php artisan db:seed --class=TraninnLogisticBlueprintSeeder

# Opción B — reconstruir toda la base
php artisan migrate:fresh --seed
```

El seeder quedó registrado en `DatabaseSeeder`, después de los dos sitios ya existentes:

```
$this->call([
    AdminUserSeeder::class,
    GnuBlueprintSeeder::class,
    GnuVehicularBlueprintSeeder::class,
    TraninnLogisticBlueprintSeeder::class,   // ← nuevo
]);
```

---

## Implementación

### Lo que quedó sembrado

**Página** — `/` (slug `inicio`), posición 1, publicada:

| pos | tipo | campos editables | campos fijos |
| --- | --- | --- | --- |
| 1 | `banner_carousel` | `slides[]` → `image`, `title`, `subtitle`, `link_url`, `link_label` | — |
| 2 | `savings_simulator` | `title`, `intro`, `fuel_prices[]` | — |
| 3 | `rich_text` | `title`, `body`, `video_url` | — |
| 4 | `clients_showcase` | `title`, `logos[]` → `image`, `name`, `url` (+ `description`, `quote`, `quote_author` desde el commit de *Sobre nosotros*) | — |
| 5 | `lead_capture_form` | `title`, `intro`, `submit_label` | `fields[]` |

**Secciones globales** (`page_id = null`), servidas por `GET /api/public/traninn-logistic/globals`:

| pos | tipo | campos editables | campos fijos |
| --- | --- | --- | --- |
| 1 | `contact_info` | `address`, `phone`, `email`, `schedule`, `additional_info` | — |
| 2 | `social_icons` | `networks[].url`, y qué redes se muestran | `networks[].network` |
| 3 | `whatsapp_button` | `phone`, `prefilled_message` | — |

### Estructura de la petición (API admin)

```
Headers requeridos:
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

El token sale de `POST /api/admin/auth/login`.

### Envelope de respuesta del proyecto

Tres claves, no las del template genérico:

```json
{ "status": "success", "data": {}, "meta": { "message": "…" } }
```

---

## Endpoints

Ninguno nuevo. Los que ahora responden con datos de `traninn-logistic`:

### Descubrir los IDs de sección

```
GET /api/admin/sections?site=traninn-logistic&page=inicio
GET /api/admin/sections?site=traninn-logistic&global=1
```

### Editar «Nuestros clientes»

```
PUT /api/admin/sections/{id}
```

```json
{
  "content": {
    "title": "Empresas que confían en nosotros",
    "logos": [
      { "image": "media/cliente-uno.png", "name": "Cliente Uno", "url": "https://cliente-uno.mx" },
      { "image": "media/cliente-dos.png", "name": "Cliente Dos", "url": null }
    ]
  }
}
```

**Respuesta exitosa (HTTP 200)**

```json
{
  "status": "success",
  "data": {
    "id": 97,
    "site_id": 3,
    "page_id": 21,
    "type": "clients_showcase",
    "position": 4,
    "content": {
      "title": "Empresas que confían en nosotros",
      "logos": [
        { "image": "media/cliente-uno.png", "name": "Cliente Uno", "url": "https://cliente-uno.mx" },
        { "image": "media/cliente-dos.png", "name": "Cliente Dos", "url": null }
      ]
    }
  },
  "meta": { "message": "Sección actualizada correctamente" }
}
```

> ⚠️ El merge de `SectionController@update` es **superficial**: se manda la colección completa en cada `PUT`. Para quitar un logo, se envía el array sin él.

### Consultar la portada (API pública)

```
GET /api/public/traninn-logistic/pages/inicio
GET /api/public/traninn-logistic/globals
GET /api/public/traninn-logistic/menu
```

### Simulador de ahorro

```
GET /api/public/traninn-logistic/savings-simulator?fuel=diesel&quantity=1000
```

```json
{
  "status": "success",
  "data": {
    "current_fuel": { "fuel": "diesel", "label": "Diésel", "quantity": 1000,
                      "unit": "litro", "price_per_unit": 26.4, "cost": 26400 },
    "natural_gas":  { "quantity": 950, "unit": "m³", "price_per_unit": 12.8, "cost": 12160 },
    "savings": 14240,
    "savings_percent": 53.94
  },
  "meta": { "site": "traninn-logistic" }
}
```

### Respuestas de error comunes

**422 — campo fijo o payload inválido** (el `PUT` responde 200 pero descarta `fields`; el 422 aparece cuando falta un campo obligatorio de la colección):

```json
{
  "message": "El campo nombre del logo es obligatorio.",
  "errors": { "content.logos.0.name": ["El campo nombre del logo es obligatorio."] }
}
```

**401 — sin token o token inválido**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

**404 — sitio o página inexistente**

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

---

## Pruebas incluidas

`tests/Feature/TraninnHomeTest.php` — 5 tests, uno por cosa que puede romperse:

| Test | Qué protege |
| --- | --- |
| `returns the home page with its five sections in blueprint order` | El orden del blueprint y que sean exactamente 5 |
| `returns the site-wide sections without testimonials` | Las 3 globales, y que `testimonials` **no** aparezca |
| `simulates savings with this site prices` | Que el cálculo use los precios de este sitio (1000 L diésel → ahorro de 14,240) |
| `replaces the client logos through the admin API` | Que el admin reemplace la colección de logos |
| `keeps the lead form fields locked` | Que `fields` sobreviva a un `PUT` que intente cambiarlo |

**Resultado de la suite completa: 159 tests, 654 aserciones, todos verdes.** Pint sin observaciones.

---

## Archivos involucrados

| Capa | Archivo | Cambio |
| --- | --- | --- |
| Seeder (base) | `database/seeders/BlueprintSeeder.php` | **Nuevo** — clase abstracta con `page()` y `section()` |
| Seeder (sitio) | `database/seeders/TraninnLogisticBlueprintSeeder.php` | **Nuevo** — portada + globales de `traninn-logistic` |
| Seeder (registro) | `database/seeders/DatabaseSeeder.php` | +1 línea: registra el seeder nuevo |
| Seeder (refactor) | `database/seeders/GnuBlueprintSeeder.php` | `extends BlueprintSeeder`; −41 líneas duplicadas |
| Seeder (refactor) | `database/seeders/GnuVehicularBlueprintSeeder.php` | `extends BlueprintSeeder`; −42 líneas y el comentario `ponytail:` saldado |
| Test | `tests/Feature/TraninnHomeTest.php` | **Nuevo** — 5 tests feature |
| Doc / blueprint | `.claude/skills/sitios-web-gnu/references/traninn-logistic.md` | Migrado parcial al formato blueprint; árbol crudo movido a apéndice |
| Doc / blueprint | `.claude/skills/sitios-web-gnu/SKILL.md` | El sitio deja de listarse como «formato viejo» |
| Doc / estado | `.claude/skills/sitios-web-gnu/references/implementation-status.md` | Tipos sembrados y conteo por sitio actualizados |
| Doc / estado | `.claude/skills/cms-gnu-backend/references/functionality-map.md` | Fila 18: ⬜ → 🟡 (1 de 5 columnas); conteo de tests 92 → 159 |
