# Portada \(gnu\-vehicular\)

*Siembra la página **Inicio** del sitio *`gnu-vehicular`* con sus 6 secciones predefinidas, sus 3 secciones globales y 2 estaciones para el mapa. No agrega código de aplicación: los 6 tipos de sección ya existían en el catálogo y ya eran editables desde la API admin.*

---

---

#### Flujo Simple

```
Paso 1: Blueprint (markdown)
        references/gnu-vehicular.md define qué secciones lleva /
⬇️
Paso 2: Seeder
        GnuVehicularBlueprintSeeder traduce el blueprint a filas
⬇️
Paso 3: Base de datos
        pages(1 fila) + sections(6 de página + 3 globales) + stations(2)
⬇️
Paso 4a: Lectura pública                 Paso 4b: Escritura admin
        GET /api/public/gnu-vehicular/…          PUT /api/admin/sections/{id}
        sin auth, solo lectura                   JWT + UpdateSectionRequest
⬇️                                        ⬇️
Paso 5: JSON { status, data, meta }      Sección actualizada, campos fijo intactos
```

#### Decisiones Clave de Implementación

1. **«Programa de recompensas» se resuelve con **`feature_grid`**, no con un tipo nuevo**

El árbol del cliente lista ese nodo bajo *Inicio*, así que por la regla de clasificación es una **sección**, no una página. Es una rejilla de tarjetas, exactamente lo que cubre el tipo genérico:

```js
// Es hijo de Inicio → sección. Es rejilla de tarjetas → feature_grid.
// No se promovió a tipo propio: el cliente no declaró campos que este no tenga.
$this->section($site, $home, 'feature_grid', 3, [
    'title' => 'Programa de recompensas',
    'items' => [
        ['icon' => null, 'title' => 'Acumula por cada carga', 'text' => '…'],
        ['icon' => null, 'title' => 'Canjea tus puntos',      'text' => '…'],
        ['icon' => null, 'title' => 'Beneficios para flotillas', 'text' => '…'],
    ],
]);
```

Ahorra un esquema en `section-types.md`, una entrada en `UpdateSectionRequest::SCHEMAS` y sus tests de validación.

1. `testimonials`** es sección de la portada aquí, y global en **`gnu`

Divergencia deliberada: se respeta el árbol de cada sitio tal como lo entregó el cliente en vez de armonizarlos en silencio. Por eso `GET /globals` de este sitio devuelve **3** claves y el de `gnu` devuelve 4.

```
// Section of the home page here, site-wide in the institutional site.
$this->section($site, $home, 'testimonials', 4, [ /* … */ ]);
```

1. **La portada no lleva **`page_hero`

El `banner_carousel` es el hero, igual que en `gnu`. Es la única página del proyecto sin `page_hero`.

1. **El simulador guarda sus propios precios**

Cada instancia de `savings_simulator` lleva su tabla de referencia, así que este sitio cotiza distinto que el institucional sin ningún mecanismo extra. Como es la única instancia del sitio, el endpoint no necesita `?page=`:

```js
'fuel_prices' => [
    ['fuel' => 'gas-natural', 'label' => 'Gas natural vehicular',
     'price_per_unit' => 13.20, 'unit' => 'm³', 'equivalence_factor' => 1],
    ['fuel' => 'diesel', 'label' => 'Diésel',
     'price_per_unit' => 26.40, 'unit' => 'litro', 'equivalence_factor' => 0.95],
    // …
],
```

`equivalence_factor` = unidades de gas natural equivalentes a 1 unidad de ese combustible. El cálculo es código (`SavingsSimulatorController`), no un campo.

1. **Los pines del mapa no son campos de **`stations_map`

La sección solo dice *dónde se dibuja el mapa* (`center` y `zoom`, ambos **fijo**). Los pines salen de la tabla `stations`, que el admin gestiona aparte:

```js
$this->section($site, $home, 'stations_map', 5, [
    'title'  => 'Mapa de estaciones',
    'center' => '19.7028,-101.1920',  // fijo: layout, no contenido
    'zoom'   => '11',                 // fijo
]);
```

1. **Helpers duplicados a propósito**

`page()` y `section()` se copiaron de `GnuBlueprintSeeder` en vez de extraer una clase base — dos copias no pagan la abstracción. Marcado en el código para que no se olvide:

```
// ponytail: duplicated from GnuBlueprintSeeder. Extract a base seeder when
// the third site lands — two copies do not pay for an abstraction yet.
```

#### Configuración

- Ninguna variable de entorno nueva.
- El seeder ya está registrado en `DatabaseSeeder`; se ejecuta con `php artisan migrate:fresh --seed`.
- Idempotente (`updateOrCreate` en todo): se puede re-ejecutar solo con `php artisan db:seed --class=GnuVehicularBlueprintSeeder` sin duplicar filas.

#### Implementación

**Estructura de la petición — API pública**

```
Sin autenticación. Solo lectura.
Accept: application/json
```

**Estructura de la petición — API admin**

```
Authorization: Bearer {jwt}
Content-Type: application/json
```

**Contenido sembrado**

| tabla | filas | detalle |
| --- | --- | --- |
| `pages` | 1 nueva | `/` → slug `inicio`, position 1, publicada |
| `sections` | 6 de página | carousel, simulador, recompensas, testimoniales, mapa, formulario |
| `sections` | 3 globales | `contact_info`, `social_icons`, `whatsapp_button` (`page_id = null`) |
| `stations` | 2 | Estación Morelia, Estación Uruapan |

