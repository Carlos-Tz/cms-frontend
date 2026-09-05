# Columna Contacto

*Monta la página de contacto de *`gnu-vehicular`* con sus 4 secciones: encabezado, **captación de leads**, facturación y **mapa de estaciones**. Los dos flujos que pidió el usuario —recibir leads y dibujar el mapa— ya existían como backend genérico por sitio; esta entrega los conecta a una página real del blueprint.*



#### Flujo Simple

**Captación de leads**

```
Paso 1: Visitante envía el formulario de /contacto
        POST /api/public/gnu-vehicular/leads
⬇️
Paso 2: Middleware throttle:10,1
        Máximo 10 envíos por minuto por IP
⬇️
Paso 3: StoreLeadRequest
        Valida name, email, phone, message — el resto se descarta
⬇️
Paso 4: $site->leads()->create()
        site_id sale del route binding {site:slug}, nunca del payload
⬇️
Paso 5: HTTP 201 { data: null, meta.message: agradecimiento }
⬇️
Paso 6: El admin lo lee en GET /api/admin/leads?site=gnu-vehicular (JWT)
```

**Mapa de estaciones**

```
Paso 1: El front lee la página
        GET /api/public/gnu-vehicular/pages/contacto
⬇️
Paso 2: La sección stations_map dice DÓNDE se dibuja el mapa
        { title, center, zoom }  ← center y zoom son campos fijo
⬇️
Paso 3: El front pide los pines por separado
        GET /api/public/gnu-vehicular/stations
⬇️
Paso 4: Station::active() del sitio, sin paginar
⬇️
Paso 5: Array de { name, address, latitude, longitude, phone, schedule }
```

#### Decisiones Clave de Implementación

1. **«Facturación» se resuelve con **`rich_text`**, no con un tipo **`billing_info`

Es hijo de *Contacto*, así que por la regla de clasificación es sección; y son instrucciones más una liga al portal, o sea contenido libre. Cierra uno de los 4 candidatos sin auditar.

```
// «Facturación» is a `rich_text`, not a type of its own: instructions
// plus a link to the billing portal is free content. Same criterion as
// «Programa de recompensas» — an unaudited candidate stays out of the
// catalogue while a generic type covers it.
$this->section($site, $contact, 'rich_text', 3, [
    'title' => 'Facturación',
    'body' => '<p>Contenido pendiente de redactar: instrucciones de facturación y liga al portal.</p>',
    'video_url' => null,
]);
```

1. **Helpers para los tipos que ahora se repiten entre páginas**

El sitio pasó a tener dos `lead_capture_form` y dos `stations_map` (portada y contacto). Se extrajeron dos helpers privados en el seeder para no repetir el contenido:

```js
/**
 * A `lead_capture_form` section. `fields` is locked: each entry maps to a
 * column of the `leads` table, so changing it is a schema change.
 */
private function leadForm(string $title, string $intro): array
{
    return [
        'title' => $title,
        'intro' => $intro,
        'submit_label' => 'Enviar',
        'fields' => ['name', 'email', 'phone', 'message'],
    ];
}
```

Ninguna página repite un tipo *dentro de sí misma*, así que sigue sin hacer falta la columna `key` en `sections`.

1. **El sitio nunca se acepta del cliente**

Dos candados independientes, cada uno con su test:

```ruby
// Public\LeadController: el sitio sale del route binding {site:slug}
$site->leads()->create($request->validated());

// App\Models\Lead: site_id no es fillable, aunque el payload lo mande
#[Fillable(['name', 'email', 'phone', 'message'])]
class Lead extends Model
```

1. **Los pines no son campos de la sección**

`stations_map` solo dice dónde se dibuja el mapa. `center` y `zoom` son **fijo** (layout, no marketing) y sobreviven a cualquier update del admin porque `SectionController@update` hace `array_merge` sobre el contenido guardado:

