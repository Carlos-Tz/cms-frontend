# Columna Ubicaciones y agenda de verificación

*Siembra las 5 páginas de la columna **Ubicaciones** e implementa la **agenda de verificación vehicular**: 3 horarios de dos horas al día, de lunes a sábado, una cita por horario y por estación. Es la primera funcionalidad del proyecto con tabla, modelo y endpoints propios.*


#### Flujo Simple

**Agendar una cita**

```
Paso 1: El front lee la página
        GET /pages/agenda-tu-verificacion → sección service_scheduling (títulos)
⬇️
Paso 2: Pide los horarios libres de una estación y un día
        GET /appointments/availability?station={id}&date=Y-m-d
⬇️
Paso 3: ¿Día cerrado? (domingo o fecha pasada)
        Sí → slots: []   |   No → los 3 slots con available: true/false
⬇️
Paso 4: El visitante envía la reserva
        POST /appointments  (throttle:10,1)
⬇️
Paso 5: StoreAppointmentRequest
        estación del sitio y activa · fecha no pasada ni domingo
        slot existente · slot libre
⬇️
Paso 6: $site->appointments()->create()
        site_id del route binding; índice único (station_id, date, slot)
⬇️
Paso 7: HTTP 201 con la cita confirmada { date, slot, station }
⬇️
Paso 8: El admin la ve en GET /api/admin/appointments?site=… (JWT)
        y la cancela con DELETE
```

**Contenido de la columna**

```
/ubicaciones                              page_hero + stations_map
├── /ubicaciones/estaciones-morelia       page_hero + rich_text
├── /ubicaciones/estacion-uruapan         page_hero + rich_text
├── /ubicaciones/agenda-tu-verificacion   page_hero + service_scheduling
└── /ubicaciones/talleres                 page_hero + rich_text
```

#### Decisiones Clave de Implementación

1. **Los horarios son código, no contenido**

Viven en una constante del modelo y el endpoint de disponibilidad es cómo los conoce el front. Ponerlos también en la sección crearía dos fuentes de verdad: el admin podría anunciar un horario que el endpoint rechaza.

```js
/**
 * The bookable slots of a working day, Monday to Saturday.
 *
 * @var list<string>
 */
public const SLOTS = ['10:00-12:00', '12:00-14:00', '14:00-16:00'];
```

1. **El candado contra el doble booking es el índice, no la validación**

```
// One appointment per slot: the real guard against double booking.
// The Rule::unique in the form request only makes the 422 readable.
$table->unique(['station_id', 'date', 'slot']);
```

La carrera entre validar e insertar la atrapa el controlador y la convierte en un 422 legible:

```js
try {
    $appointment = $site->appointments()->create($request->validated());
} catch (UniqueConstraintViolationException) {
    // Someone booked the same slot between the validation and the insert.
    throw ValidationException::withMessages([
        'slot' => 'Ese horario acaba de ocuparse. Elige otro.',
    ]);
}
```

1. `date`** NO tiene cast a fecha — y es a propósito**

Con el cast, Eloquent guarda `2026-08-24 00:00:00`, y entonces ni la búsqueda de disponibilidad ni el índice único casan con el `Y-m-d` que toma y devuelve la API. Se detectó con los tests en rojo y quedó documentado en el modelo para que nadie lo re-agregue:

```
/**
 * `date` is deliberately NOT cast to a Carbon date: the cast would store it
 * as `Y-m-d H:i:s`, and then every availability lookup and the unique index
 * on (station_id, date, slot) would compare against a value that never
 * matches the `Y-m-d` the API takes and returns.
 */
```

1. **Un día cerrado devuelve lista vacía, no un error**

```js
$isOpen = ! $date->isSunday() && ! $date->isBefore(now()->startOfDay());
// … 'slots' => $isOpen ? [los 3 con su disponibilidad] : [],
```

El widget consulta la semana completa; un 422 en domingo lo rompería.

1. **La estación tiene que ser del sitio y estar activa**

Impide reservar en la estación de otro sitio adivinando un id:

```
'station_id' => [
    'required', 'integer',
    Rule::exists('stations', 'id')
        ->where('site_id', $site->id)
        ->where('is_active', true),
],
```

1. **Tipo de sección nuevo **`service_scheduling`

Primer caso donde ningún tipo genérico sirve: `rich_text` no le dice al front «aquí va el widget». Tres campos editables, ninguno `fijo`, y los horarios ausentes por la decisión 1.

```
'service_scheduling' => [
    'title' => ['required', 'string', 'max:255'],
    'intro' => ['nullable', 'string', 'max:1000'],
    'success_message' => ['required', 'string', 'max:255'],
],
```