#### Endpoints

**Portada con sus secciones en orden**

```
GET /api/public/gnu-vehicular/pages/inicio
```

```
{
  "status": "success",
  "data": {
    "slug": "inicio",
    "path": "/",
    "title": "Inicio",
    "sections": [
      { "type": "banner_carousel",   "content": { "slides": [ … ] } },
      { "type": "savings_simulator", "content": { "title": "Simulador de ahorro", "fuel_prices": [ … ] } },
      { "type": "feature_grid",      "content": { "title": "Programa de recompensas", "items": [ … ] } },
      { "type": "testimonials",      "content": { "title": "Lo que dicen nuestros conductores", "items": [ … ] } },
      { "type": "stations_map",      "content": { "title": "Mapa de estaciones", "center": "19.7028,-101.1920", "zoom": "11" } },
      { "type": "lead_capture_form", "content": { "title": "Contacto", "submit_label": "Enviar", "fields": ["name","email","phone","message"] } }
    ]
  },
  "meta": { "site": "gnu-vehicular" }
}
```

**Secciones globales**

```
GET /api/public/gnu-vehicular/globals
```

```json
{
  "status": "success",
  "data": {
    "contact_info":    { "address": "Av. Ejemplo 456, Morelia, Michoacán", "phone": "+52 443 000 0000", "email": "contacto@gnuvehicular.mx", "schedule": "Lunes a sábado de 7:00 a 21:00", "additional_info": null },
    "social_icons":    { "networks": [ { "network": "facebook", "url": "https://facebook.com/gnuvehicular" } ] },
    "whatsapp_button": { "phone": "+524430000000", "prefilled_message": "Hola, quiero información sobre gas natural vehicular." }
  },
  "meta": { "site": "gnu-vehicular" }
}
```

**Menú de navegación** — derivado del mapa de páginas, no hay CRUD de menús

```
GET /api/public/gnu-vehicular/menu
```

**Simulador de ahorro** — el cálculo lo hace el backend

```
GET /api/public/gnu-vehicular/savings-simulator?fuel=diesel&quantity=1000
```

```json
{
  "status": "success",
  "data": {
    "current_fuel": { "fuel": "diesel", "label": "Diésel", "quantity": 1000, "unit": "litro", "price_per_unit": 26.4, "cost": 26400 },
    "natural_gas":  { "quantity": 950, "unit": "m³", "price_per_unit": 13.2, "cost": 12540 },
    "savings": 13860,
    "savings_percent": 52.5
  },
  "meta": { "site": "gnu-vehicular" }
}
```

**Estaciones que alimentan el mapa**

```
GET /api/public/gnu-vehicular/stations
```

**Editar una sección (admin)**

```
PUT /api/admin/sections/{id}
```

```json
{
  "content": {
    "title": "Recompensas GNV",
    "items": [
      { "title": "Acumula puntos", "text": "Un punto por cada m³ cargado." }
    ]
  }
}
```

**Respuestas de error**

Error 422 — validación (falta un campo obligatorio de la colección):

```json
{
  "message": "El campo content.items.0.title es obligatorio.",
  "errors": { "content.items.0.title": ["El campo content.items.0.title es obligatorio."] }
}
```

Error 422 — tipo de sección aún no editable:

```json
{
  "errors": { "content": ["El tipo de sección «X» aún no es editable desde el panel."] }
}
```

Error 404 — sitio o página inexistente, o página despublicada:

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

Error 401 — sin token en la API admin:

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

Error 405 — el admin no puede crear ni borrar secciones ni páginas: esas rutas no existen (`only(['index','show','update'])`).

#### Archivos involucrados

| capa | archivo | qué hace |
| --- | --- | --- |
| Spec / blueprint | .claude/skills/sitios-web-gnu/references/gnu-vehicular.md | **Migrado** a formato blueprint (parcial): mapa de páginas, secciones globales, notas de clasificación. El árbol original queda como apéndice intocable |
| Seeder | database/seeders/GnuVehicularBlueprintSeeder.php | **Reescrito.** Portada + 6 secciones, 3 globales, blog, 4 artículos, 2 estaciones |
| Seeder | database/seeders/DatabaseSeeder.php | Sin cambios: el seeder ya estaba registrado |
| Test | tests/Feature/VehicularHomeTest.php | **Nuevo.** 7 tests: orden de secciones, globals sin `testimonials`, menú, aislamiento de precios frente a `gnu`, estaciones, edición del `feature_grid`, `fields` bloqueado |
| Controlador (reusado) | app/Http/Controllers/Public/PageController.php | Sirve `pages/{slug}` y `globals`; genérico por sitio, sin tocar |
| Controlador (reusado) | app/Http/Controllers/Public/SavingsSimulatorController.php | Calcula el ahorro con los precios de la sección del sitio |
| Controlador (reusado) | app/Http/Controllers/Admin/SectionController.php | `update` hace `array_merge` y por eso conserva los campos `fijo` |
| Validación (reusada) | app/Http/Requests/Admin/UpdateSectionRequest.php | Los 6 tipos ya tenían reglas en `SCHEMAS`; no se agregó ninguna |
| Estado | .claude/skills/sitios-web-gnu/references/implementation-status.md | Columna «sembrado» de 9 tipos + párrafo de qué está sembrado hoy |
| Estado | .claude/skills/cms-gnu-backend/references/functionality-map.md | Fila 17 → «portada + blog (2 de 5 columnas)»; se cierra el pendiente de clasificar «Programa de recompensas» |
