# Columna «Nuestros servicios» y gestión de cotizaciones

*Cierra el blueprint de *`gnu-vehicular`* con su última columna —la única de 3 niveles del proyecto— y convierte la bandeja de leads en algo que sirve para gestionar cotizaciones: cada lead registra de qué formulario vino y guarda en columna propia los datos que ese formulario pide de más.*

---

---

#### Flujo Simple

**Navegación de 3 niveles**

```
Paso 1: El seeder encadena parent_id
        /nuestros-servicios → /instala-tu-equipo-de-gnv → /cotiza-tu-equipo
⬇️
Paso 2: GET /menu → MenuController::tree(), ya recursivo
⬇️
Paso 3: Árbol anidado a 3 niveles, sin código nuevo
⬇️
Paso 4: Si se despublica una página intermedia,
        su rama entera cae (las nietas no tienen ruta)
```

**Un lead con su origen y sus datos propios**

```
Paso 1: El front pinta el lead_capture_form de una página
        y lee de fields[] qué inputs mostrar
⬇️
Paso 2: POST /leads con source = slug de esa página
        y details = { los campos extra que fields[] declara }
⬇️
Paso 3: StoreLeadRequest
        source  → ¿es una página PUBLICADA de ESTE sitio?      no → 422
        details → resuelve la sección por source, lee su fields[]
                  ¿toda clave está declarada ahí?              no → 422
⬇️
Paso 4: Se guarda el lead con origen y extras
⬇️
Paso 5: GET /admin/leads?site=…&source=cotiza-tu-equipo
        El admin ve solo las cotizaciones, con su vehículo
```

#### Decisiones Clave de Implementación

1. **Los 3 niveles no necesitaron código**

`pages.parent_id` ya existía y `MenuController::tree()` ya era recursivo. El seeder solo encadena el parámetro `$parent` que el helper `page()` siempre aceptó:

```
$install = $this->page($site, 'instala-tu-equipo-de-gnv', '…', 'Instala tu equipo de GNV', 1, $services);
$quote   = $this->page($site, 'cotiza-tu-equipo', '…/cotiza-tu-equipo', 'Cotiza tu equipo', 1, $install);
```

1. **Tres de cuatro candidatos de tipo resultaron bloques genéricos**

| candidato | resultado |
| --- | --- |
| `billing_info` | descartado → `rich_text` de `/contacto` |
| `equipment_quote` | descartado → `lead_capture_form` de `cotiza-tu-equipo` |
| `financing` | descartado → `feature_grid` de `financiamiento` |
| `service_scheduling` | **tipo real**, el único exclusivo de un sitio |

«Cotiza tu equipo» no calcula nada, así que es un formulario, con el mismo precedente que «Cotiza tu suministro» en el sitio institucional.

1. `source`** es fillable; **`site_id`** no — y son casos distintos**

```
// `site_id` is not fillable on purpose: the site always comes from the route
// binding of the public endpoint, never from the payload. `source` is: it says
// which page's form produced the lead, and the request validates it against the
// published pages of that site so it cannot hold junk.
#[Fillable(['source', 'name', 'email', 'phone', 'message', 'details'])]
```

`site_id` es una frontera de seguridad: aceptarlo del cliente dejaría escribir en otro sitio. `source` no lo es —un valor falsificado solo etiqueta mal una fila— pero se valida igual para que la bandeja siga significando algo.

1. `details`** es JSON, no una columna por campo**

Los cuatro campos que lleva **todo** formulario siguen siendo columnas. Lo que un formulario pide de más va en `details`:

```js
/**
 * The fields every `lead_capture_form` has, one column each. Anything a
 * form declares beyond these is an extra and lands in `details`.
 *
 * @var list<string>
 */
public const CORE_FIELDS = ['name', 'email', 'phone', 'message'];
```

Una columna por campo obligaría a una migración cada vez que un formulario nuevo pregunte algo suyo. Con JSON, el conjunto se declara por sección.

1. **Lo que impide que **`details`** sea un basurero**