1. **Los hijos de Ubicaciones son páginas, no secciones**

La regla de clasificación solo convierte en secciones a los hijos de *Inicio* y *Contacto*. Primer nivel de anidamiento de este sitio, con el parámetro `$parent` que el helper `page()` ya aceptaba.

1. **La agenda admin va ascendente**

```
->orderBy('date')->orderBy('slot')   // en una agenda importa lo que viene
```

A diferencia de la bandeja de leads, que usa `latest()`.

#### Configuración

- Una migración nueva: `php artisan migrate`.
- Sin variables de entorno nuevas.
- Rate limit de la reserva: `throttle:10,1`, igual que los leads.
- Para cambiar horarios o días hábiles se edita `Appointment::SLOTS` y el chequeo de domingo. Es cambio de código, deliberadamente.

#### Implementación

**Tabla **`appointments`

| columna | tipo | nota |
| --- | --- | --- |
| `site_id` | FK cascade | del route binding, nunca del payload |
| `station_id` | FK cascade | Morelia y Uruapan tienen agendas independientes |
| `date` | date | string `Y-m-d`, sin cast |
| `slot` | string | uno de `Appointment::SLOTS` |
| `name`, `email`, `phone` | string | contacto |
| `vehicle_plate` | string | requerido: identifica la unidad |
| `vehicle_description` | string nullable | marca y modelo |

Índices: `unique(station_id, date, slot)` · `index(site_id, date)`

**Petición pública** — sin autenticación · **Petición admin** — `Authorization: Bearer {jwt}`

#### Endpoints

**Horarios libres**

```
GET /api/public/gnu-vehicular/appointments/availability?station=3&date=2026-08-22
```

```json
{
  "status": "success",
  "data": {
    "date": "2026-08-22",
    "station": { "id": 3, "name": "Estación Morelia" },
    "slots": [
      { "slot": "10:00-12:00", "available": false },
      { "slot": "12:00-14:00", "available": true },
      { "slot": "14:00-16:00", "available": true }
    ]
  },
  "meta": { "site": "gnu-vehicular" }
}
```

Día cerrado (domingo o fecha pasada): mismo 200, con `"slots": []`.

**Reservar**

```
POST /api/public/gnu-vehicular/appointments
```

```json
{
  "station_id": 3,
  "date": "2026-08-22",
  "slot": "10:00-12:00",
  "name": "Ana Ruiz",
  "email": "ana@example.com",
  "phone": "4431112222",
  "vehicle_plate": "ABC-12-34",
  "vehicle_description": "Nissan Versa 2020"
}
```

Respuesta exitosa (HTTP 201) — sí devuelve `data`, a diferencia de los leads: el visitante necesita ver qué horario le quedó.

```json
{
  "status": "success",
  "data": { "date": "2026-08-22", "slot": "10:00-12:00", "station": "Estación Morelia" },
  "meta": { "message": "Tu cita quedó registrada. Te esperamos." }
}
```

**Agenda del admin**

```
GET    /api/admin/appointments?site=gnu-vehicular   # paginado de 20, próximas primero
GET    /api/admin/appointments/{appointment}
DELETE /api/admin/appointments/{appointment}        # cancelar es borrar
```

Sin `POST` ni `PUT`: una cita la genera el visitante. Ambos responden 405.

**Páginas de la columna**

```
GET /api/public/gnu-vehicular/pages/ubicaciones
GET /api/public/gnu-vehicular/pages/estaciones-morelia
GET /api/public/gnu-vehicular/pages/estacion-uruapan
GET /api/public/gnu-vehicular/pages/agenda-tu-verificacion
GET /api/public/gnu-vehicular/pages/talleres
GET /api/public/gnu-vehicular/menu     # Ubicaciones con sus 4 hijas anidadas
```

**Respuestas de error comunes**

Error 422 — horario ocupado:

```json
{ "message": "Ese horario ya está ocupado. Elige otro.",
  "errors": { "slot": ["Ese horario ya está ocupado. Elige otro."] } }
```

Error 422 — domingo o fecha pasada:

```json
{ "errors": {
    "date": ["No hay verificaciones en domingo. Elige un día de lunes a sábado."]
} }
```

Error 422 — estación de otro sitio o inactiva:

```json
{ "errors": { "station_id": ["La estación seleccionada no está disponible."] } }
```

Error 404 — la estación del endpoint de disponibilidad no es del sitio o está inactiva. Error 429 — más de 10 reservas por minuto desde la misma IP. Error 401 — API admin sin token.