```js
$this->section($site, $contact, 'stations_map', 4, $this->map('Mapa de estaciones'));
// map() => ['title' => …, 'center' => '19.7028,-101.1920', 'zoom' => '11']
```

1. **Activa/inactiva: solo la API pública filtra**

```
// Public\StationController — un mapa dibuja todos los pines de golpe
$stations = $site->stations()->active()->orderBy('name')->get();

// Admin\StationController — incluye inactivas, el admin las administra
$stations = Station::query()->when(…)->orderBy('name')->paginate(20);
```

1. **Pendiente conocido, no implementado**

El sitio ya tiene dos formularios escribiendo en la misma tabla y la bandeja no distingue de cuál vino cada lead. Se resuelve con una columna `leads.source` el día que marketing pregunte qué formulario convierte; queda anotado en el mapa de funcionalidad.

#### Configuración

- Ninguna variable de entorno nueva, ninguna migración nueva.
- Rate limit del formulario público: `throttle:10,1` (10 envíos por minuto), declarado en `routes/public.php`.
- El seeder es idempotente: `php artisan db:seed --class=GnuVehicularBlueprintSeeder` no duplica filas.

#### Implementación

**Contenido sembrado en **`/contacto`

| pos | tipo | campos editables | campos fijo |
| --- | --- | --- | --- |
| 1 | `page_hero` | `title`, `subtitle`, `image` | — |
| 2 | `lead_capture_form` | `title`, `intro`, `submit_label` | `fields[]` |
| 3 | `rich_text` | `title`, `body`, `video_url` | — |
| 4 | `stations_map` | `title` | `center`, `zoom` |

**Petición pública** — sin autenticación

```
Accept: application/json
Content-Type: application/json
```

**Petición admin** — JWT

```
Authorization: Bearer {jwt}
Content-Type: application/json
```

#### Endpoints

**Página de contacto con sus secciones**

```
GET /api/public/gnu-vehicular/pages/contacto
```

```json
{
  "status": "success",
  "data": {
    "slug": "contacto",
    "path": "/contacto",
    "title": "Contacto",
    "sections": [
      { "type": "page_hero", "content": { "title": "Contacto", "subtitle": "Estamos para ayudarte.", "image": null } },
      { "type": "lead_capture_form", "content": { "title": "Captación de leads", "intro": "Cuéntanos qué necesitas…", "submit_label": "Enviar", "fields": ["name","email","phone","message"] } },
      { "type": "rich_text", "content": { "title": "Facturación", "body": "<p>…</p>", "video_url": null } },
      { "type": "stations_map", "content": { "title": "Mapa de estaciones", "center": "19.7028,-101.1920", "zoom": "11" } }
    ]
  },
  "meta": { "site": "gnu-vehicular" }
}
```

**Enviar un lead** — única escritura de la API pública

```
POST /api/public/gnu-vehicular/leads
```

```json
{
  "name": "Ana Ruiz",
  "email": "ana@example.com",
  "phone": "4431112222",
  "message": "Quiero convertir mi flotilla a GNV."
}
```

Respuesta exitosa (HTTP 201) — el lead no se devuelve: el sitio público no tiene nada que leer de vuelta.

```json
{
  "status": "success",
  "data": null,
  "meta": { "message": "Gracias por contactarnos. Un asesor se comunicará contigo." }
}
```

**Pines del mapa**

```
GET /api/public/gnu-vehicular/stations
```

```json
{
  "status": "success",
  "data": [
    { "name": "Estación Morelia", "address": "Av. Madero Poniente 1000, Morelia, Mich.", "latitude": 19.7028, "longitude": -101.192, "phone": "+52 443 000 0000", "schedule": "Lunes a domingo de 6:00 a 22:00" }
  ],
  "meta": { "site": "gnu-vehicular", "total": 2 }
}
```

**Bandeja de leads (admin)**

