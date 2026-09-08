# Blueprint de gnu completo — 17 de 17 páginas

*El seeder sembraba 7 páginas. Este commit agrega las 10 restantes: las columnas «Nuestros servicios» y «Desarrollo sostenible», más GNC y Contacto. Con ello *`stations_map`* pasa a ser editable y el sitio queda completo.*


---

---

## Flujo Simple

```
Paso 1: php artisan db:seed --class=GnuBlueprintSeeder
⬇️
Paso 2: Site::updateOrCreate('gnu')   ← idempotente
⬇️
Paso 3: page() upsert por (site_id, slug); las hijas reciben parent_id
⬇️
Paso 4: section() upsert por (site_id, page_id, type) con su `position`
⬇️
Paso 5: stations() upsert por (site_id, name)
⬇️
Paso 6: El público consume
        GET /pages/{slug} · GET /menu · GET /stations
```

## Decisiones Clave de Implementación

**Un método por columna de navegación** — `database/seeders/GnuBlueprintSeeder.php`

```
$this->services($site);        // Nuestros servicios + GNC, GND, GNV
$this->aboutUs($site);         // Sobre nosotros + sus 4 hijas
$this->sustainability($site);  // Desarrollo sostenible + sus 4 hijas
$this->contact($site);         // Contacto
$this->stations($site);        // 2 estaciones de ejemplo
```

**Tablas de datos donde las páginas se repiten**

GND y GNV son idénticas salvo el nombre; cuatro de las cinco de sostenibilidad son `page_hero` + `rich_text`. Se sembran desde un arreglo en vez de cinco bloques casi iguales:

```
$products = [
    ['gnd', 'GND', 'Gas natural distribuido', 2],
    ['gnv', 'GNV', 'Gas natural vehicular', 3],
];

foreach ($products as [$slug, $title, $subtitle, $position]) {
    $page = $this->page($site, $slug, "/nuestros-servicios/{$slug}", $title, $position, $services);
    // page_hero + rich_text + feature_grid + lead_capture_form
}
```

**Helpers para el contenido que se repite entre páginas**

```js
/**
 * `equivalence_factor` = units of natural gas equivalent to one unit of this
 * fuel. Natural gas is the baseline, so its own factor is 1.
 */
private function fuelPrices(string $title, string $intro): array { … }

/**
 * A `stations_map` section. `center` and `zoom` are locked layout values;
 * the pins come from the `stations` table, not from here.
 */
private function map(string $title): array
{
    return ['title' => $title, 'center' => '25.6714,-100.3094', 'zoom' => '11'];
}
```

`stations_map`** editable, con casi todo bloqueado** — `app/Http/Requests/Admin/UpdateSectionRequest.php`

```
// `center` and `zoom` are locked: map layout, not marketing content.
// The pins are not fields here — they come from the `stations` table.
'stations_map' => [
    'title' => ['nullable', 'string', 'max:255'],
],
```

Al estar ausentes de las reglas, `center` y `zoom` se caen del payload y el `array_merge` del controlador conserva los guardados. Hay un test que lo verifica enviándolos y comprobando que no cambian.

**Tests de inventario movidos a su dueño natural**

`PageAndMenuTest` fijaba la lista completa de páginas y se rompía en cada sembrado. Se reescribió para verificar **comportamiento** (raíces ordenadas por `position`, anidamiento, la rama que desaparece al despublicar) y el inventario pasó a `ServicesAndSustainabilityTest` y `GncAndContactTest`.

## Configuración

```
php artisan migrate                                  # tabla stations
php artisan db:seed --class=GnuBlueprintSeeder       # idempotente, re-ejecutable
```

## Implementación

**Estado final de **`gnu`

|  |  |
| --- | --- |
| Páginas | **17** |
| Secciones de página | **46** |
| Secciones globales | 3 |
| Artículos | 4 |
| Estaciones | 2 |

**Páginas nuevas en este commit**

| Ruta | `slug` | Secciones (en orden) |
| --- | --- | --- |
| `/nuestros-servicios` | `nuestros-servicios` | `page_hero`, `rich_text`, `clients_showcase` |
| `/nuestros-servicios/gnc` | `gnc` | `page_hero`, `rich_text`, `feature_grid`, `savings_simulator`, `stations_map`, `lead_capture_form` |
| `/nuestros-servicios/gnd` | `gnd` | `page_hero`, `rich_text`, `feature_grid`, `lead_capture_form` |
| `/nuestros-servicios/gnv` | `gnv` | `page_hero`, `rich_text`, `feature_grid`, `lead_capture_form` |
| `/desarrollo-sostenible` | `desarrollo-sostenible` | `page_hero`, `rich_text` |
| `/desarrollo-sostenible/distintivo-esr` | `distintivo-esr` | `page_hero`, `rich_text` |
| `/desarrollo-sostenible/ecovadis` | `ecovadis` | `page_hero`, `rich_text` |
| `/desarrollo-sostenible/voluntariado` | `voluntariado` | `page_hero`, `rich_text` |
| `/desarrollo-sostenible/iniciativas-rse` | `iniciativas-rse` | `page_hero`, `feature_grid` |
| `/contacto` | `contacto` | `page_hero`, `lead_capture_form`, `stations_map` |

**GNC es la única página con **`savings_simulator`** y **`stations_map`** juntos** — es la prioridad comercial declarada en el blueprint.

## Endpoints

No se agregaron rutas. Las existentes ahora devuelven contenido donde antes daban 404:

```
GET /api/public/gnu/pages/gnc         → 6 secciones
GET /api/public/gnu/pages/contacto    → 3 secciones
GET /api/public/gnu/menu              → 6 columnas con sus hijas
PUT /api/admin/sections/{id}          → stations_map ya es editable (solo `title`)
```

**Menú resultante**

```
Inicio                    /
Nuestros servicios        /nuestros-servicios
  ├ GNC · GND · GNV
Sobre nosotros            /sobre-nosotros
  ├ Propósito empresarial · Valores · Certificaciones · Nuestra historia
Desarrollo sostenible     /desarrollo-sostenible
  ├ Distintivo ESR · EcoVadis · Voluntariado · Iniciativas de RSE
Contacto                  /contacto
Blog                      /blog
```

## Archivos involucrados

| Capa | Ruta | Estado |
| --- | --- | --- |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Modificado — `services()`, `sustainability()`, `contact()`, `stations()`, `fuelPrices()`, `map()` |
| Validación | app/Http/Requests/Admin/UpdateSectionRequest.php | Modificado — `stations_map` |
| Pruebas | tests/Feature/ServicesAndSustainabilityTest.php | **Nuevo** — 6 tests (2 con datasets) |
| Pruebas | tests/Feature/GncAndContactTest.php | **Nuevo** — 6 tests |
| Pruebas | tests/Feature/PageAndMenuTest.php | Modificado — 3 aserciones hechas robustas |
