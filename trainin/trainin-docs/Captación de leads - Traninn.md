# Captación de leads \- Traninn

*Cómo el sitio *`traninn-logistic`* envía los formularios de contacto al CMS y cómo el panel los consulta. El motor es genérico para los 4 sitios; este documento lo aterriza a los dos formularios que tiene Traninn: el de la portada (*`/`*) y el de la columna Contacto (*`/contacto`*).*

---


---

## Flujo Simple

```
Paso 1: El front pide la página al CMS
        GET /api/public/traninn-logistic/pages/contacto
        ⬇️
Paso 2: Renderiza la sección `lead_capture_form`
        title, intro, submit_label y fields[] vienen del CMS
        ⬇️
Paso 3: El visitante llena y envía el formulario
        POST /api/public/traninn-logistic/leads
        ⬇️
Paso 4: Middleware throttle:10,1
        máx. 10 envíos por minuto por IP → 429
        ⬇️
Paso 5: StoreLeadRequest valida
        site_id sale de la URL (nunca del body)
        source debe ser una página publicada del sitio
        details solo acepta claves declaradas en fields[]
        ⬇️
Paso 6: Se inserta la fila en `leads` con site_id + source
        ⬇️
Paso 7: 201 con mensaje de agradecimiento (sin devolver el lead)
        ⬇️
Paso 8: El admin lo lee en el panel
        GET /api/admin/leads?site=traninn-logistic&source=contacto
```

## Decisiones Clave de Implementación

1. **El sitio nunca viaja en el body**

`site_id` no es `fillable` en el modelo y `StoreLeadRequest` no lo valida: se toma del segmento `{site}` de la ruta. Un `site_id` enviado en el JSON se ignora en silencio.

```js
// app/Http/Controllers/Public/LeadController.php
public function store(StoreLeadRequest $request, Site $site): JsonResponse
{
    // El lead cuelga del sitio resuelto por la URL, no de lo que mande el cliente.
    $site->leads()->create($request->validated());

    return response()->json([
        'status' => 'success',
        'data' => null,
        'meta' => ['message' => 'Gracias por contactarnos. Un asesor se comunicará contigo.'],
    ], 201);
}
```

Se responde `data: null` a propósito: el sitio público no tiene nada que leer de vuelta.

1. `source`** es el slug de la página, y se valida contra la BD**

Traninn tiene **dos** formularios. Sin `source` la bandeja no distingue una duda desde la portada de un contacto formal.

```
// app/Http/Requests/Public/StoreLeadRequest.php
'source' => [
    'nullable',
    'string',
    // No es frontera de confianza como site_id —un valor falseado solo
    // etiqueta mal una fila— pero se valida contra las páginas publicadas
    // del sitio para que la bandeja siga siendo útil.
    Rule::exists('pages', 'slug')
        ->where('site_id', $site->id)
        ->where('is_published', true),
],
```

Valores válidos hoy en Traninn: `inicio` y `contacto`. Cualquier otro → 422.

1. `fields[]`** de la sección es vinculante, no una sugerencia**

Los 4 campos core (`name`, `email`, `phone`, `message`) son columnas de `leads`. Cualquier campo extra que un formulario declare viaja en la columna JSON `details`, y el request lee la sección de la que vino el lead para rechazar claves no declaradas:

```
private function declaredExtraFields(Site $site): array
{
    $source = $this->string('source')->toString();

    if ($source === '') {
        return []; // Sin source no hay formulario contra qué validar: cerrado por defecto.
    }

    $section = $site->sections()
        ->where('type', 'lead_capture_form')
        ->whereHas('page', fn ($page) => $page->where('slug', $source))
        ->first();

    return array_values(array_diff($section?->content['fields'] ?? [], Lead::CORE_FIELDS));
}
```

**Los dos formularios de Traninn no declaran extras**, así que hoy cualquier `details` enviado desde este sitio se rechaza con 422. Si mañana se agrega, p. ej., `cargo_type` al `fields[]` de la sección, empieza a aceptarse sin tocar código ni migraciones.

1. `fields[]`** está bloqueado para el administrador**

El admin puede cambiar `title`, `intro` y `submit_label` desde el panel, pero no la lista de campos: cada entrada core corresponde a una columna de `leads`, así que cambiarla es cambio de código.

```
// app/Http/Requests/Admin/UpdateSectionRequest.php
'lead_capture_form' => [ /* title, intro, submit_label editables; fields fijo */ ],
```

Un `PUT` que mande `fields` responde **200** y descarta ese campo — no falla, simplemente no lo aplica.

## Configuración

- No requiere variables de entorno nuevas. `JWT_SECRET` ya existe para el lado admin.
- El throttle está en la ruta, no en config: `->middleware('throttle:10,1')`.
- La página `/contacto` y su sección se crean con el seeder, no por API:

```
php artisan db:seed --class=TraninnLogisticBlueprintSeeder   # idempotente
```

- El front debe apuntar a la base del CMS (`http://gnu-headless-cms.test` en local) y al slug `traninn-logistic`.

## Implementación