`fields[]` **dejó de ser decorativo**. Antes la sección declaraba una lista que solo leía el front, mientras el backend validaba una lista fija en código; nada garantizaba que coincidieran. Ahora el request resuelve la sección de origen y usa su `fields[]` como lista blanca:

```
private function declaredExtraFields(Site $site): array
{
    $source = $this->string('source')->toString();

    if ($source === '') {
        return [];   // sin origen no hay formulario contra el cual validar
    }

    $section = $site->sections()
        ->where('type', 'lead_capture_form')
        ->whereHas('page', fn ($page) => $page->where('slug', $source))
        ->first();

    return array_values(array_diff($section?->content['fields'] ?? [], Lead::CORE_FIELDS));
}
```

Cerrado por defecto: un lead sin `source` no admite ningún extra, igual que un tipo de sección sin entrada en `SCHEMAS` no es editable.

1. `message`** siempre al final**

```
// `message` stays last: it reads as the closing field of a form.
'fields' => ['name', 'email', 'phone', ...$extra, 'message'],
```

Un formulario sin extras produce exactamente el array de antes, así que los formularios existentes no cambiaron.

#### Configuración

- Dos migraciones: `php artisan migrate`.
- Sin variables de entorno ni rutas nuevas — siguen siendo 53 endpoints.
- El front manda en `source` el slug de la página que renderiza. No necesita conocimiento extra: ya lo tiene porque pidió `/pages/{slug}`.
- Para que un formulario pida un campo nuevo se edita su `fields[]` en el seeder. **Ya no hace falta migración**, pero sigue siendo trabajo de desarrollo: el admin no puede tocar `fields[]`.

#### Implementación

**Las 6 páginas nuevas (18 secciones)**

| ruta | nivel | secciones |
| --- | --- | --- |
| `/nuestros-servicios` | 1 | `page_hero`, `rich_text` |
| `…/instala-tu-equipo-de-gnv` | 2 | `page_hero`, `rich_text`, `feature_grid` |
| `…/instala-tu-equipo-de-gnv/cotiza-tu-equipo` | 3 | `page_hero`, `rich_text`, `lead_capture_form` |
| `…/instala-tu-equipo-de-gnv/financiamiento` | 3 | `page_hero`, `rich_text`, `feature_grid` |
| `…/flotillas-empresariales` | 2 | `page_hero`, `rich_text`, `feature_grid`, `lead_capture_form` |
| `…/estaciones-moviles` | 2 | `page_hero`, `rich_text`, `feature_grid` |

Solo *Flotillas empresariales* capta leads dentro de la columna, además de *Cotiza tu equipo*: es la página con intención comercial B2B. La columna **no** lleva `clients_showcase` —ese tipo no está declarado para este sitio— aunque la equivalente de `gnu` sí.

**Cambios en **`leads`

```
+ source   string nullable  after site_id   → slug de la página del formulario
+ details  json   nullable  after message   → campos extra declarados por esa sección
```

**Los formularios con extras, hoy**

| formulario | `fields[]` |
| --- | --- |
| `/` y `/contacto` | `name, email, phone, message` |
| `cotiza-tu-equipo` | `name, email, phone, vehicle_description, message` |
| `flotillas-empresariales` | `name, email, phone, fleet_size, message` |

#### Endpoints

**Menú con 3 niveles**

```
GET /api/public/gnu-vehicular/menu
```

```json
{ "slug": "nuestros-servicios", "title": "Nuestros servicios", "children": [
    { "slug": "instala-tu-equipo-de-gnv", "title": "Instala tu equipo de GNV", "children": [
        { "slug": "cotiza-tu-equipo", "title": "Cotiza tu equipo", "children": [] },
        { "slug": "financiamiento",   "title": "Financiamiento",   "children": [] }
    ]},
    { "slug": "flotillas-empresariales", "title": "Flotillas empresariales", "children": [] },
    { "slug": "estaciones-moviles",      "title": "Estaciones móviles",      "children": [] }
]}
```

**Una página nieta se sirve por su slug, igual que cualquier otra**

```
GET /api/public/gnu-vehicular/pages/cotiza-tu-equipo
```

