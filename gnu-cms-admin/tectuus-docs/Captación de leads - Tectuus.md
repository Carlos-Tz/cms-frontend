# Captación de leads \- Tectuus

# 

*Formulario público que capta datos de contacto de visitantes y los deposita en la bandeja del panel. Tectuus tiene **dos** formularios —el de la portada y el de la columna Contacto— y *`leads.source`* es lo que los distingue.*


## Flujo Simple

```
VISITANTE                                ADMIN
─────────                                ─────
POST /api/public/tectuus/leads
⬇️
throttle:10,1  (única escritura pública, limitada)
⬇️
Route binding {site:slug} → Site
⬇️
StoreLeadRequest
 · site_id NUNCA se acepta del cliente
 · source validado contra páginas PUBLICADAS del sitio
 · details validado contra el fields[] de esa sección
⬇️
$site->leads()->create(...)              GET /api/admin/leads?site=tectuus&source=contacto
⬇️                                       ⬇️
leads (site_id inyectado por relación)   auth:api (JWT)
⬇️                                       ⬇️
201 { data: null, meta.message }         latest() + paginate(20)
                                         ⬇️
                                         200 {status, data[], meta}
```

## Decisiones Clave de Implementación

`site_id`** no es fillable — es la frontera de confianza**

```
// app/Models/Lead.php
#[Fillable([... sin 'site_id' ...])]

// app/Http/Controllers/Public/LeadController.php
$site->leads()->create($request->validated());
```

El sitio sale **siempre** del segmento `{site:slug}` de la ruta. Aunque el cliente mande `site_id` en el JSON, se cae del payload. Hay un test dedicado a esto.

`leads.source`** es lo que separa los dos formularios del sitio**

Sin esta columna, la bandeja de Tectuus mezclaría una duda general de la portada con una solicitud de cotización de la página de contacto. `source` guarda el **slug de la página** cuyo formulario produjo el lead:

```
// app/Http/Requests/Public/StoreLeadRequest.php
'source' => [
    'nullable',
    'string',
    Rule::exists('pages', 'slug')
        ->where('site_id', $site->id)
        ->where('is_published', true),
],
```

Sí es fillable, a diferencia de `site_id`: no es frontera de confianza — un valor falsificado solo etiqueta mal una fila. Aun así se valida contra las páginas publicadas del sitio para que la bandeja no se llene de basura. Es `nullable` para que un front que no lo mande siga funcionando.

`fields[]`** es un contrato que el backend hace cumplir**

El campo `fields[]` de la sección `lead_capture_form` está marcado `fijo` en el catálogo, y no es decorativo: define qué campos extra acepta ese formulario, y el request los valida.

```
// app/Http/Requests/Public/StoreLeadRequest.php
private function onlyDeclaredFields(Site $site): Closure
{
    return function (string $attribute, mixed $value, Closure $fail) use ($site): void {
        $unknown = array_diff(array_keys((array) $value), $this->declaredExtraFields($site));

        if ($unknown !== []) {
            $fail('El formulario de esta página no acepta: '.implode(', ', $unknown).'.');
        }
    };
}
```

**Los dos formularios de Tectuus no declaran extras** —solo `name`, `email`, `phone`, `message`, que son columnas de `leads`— así que **cualquier clave en **`details`** es un 422**. Cerrado por defecto.

**Los dos formularios sembrados**

```js
// TectuusBlueprintSeeder — portada, posición 4
$this->section($site, $home, 'lead_capture_form', 4, [
    'title' => 'Contacto',
    'intro' => 'Déjanos tus datos y un asesor se comunicará contigo.',
    'submit_label' => 'Enviar',
    // Locked: the four core entries map to columns of `leads`.
    'fields' => ['name', 'email', 'phone', 'message'],
]);

// TectuusBlueprintSeeder — /contacto, posición 2
$this->section($site, $contact, 'lead_capture_form', 2, [
    'title' => 'Escríbenos',
    // ... mismos fields
]);
```

**Esta funcionalidad no necesitó código nuevo.** El mecanismo de `source` y de `fields[]` ya era genérico desde `gnu-vehicular`; lo único que se agregó fue la columna *Contacto* en el seeder y sus tests.

## Configuración

- Rate limit: `throttle:10,1` (10 peticiones por minuto por IP), declarado en la ruta. Es la única escritura pública junto con las citas.
- Sin variables de entorno. **La notificación por correo al destinatario no está implementada** y es una decisión registrada, no un olvido: la bandeja del panel cubre la necesidad y el spec no define dónde viviría la configuración del destinatario.

## Implementación

**Estructura de la Petición (pública)**

```
Headers requeridos:
Content-Type: application/json
Accept: application/json
```

Sin `Authorization`: es un endpoint abierto.

**Endpoint Principal**

```
POST /api/public/tectuus/leads
```

**Ejemplo de Petición** — formulario de la columna Contacto

```json
{
    "source": "contacto",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "4430000000",
    "message": "Necesito una cotización de compresoras."
}
```

Desde la portada, el único cambio es `"source": "inicio"`.

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": null,
    "meta": { "message": "Gracias por contactarnos. Un asesor se comunicará contigo." }
}
```

`data` es `null` a propósito: el sitio público no tiene nada que leer de vuelta, y el panel es el único consumidor de esos datos.

## Endpoints

### Público

| Método | URI | Nota |
| --- | --- | --- |
| POST | `/api/public/{site}/leads` | `throttle:10,1`. Única escritura del formulario |

### Admin — bandeja de solo lectura (JWT)

```
GET /api/admin/leads?site=tectuus
GET /api/admin/leads?site=tectuus&source=contacto
```

```json
{
    "status": "success",
    "data": [
        {
            "id": 12,
            "site_id": 4,
            "source": "contacto",
            "name": "Juan Pérez",
            "email": "juan@example.com",
            "phone": "4430000000",
            "message": "Necesito una cotización de compresoras.",
            "details": null,
            "created_at": "2026-09-04T22:20:00.000000Z"
        }
    ],
    "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

| Método | URI | Nota |
| --- | --- | --- |
| GET | `leads` | `?site={slug}&source={pageSlug}`, `latest()`, `paginate(20)` |
| GET | `leads/{lead}` | el lead con su sitio |
| DELETE | `leads/{lead}` | mensaje |

**No hay **`POST`** ni **`PUT`** de leads en admin, a propósito**: un lead lo genera el visitante.

**Respuestas de Error Comunes**

**Error 422 — campo no declarado por el formulario**

```json
{
    "message": "El formulario de esta página no acepta: rfc.",
    "errors": { "details": ["El formulario de esta página no acepta: rfc."] }
}
```

**Error 422 — **`source`** que no corresponde al sitio**

```json
{
    "message": "El origen del formulario no corresponde a una página de este sitio.",
    "errors": { "source": ["El origen del formulario no corresponde a una página de este sitio."] }
}
```

**Error 429 — límite de tasa excedido**

```json
{ "message": "Too Many Attempts." }
```