**Estructura de la Petición (pública)**

```
Headers requeridos:
Content-Type: application/json
Accept: application/json

Sin autenticación. La única escritura abierta de la API pública.
```

**Paso previo — leer la sección para pintar el formulario**

```
GET /api/public/traninn-logistic/pages/contacto
```

```json
{
  "status": "success",
  "data": {
    "slug": "contacto",
    "path": "/contacto",
    "title": "Contacto",
    "sections": [
      {
        "type": "page_hero",
        "content": { "title": "Contacto", "subtitle": "Estamos para ayudarte.", "image": null }
      },
      {
        "type": "lead_capture_form",
        "content": {
          "title": "Escríbenos",
          "intro": "Déjanos tus datos y un asesor se comunicará contigo.",
          "submit_label": "Enviar",
          "fields": ["name", "email", "phone", "message"]
        }
      }
    ]
  },
  "meta": { "site": "traninn-logistic" }
}
```

El front debe **renderizar los inputs a partir de **`fields[]`, no hardcodearlos: es la misma lista que el backend usa para validar.

**Endpoint Principal**

```
POST /api/public/traninn-logistic/leads
```

**Ejemplo de Petición**

```json
{
    "source": "contacto",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "4430000000",
    "message": "Necesito transporte de GNC de Morelia a Uruapan."
}
```

Desde el formulario de la portada, el único cambio es `"source": "inicio"`.

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": null,
    "meta": { "message": "Gracias por contactarnos. Un asesor se comunicará contigo." }
}
```

Muestra `meta.message` tal cual al visitante: ya viene en español y es la única confirmación que da la API.

**Reglas de validación**

| campo | obligatorio | reglas |
| --- | --- | --- |
| `name` | **sí** | string, máx. 255 |
| `email` | **sí** | email válido, máx. 255 |
| `phone` | no | string, máx. 30 |
| `message` | no | string, máx. 2000 |
| `source` | no (recomendado) | slug de una página publicada del sitio: `inicio` o `contacto` |
| `details` | no | objeto; en Traninn siempre se rechaza (ningún formulario declara extras) |

## Endpoints

**Bandeja del panel — listar leads**

```
GET /api/admin/leads?site=traninn-logistic&source=contacto&page=1
Authorization: Bearer {token}
```

Ambos filtros son opcionales y combinables. Sin `source` devuelve los dos formularios mezclados. Paginado de 20 en 20, más recientes primero.

```json
{
  "status": "success",
  "data": [
    {
      "id": 12,
      "site_id": 3,
      "source": "contacto",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "4430000000",
      "message": "Necesito transporte de GNC de Morelia a Uruapan.",
      "details": null,
      "created_at": "2026-09-02T18:40:11.000000Z",
      "updated_at": "2026-09-02T18:40:11.000000Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

**Ver un lead con su sitio**

```
GET /api/admin/leads/{id}
```

Incluye la relación `site` para que el panel muestre de dónde vino.

**Eliminar un lead**

```
DELETE /api/admin/leads/{id}
```

```json
{ "status": "success", "data": null, "meta": { "message": "Lead eliminado correctamente" } }
```

**No existen **`POST`** ni **`PUT`** en **`/api/admin/leads` — responden 405. Un lead solo nace en el formulario público.

**Complemento: datos de contacto del sitio**

La dirección, teléfono, horario, redes y WhatsApp **no son parte de la página** `/contacto`: son secciones globales.

```
GET /api/public/traninn-logistic/globals
```

```json
{
  "status": "success",
  "data": {
    "contact_info": {
      "address": "Av. Ejemplo 789, Morelia, Michoacán",
      "phone": "+52 443 000 0000",
      "email": "contacto@traninnlogistic.mx",
      "schedule": "Lunes a viernes de 8:00 a 18:00",
      "additional_info": null
    },
    "social_icons": { "networks": [{ "network": "facebook", "url": "..." }] },
    "whatsapp_button": { "phone": "+524430000000", "prefilled_message": "Hola, quiero información..." }
  },
  "meta": { "site": "traninn-logistic" }
}
```

**Respuestas de Error Comunes**

**422 — Validación** (formato nativo de Laravel, distinto del `{data, meta}` del resto)

```json
{
  "message": "Escribe tu nombre. (and 1 more error)",
  "errors": {
    "name": ["Escribe tu nombre."],
    "email": ["El correo electrónico no es válido."]
  }
}
```

**422 — **`source`** inválido**

```json
{
  "message": "El origen del formulario no corresponde a una página de este sitio.",
  "errors": { "source": ["El origen del formulario no corresponde a una página de este sitio."] }
}
```

**422 — campo extra no declarado**

```json
{
  "message": "El formulario de esta página no acepta: cargo_type.",
  "errors": { "details": ["El formulario de esta página no acepta: cargo_type."] }
}
```

**429 — Demasiados envíos** (más de 10 por minuto por IP)

```
HTTP 429 Too Many Requests
Retry-After: 60
```

**404 — Sitio o página inexistente**

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

**401 — Sin token en la API admin**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```