```
{ "status": "success",
  "data": {
    "slug": "cotiza-tu-equipo",
    "path": "/nuestros-servicios/instala-tu-equipo-de-gnv/cotiza-tu-equipo",
    "title": "Cotiza tu equipo",
    "sections": [
      { "type": "page_hero", "content": { … } },
      { "type": "rich_text", "content": { … } },
      { "type": "lead_capture_form", "content": {
          "title": "Cotiza tu equipo",
          "submit_label": "Enviar",
          "fields": ["name", "email", "phone", "vehicle_description", "message"]
      }}
    ]
  },
  "meta": { "site": "gnu-vehicular" } }
```

**Enviar una cotización**

```
POST /api/public/gnu-vehicular/leads
```

```json
{
  "source": "cotiza-tu-equipo",
  "name": "Ana Ruiz",
  "email": "ana@example.com",
  "phone": "4431112222",
  "details": { "vehicle_description": "Nissan Versa 2020" }
}
```

**Respuesta exitosa (HTTP 201)**

```json
{ "status": "success", "data": null,
  "meta": { "message": "Gracias por contactarnos. Un asesor se comunicará contigo." } }
```

**Bandeja filtrada por formulario**

```
GET /api/admin/leads?site=gnu-vehicular&source=cotiza-tu-equipo
```

| source | name | details |
| --- | --- | --- |
| `cotiza-tu-equipo` | Ana Ruiz | `{"vehicle_description":"Nissan Versa 2020"}` |
| `flotillas-empresariales` | Luis Mora | `{"fleet_size":"12"}` |

Sin el filtro, la bandeja sigue mostrando todo, con y sin origen.

**Respuestas de error**

Origen inexistente, o página real pero de otro sitio:

```json
{ "message": "El origen del formulario no corresponde a una página de este sitio.",
  "errors": { "source": ["El origen del formulario no corresponde a una página de este sitio."] } }
```

Campo que existe, pero en otro formulario:

```json
{ "message": "El formulario de esta página no acepta: fleet_size.",
  "errors": { "details": ["El formulario de esta página no acepta: fleet_size."] } }
```

Página intermedia despublicada: `GET /pages/instala-tu-equipo-de-gnv` responde 404 y sus dos nietas desaparecen del menú.

#### Archivos involucrados

| capa | archivo | qué hace |
| --- | --- | --- |
| Seeder | GnuVehicularBlueprintSeeder.php | `services()` e `installation()`; helpers `body()` y `cards()`; `leadForm()` acepta `$extra`. +211 líneas |
| Migración | add\_source\_to\_leads\_table | Columna `source` nullable |
| Migración | add\_details\_to\_leads\_table | Columna `details` JSON nullable |
| Modelo | Lead.php | `CORE_FIELDS`, cast `details => array`, y por qué `source` sí es fillable y `site_id` no |
| Validación | StoreLeadRequest.php | `declaredExtraFields()` + `onlyDeclaredFields()`: lo que hace vinculante al `fields[]` |
| Controlador | Admin/LeadController.php | Filtro `?source=` en la bandeja |
| Test | VehicularServicesTest.php | **Nuevo**, 17 tests: las 6 páginas, anidamiento a 3 niveles, caída de rama, `fields[]` declarados, guardado y rechazo cruzado de extras |
| Test | LeadTest.php | +6 tests: `source` guardado, validado y filtrado; extras rechazados en un formulario que no los declara y en un lead sin origen |
| Test | VehicularHomeTest.php · VehicularLocationsTest.php | Índices del menú corridos al insertar la columna en posición 2 |
| Spec | section-types.md | Las dos capas de `fields[]` (core vs extras) y que ahora el backend lo hace cumplir; `equipment_quote` y `financing` a descartados |
| Spec | gnu-vehicular.md | Sitio completo: 5 de 5 columnas, 14 páginas; tabla de candidatos resueltos |
| Estado | domain-entities.md · api-surface.md · implementation-status.md · functionality-map.md | `source` y `details` documentados; el pendiente de trazabilidad marcado como resuelto con la razón del cambio de criterio |