```
GET    /api/admin/leads?site=gnu-vehicular      # paginado de 20, más recientes primero
GET    /api/admin/leads/{lead}                  # el lead con su sitio
DELETE /api/admin/leads/{lead}
```

No hay `POST` ni `PUT` de leads en admin, a propósito: un lead lo genera el visitante.

**Estaciones (admin)** — CRUD completo, las estaciones son datos, no estructura

```
GET    /api/admin/stations?site=gnu-vehicular   # incluye inactivas
POST   /api/admin/stations                      # site_id requerido
PUT    /api/admin/stations/{station}            # site_id prohibido
DELETE /api/admin/stations/{station}
```

**Editar una sección de la página (admin)**

```
PUT /api/admin/sections/{id}
```

**Respuestas de error comunes**

Error 422 — lead inválido, mensajes en español:

```json
{
  "message": "Escribe tu nombre.",
  "errors": {
    "name": ["Escribe tu nombre."],
    "email": ["El correo electrónico no es válido."]
  }
}
```

Error 422 — mover una estación de sitio:

```json
{ "errors": { "site_id": ["Una estación no puede cambiar de sitio."] } }
```

Error 429 — más de 10 envíos por minuto desde la misma IP.

Error 404 — sitio o página inexistente / despublicada:

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

Error 401 — API admin sin token:

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

#### Archivos involucrados

| capa | archivo | qué hace |
| --- | --- | --- |
| Seeder | database/seeders/GnuVehicularBlueprintSeeder.php | **Modificado.** Método `contact()` con las 4 secciones + helpers `leadForm()` y `map()` |
| Test | tests/Feature/VehicularContactTest.php | **Nuevo.** 7 tests: orden de secciones, captura de lead, validación en español, `site_id` ignorado, aislamiento de la bandeja, campos `fijo` del mapa, alta y desactivación de estación |
| Test | tests/Feature/VehicularHomeTest.php | **Modificado.** `vehicularSection()` acepta `$pageSlug` (dos tipos ahora se repiten entre páginas) y el test del menú espera Inicio → Contacto → Blog |
| Controlador (reusado) | app/Http/Controllers/Public/LeadController.php | Crea el lead con el sitio del route binding |
| Validación (reusada) | app/Http/Requests/Public/StoreLeadRequest.php | Espeja los `fields[]` bloqueados; mensajes en español |
| Modelo (reusado) | app/Models/Lead.php | `site_id` fuera de `#[Fillable]` a propósito |
| Controlador (reusado) | app/Http/Controllers/Admin/LeadController.php | Bandeja read-only, filtro `?site={slug}` vía `whereHas` |
| Controlador (reusado) | app/Http/Controllers/Public/StationController.php | Solo activas, sin paginar |
| Controlador (reusado) | app/Http/Controllers/Admin/StationController.php | CRUD completo, incluye inactivas |
| Validación (reusada) | app/Http/Requests/Admin/StationRequest.php | `site_id` requerido al crear, `prohibited` al actualizar |
| Rutas | routes/public.php · routes/admin.php | Sin cambios: las rutas ya existían |
| Spec | .claude/skills/sitios-web-gnu/references/gnu-vehicular.md | Fila `/contacto` en el mapa, notas de clasificación, «pendiente de migrar» baja a 2 columnas |
| Spec | .claude/skills/sitios-web-gnu/references/section-types.md | `billing_info` sale de candidatos sin verificar y entra en «descartados, con motivo» |
| Estado | .claude/skills/sitios-web-gnu/references/implementation-status.md | 4 tipos ahora también en `/contacto`; qué está sembrado hoy |
| Estado | .claude/skills/cms-gnu-backend/references/functionality-map.md | Fila 17 → 3 de 5 columnas; pendiente conocido del origen del lead |

**Verificación:** 106 tests / 428 aserciones en verde, Pint aplicado, y `pages/contacto`, `menu` y `POST leads` comprobados contra Herd tras un `migrate:fresh --seed`.
