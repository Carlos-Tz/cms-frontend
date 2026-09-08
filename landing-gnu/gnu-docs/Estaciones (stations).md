# Estaciones \(stations\)

*Nueva entidad de dominio. Alimenta los pines del tipo de sección *`stations_map`*, El admin las gestiona con CRUD completo; el público solo lee las activas.*


---

---

## Flujo Simple

```
Paso 1: El admin crea una estación
        POST /api/admin/stations  { site_id, name, address, latitude, longitude, … }
⬇️
Paso 2: Middleware auth:api valida el JWT
⬇️
Paso 3: StationRequest valida
        - site_id: `required` en create / `prohibited` en update
        - latitude between -90,90 · longitude between -180,180
⬇️
Paso 4: INSERT en `stations`
⬇️
Paso 5: El sitio público pide sus pines
        GET /api/public/gnu/stations
⬇️
Paso 6: Scope `active()` filtra is_active = true
        + filtro por sitio desde el route binding {site:slug}
⬇️
Paso 7: Respuesta sin paginar — un mapa dibuja todos los pines a la vez
```

## Decisiones Clave de Implementación

**Coordenadas en **`decimal`**, no en **`float` — `database/migrations/2026_08_12_001818_create_stations_table.php`

```
// Decimal rather than float: coordinates are compared and displayed,
// never accumulated, and 7 decimals is ~1 cm of precision.
$table->decimal('latitude', 10, 7);
$table->decimal('longitude', 10, 7);

// Lets the admin pull a station off the map without losing its data.
$table->boolean('is_active')->default(true);

$table->index(['site_id', 'is_active']);
```

`is_active` en vez de borrar: el admin cierra una estación temporalmente sin perder dirección, teléfono ni horario.

**Scope **`active()`** en el modelo** — `app/Models/Station.php`

```
#[Fillable(['site_id', 'name', 'address', 'latitude', 'longitude', 'phone', 'schedule', 'is_active'])]
class Station extends Model
{
    /** Visible to the public API. */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    protected function casts(): array
    {
        return ['latitude' => 'float', 'longitude' => 'float', 'is_active' => 'boolean'];
    }
}
```

El cast a `float` importa: sin él las coordenadas salen como string en el JSON y el front tendría que parsearlas.

**Una estación nunca cambia de sitio** — `app/Http/Requests/Admin/StationRequest.php`

Mismo criterio que `BlogPostRequest`, por consistencia y por aislamiento entre sitios:

```js
'site_id' => $this->station() === null
    ? ['required', 'integer', 'exists:sites,id']
    : ['prohibited'],
'latitude'  => ['required', 'numeric', 'between:-90,90'],
'longitude' => ['required', 'numeric', 'between:-180,180'],
```

**El público no pagina** — `app/Http/Controllers/Public/StationController.php`

```
/**
 * Unpaginated on purpose: a map draws every pin at once, and a marketing
 * site has tens of stations, not thousands.
 */
public function index(Site $site): JsonResponse
{
    $stations = $site->stations()->active()->orderBy('name')->get();
    …
}
```

El admin sí pagina (20 por página) e **incluye las inactivas** — es como las encuentra para reactivarlas.

## Configuración

Ninguna nueva. Solo correr la migración:

```
php artisan migrate
```

## Implementación

**Estructura de la Petición (admin)**

```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

**Ejemplo de Petición**

```json
{
    "site_id": 1,
    "name": "Estación Apodaca",
    "address": "Carretera Miguel Alemán km 20, Apodaca, N.L.",
    "latitude": 25.7810,
    "longitude": -100.1880,
    "phone": null,
    "schedule": null,
    "is_active": true
}
```

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": { "id": 3, "site_id": 1, "name": "Estación Apodaca", "…": "…" },
    "meta": { "message": "Estación creada correctamente" }
}
```

## Endpoints

| Método | URI | Nota |
| --- | --- | --- |
| GET | `/api/admin/stations?site=gnu` | `orderBy('name')`, `paginate(20)`, incluye inactivas |
| POST | `/api/admin/stations` | 201 |
| GET | `/api/admin/stations/{id}` |  |
| PUT/PATCH | `/api/admin/stations/{id}` | `site_id` prohibido |
| DELETE | `/api/admin/stations/{id}` |  |
| GET | `/api/public/{site}/stations` | **Público.** Solo activas, sin paginar |

**Respuesta pública (HTTP 200)**

```json
{
    "status": "success",
    "data": [
        { "name": "Estación Guadalupe",
          "address": "Av. Pablo Livas 500, Guadalupe, N.L.",
          "latitude": 25.6768, "longitude": -100.256,
          "phone": "+52 81 0000 0000",
          "schedule": "Lunes a domingo de 6:00 a 22:00" }
    ],
    "meta": { "site": "gnu", "total": 2 }
}
```

El público **no expone** `id`, `site_id` ni `is_active`.

**Error 422 — Coordenadas inválidas**

```json
{ "message": "La latitud debe estar entre -90 y 90. (and 1 more error)",
  "errors": {
    "latitude": ["La latitud debe estar entre -90 y 90."],
    "longitude": ["La longitud debe estar entre -180 y 180."]
  } }
```

**Error 422 — Cambio de sitio**

```json
{ "errors": { "site_id": ["Una estación no puede cambiar de sitio."] } }
```

## Archivos involucrados

| Capa | Ruta | Estado |
| --- | --- | --- |
| Migración | `database/migrations/2026_08_12_001818_create_stations_table.php` | **Nuevo** |
| Modelo | app/Models/Station.php | **Nuevo** |
| Modelo | app/Models/Site.php | Modificado — relación `stations()` |
| Factory | database/factories/StationFactory.php | **Nuevo** — estado `inactive()` |
| Validación | app/Http/Requests/Admin/StationRequest.php | **Nuevo** |
| Controlador admin | app/Http/Controllers/Admin/StationController.php | Stub → CRUD real |
| Controlador público | app/Http/Controllers/Public/StationController.php | Stub → real |
| Pruebas | tests/Feature/StationTest.php | **Nuevo** — 9 tests |
