# Página de inicio — Sitio GNU

*Gestión del contenido de la portada de GNU: carrusel de banners, simulador de ahorro, cards de clientes y datos de contacto. El administrador edita valores desde el panel; el sitio web los consume en modo lectura.*

---

---

## Flujo Simple

**A) Panel de administración (escritura)**

```
Paso 1: Login → POST /api/admin/auth/login → token JWT
⬇️
Paso 2: Cargar secciones → GET /api/admin/sections?site=gnu
⬇️
Paso 3: (si hay imagen) Subir archivo → POST /api/admin/media → url
⬇️
Paso 4: Middleware auth:api valida el token
⬇️
Paso 5: UpdateSectionRequest valida content según el `type` de la sección
⬇️
Paso 6: Merge sobre el contenido guardado (conserva campos bloqueados) → UPDATE sections
⬇️
Paso 7: 200 con la sección actualizada
```

**B) Sitio web GNU (lectura)**

```
Paso 1: GET /api/public/gnu/pages/inicio  +  GET /api/public/gnu/globals
⬇️
Paso 2: Resolución del sitio por slug (route model binding)
⬇️
Paso 3: Se descartan páginas no publicadas
⬇️
Paso 4: Render por tipo de sección, en el orden recibido
⬇️
Paso 5: (interacción del usuario) GET /savings-simulator?fuel=&quantity= → cálculo en backend
```

---

## Decisiones Clave de Implementación

1. **Un solo endpoint de escritura para las cuatro funcionalidades**

No hay CRUD por banner ni por card. Un banner, un logo y un precio son **ítems de una colección** dentro del JSON de la sección: se envía el arreglo completo tal como debe quedar. Crear = agregar un elemento, borrar = omitirlo, reordenar = cambiar su posición en el arreglo.

```js
// app/Http/Controllers/Admin/SectionController.php
public function update(UpdateSectionRequest $request, Section $section): JsonResponse
{
    // Los campos bloqueados no vienen en validated(), así que el merge los conserva.
    $section->update([
        'content' => array_merge($section->content, $request->validated('content')),
    ]);
    // ...
}
```

1. **La validación depende del tipo de sección**

El `type` nunca se acepta del cliente: viene de la base. El FormRequest arma sus reglas a partir del tipo de la sección que se está editando.

```js
// app/Http/Requests/Admin/UpdateSectionRequest.php
private const SCHEMAS = [
    'banner_carousel' => [
        'slides' => ['present', 'array'],
        'slides.*.image' => ['required', 'string', 'max:2048'],
        // ...
    ],
    // savings_simulator, clients_showcase, contact_info, ...
];

public function rules(): array
{
    $section = $this->route('section');
    $rules = ['content' => ['required', 'array']];

    foreach (self::SCHEMAS[$section->type] as $field => $fieldRules) {
        $rules["content.{$field}"] = $fieldRules;
    }

    return $rules;
}
```

1. **El cálculo del ahorro es código, no contenido**

El administrador mantiene los precios de referencia; la fórmula vive en el backend. La fila con `fuel = "gas-natural"` es el precio que vende la empresa y la base de toda comparación.

```
// app/Http/Controllers/Public/SavingsSimulatorController.php
$currentCost = $quantity * $current['price_per_unit'];            // costo actual
$gasQuantity = $quantity * $current['equivalence_factor'];         // m³ equivalentes
$gasCost     = $gasQuantity * $base['price_per_unit'];             // costo en gas natural
$savings     = $currentCost - $gasCost;
```

1. **Secciones globales vs. de página**

`sections.page_id = null` marca contenido de todo el sitio (contacto, redes, WhatsApp). Se sirve por separado en `/globals`, indexado por tipo, para que el layout del sitio lo pida una sola vez.

---

## Configuración

- Base URL local: `http://gnu-headless-cms.test/api`
- `JWT_SECRET` en `.env` (`php artisan jwt:secret` si falta)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credenciales del admin creado por el seeder
- `php artisan storage:link` — requerido para que las URLs de imágenes respondan
- `php artisan db:seed --class=GnuBlueprintSeeder` — crea el sitio, la página y sus secciones (idempotente)
- `APP_LOCALE=es` — mensajes de validación en español

---

## Implementación

**Headers**

```
# API admin (todo excepto login)
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json

# API pública
Accept: application/json
```

**Formato de toda respuesta**

```json
{ "status": "success", "data": {}, "meta": {} }
```

**IDs sembrados en local** (el panel debe descubrirlos con `GET /api/admin/sections`, no hardcodearlos)

| id | tipo | ámbito |
| --- | --- | --- |
| 1 | `banner_carousel` | página inicio |
| 2 | `savings_simulator` | página inicio |
| 3 | `clients_showcase` | página inicio |
| 4 | `lead_capture_form` | página inicio |
| 5 | `contact_info` | global |
| 6 | `social_icons` | global |
| 7 | `whatsapp_button` | global |

---

# Endpoints — Panel de administración

### Listar secciones editables

```
GET /api/admin/sections?site=gnu
```

Parámetros: `site` (slug), `page` (slug de la página), `global=1` (solo secciones globales). Se pueden combinar.

**Respuesta (200)**

```json
{
  "status": "success",
  "data": [
    { "id": 1, "site_id": 1, "page_id": 1, "type": "banner_carousel", "position": 1, "content": { "slides": [] } }
  ],
  "meta": { "total": 7 }
}
```

El panel debe construir su formulario a partir del campo `type`. `GET /api/admin/sections/{id}` devuelve una sola sección con la misma forma.

### Subir imagen

```
POST /api/admin/media
Content-Type: multipart/form-data
```

Campo `file` — imagen, máximo 5 MB.

**Respuesta (201)**

```json
{
  "status": "success",
  "data": { "path": "media/9xKq2.jpg", "url": "http://gnu-headless-cms.test/storage/media/9xKq2.jpg" },
  "meta": { "message": "Archivo subido correctamente" }
}
```

El valor a guardar en el campo `image` de un slide o logo es el `path` (o la `url`, ambos son strings válidos).

### Actualizar contenido de una sección

```
PUT /api/admin/sections/{id}
```

Regla general: **se envía el contenido completo de la sección**, no un parche. Los arreglos reemplazan al anterior.

---

**Carrusel de banners** (`banner_carousel`)

```json
{
  "content": {
    "slides": [
      {
        "image": "media/banner-1.jpg",
        "title": "Energía que impulsa a México",
        "subtitle": "Gas natural comprimido, distribuido y vehicular.",
        "link_url": "https://gnu.mx/nuestros-servicios",
        "link_label": "Conoce más"
      },
      { "image": "media/banner-2.jpg", "title": "Segundo banner", "subtitle": null, "link_url": null, "link_label": null }
    ]
  }
}
```

| campo | tipo | obligatorio |
| --- | --- | --- |
| `slides` | arreglo (puede ir vacío) | sí |
| `slides[].image` | string, máx. 2048 | sí |
| `slides[].title` | string, máx. 255 | no |
| `slides[].subtitle` | string, máx. 1000 | no |
| `slides[].link_url` | URL válida | no |
| `slides[].link_label` | string, máx. 255 | no |

---

**Cards informativos de clientes** (`clients_showcase`)

```json
{
  "content": {
    "title": "Nuestros clientes",
    "logos": [
      { "image": "media/cliente-1.png", "name": "Transportes del Norte", "url": "https://cliente.com" },
      { "image": "media/cliente-2.png", "name": "Industrias ACME", "url": null }
    ]
  }
}
```

| campo | tipo | obligatorio |
| --- | --- | --- |
| `title` | string, máx. 255 | no |
| `logos` | arreglo | sí |
| `logos[].image` | string, máx. 2048 | sí |
| `logos[].name` | string, máx. 255 | sí |
| `logos[].url` | URL válida | no |

---

**Simulador de ahorro — precios** (`savings_simulator`)

```json
{
  "content": {
    "title": "Simulador de ahorro",
    "intro": "Calcula cuánto ahorras al cambiar tu combustible actual por gas natural.",
    "fuel_prices": [
      { "fuel": "gas-natural", "label": "Gas natural", "price_per_unit": 12.50, "unit": "m³", "equivalence_factor": 1 },
      { "fuel": "diesel", "label": "Diésel", "price_per_unit": 25.90, "unit": "litro", "equivalence_factor": 0.95 },
      { "fuel": "gasolina", "label": "Gasolina", "price_per_unit": 24.30, "unit": "litro", "equivalence_factor": 0.84 }
    ]
  }
}
```

| campo | tipo | obligatorio |
| --- | --- | --- |
| `title` | string, máx. 255 | sí |
| `intro` | string, máx. 1000 | no |
| `fuel_prices` | arreglo | sí |
| `fuel_prices[].fuel` | slug identificador | sí |
| `fuel_prices[].label` | nombre visible | sí |
| `fuel_prices[].price_per_unit` | numérico ≥ 0 | sí |
| `fuel_prices[].unit` | string, máx. 20 | sí |
| `fuel_prices[].equivalence_factor` | numérico \> 0 | sí |

> **Precio del gas natural que vende la empresa:** es la fila con `fuel: "gas-natural"`. Es la base del comparativo y su `equivalence_factor` siempre es `1`. El `equivalence_factor` de los demás combustibles indica cuántos m³ de gas natural equivalen a 1 unidad de ese combustible.

---

**Datos de contacto** (`contact_info`, global)

```json
{
  "content": {
    "address": "Av. Ejemplo 123, Monterrey, Nuevo León",
    "phone": "+52 81 0000 0000",
    "email": "contacto@gnu.mx",
    "schedule": "Lunes a viernes de 9:00 a 18:00",
    "additional_info": "Atención a clientes industriales las 24 horas."
  }
}
```

| campo | tipo | obligatorio |
| --- | --- | --- |
| `address` | string, máx. 500 | sí |
| `phone` | string, máx. 40 | sí |
| `email` | correo válido | sí |
| `schedule` | string, máx. 500 | no |
| `additional_info` | string, máx. 2000 | no |

---

**Redes sociales** (`social_icons`, global)

```json
{
  "content": {
    "networks": [
      { "network": "facebook", "url": "https://facebook.com/gnu" },
      { "network": "instagram", "url": "https://instagram.com/gnu" }
    ]
  }
}
```

`network` solo acepta: `facebook`, `instagram`, `twitter`, `linkedin`, `youtube`, `tiktok` — está atado a los íconos del front-end. El panel debe mostrarlo como select, no como texto libre.

---

**Botón de WhatsApp** (`whatsapp_button`, global)

```json
{ "content": { "phone": "+528100000000", "prefilled_message": "Hola, quiero información sobre gas natural." } }
```

---

**Formulario de leads** (`lead_capture_form`)

```json
{ "content": { "title": "Contáctanos", "intro": "Déjanos tus datos.", "submit_label": "Enviar" } }
```

`fields` es un campo **bloqueado**: si se envía, se ignora y se conserva el valor guardado. El panel debe mostrarlo en solo lectura.

---

**Respuesta exitosa de cualquier actualización (200)**

```json
{
  "status": "success",
  "data": {
    "id": 1, "site_id": 1, "page_id": 1, "type": "banner_carousel", "position": 1,
    "content": { "slides": [] },
    "created_at": "2026-07-27T04:33:32.000000Z",
    "updated_at": "2026-07-27T04:35:02.000000Z"
  },
  "meta": { "message": "Sección actualizada correctamente" }
}
```

---

# Endpoints — Sitio web GNU (público)

Sin autenticación, solo lectura. El `{site}` es el slug: `gnu`.

### Contenido de la portada

```
GET /api/public/gnu/pages/inicio
```

**Respuesta (200)**

```json
{
  "status": "success",
  "data": {
    "slug": "inicio",
    "path": "/",
    "title": "Inicio",
    "sections": [
      { "type": "banner_carousel", "content": { "slides": [] } },
      { "type": "savings_simulator", "content": { "title": "Simulador de ahorro", "intro": "…", "fuel_prices": [] } },
      { "type": "clients_showcase", "content": { "title": "Nuestros clientes", "logos": [] } },
      { "type": "lead_capture_form", "content": { "title": "Contáctanos", "intro": "…", "submit_label": "Enviar", "fields": ["name","email","phone","message"] } }
    ]
  },
  "meta": { "site": "gnu" }
}
```

El arreglo `sections` **ya viene en el orden en que debe renderizarse**. El front recorre el arreglo y despacha por `type` a su componente; no debe reordenar ni asumir posiciones fijas.

### Datos globales del sitio

```
GET /api/public/gnu/globals
```

**Respuesta (200)**

```json
{
  "status": "success",
  "data": {
    "contact_info": { "address": "Av. Ejemplo 123, Monterrey, Nuevo León", "phone": "+52 81 0000 0000", "email": "contacto@gnu.mx", "schedule": "Lunes a viernes de 9:00 a 18:00", "additional_info": null },
    "social_icons": { "networks": [ { "network": "facebook", "url": "https://facebook.com/gnu" } ] },
    "whatsapp_button": { "phone": "+528100000000", "prefilled_message": "Hola, quiero información sobre gas natural." }
  },
  "meta": { "site": "gnu" }
}
```

Indexado por tipo, no arreglo: se consume una vez en el layout (header y footer).

### Simulador de ahorro (cálculo)

```
GET /api/public/gnu/savings-simulator?fuel={slug}&quantity={cantidad}
```

| parámetro | descripción |
| --- | --- |
| `fuel` | slug del combustible actual del usuario (`diesel`, `gasolina`). No puede ser `gas-natural`. |
| `quantity` | consumo en las unidades de ese combustible (litros). Debe ser mayor a 0. |

Los valores válidos de `fuel` salen del propio `savings_simulator` que ya recibió el front en `/pages/inicio`: se listan sus `fuel_prices` excluyendo `gas-natural`, y se usa `label` para mostrar y `fuel` para enviar.

**Ejemplo: 500 litros de gasolina**

```
GET /api/public/gnu/savings-simulator?fuel=gasolina&quantity=500
```

**Respuesta (200)**

```json
{
  "status": "success",
  "data": {
    "current_fuel": { "fuel": "gasolina", "label": "Gasolina", "quantity": 500, "unit": "litro", "price_per_unit": 24.3, "cost": 12150 },
    "natural_gas": { "quantity": 420, "unit": "m³", "price_per_unit": 12.5, "cost": 5250 },
    "savings": 6900,
    "savings_percent": 56.79
  },
  "meta": { "site": "gnu" }
}
```

Todos los importes vienen redondeados a 2 decimales; el front solo formatea moneda.

---

# Respuestas de error

**401 — Sin token o token inválido**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

**404 — Sitio, página o sección inexistente** (también cuando la página está despublicada)

```json
{ "status": "error", "data": null, "meta": { "message": "Recurso no encontrado" } }
```

**405 — Método no permitido** (ej. crear o borrar una sección)

**422 — Validación**

```json
{
  "message": "El campo content.slides.0.image es obligatorio.",
  "errors": {
    "content.slides.0.image": ["El campo content.slides.0.image es obligatorio."]
  }
}
```

Las llaves de `errors` conservan la ruta completa dentro de `content`, con el índice del ítem: el panel puede marcar el slide exacto que falla partiendo la llave por `.`.

**422 — Combustible no disponible en el simulador**

```json
{ "message": "El combustible seleccionado no está disponible para comparar.", "errors": { "fuel": ["El combustible seleccionado no está disponible para comparar."] } }
```

**503 — Falta el precio del gas natural** — la sección `savings_simulator` no tiene la fila `gas-natural`. El front debe ocultar el simulador si esto ocurre.

---

# Archivos involucrados

| Capa | Ruta | Descripción |
| --- | --- | --- |
| Rutas | routes/admin.php | Rutas privadas; `sections` limitado a index/show/update |
| Rutas | routes/public.php | Rutas públicas; `{site:slug}` resuelve el sitio |
| Bootstrap | bootstrap/app.php | Registro de las dos superficies API y respuestas de error 401/404 en español |
| Controlador (admin) | app/Http/Controllers/Admin/AuthController.php | Login, logout, me (JWT) |
| Controlador (admin) | app/Http/Controllers/Admin/SectionController.php | Listar, ver y actualizar contenido de secciones |
| Controlador (admin) | app/Http/Controllers/Admin/MediaController.php | Subida de imágenes al disco `public` |
| Controlador (público) | app/Http/Controllers/Public/PageController.php | Página con secciones + secciones globales |
| Controlador (público) | app/Http/Controllers/Public/SavingsSimulatorController.php | Cálculo del ahorro |
| Validación | app/Http/Requests/Admin/UpdateSectionRequest.php | Esquema de campos por tipo de sección |
| Modelo | app/Models/Site.php | Sitio; relación `globalSections()` |
| Modelo | app/Models/Page.php | Página; secciones ordenadas por `position` |
| Modelo | app/Models/Section.php | Sección; `content` casteado a arreglo |
| Migración | database/migrations/2026\_07\_27\_042542\_create\_sites\_table.php | Tabla `sites` |
| Migración | database/migrations/2026\_07\_27\_042543\_create\_pages\_table.php | Tabla `pages` |
| Migración | database/migrations/2026\_07\_27\_042544\_create\_sections\_table.php | Tabla `sections` con `content` JSON |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Estructura de la portada de GNU y secciones globales |
| Idioma | lang/es/validation.php | Mensajes de validación en español |
| Pruebas | tests/Feature/HomeContentTest.php | 13 casos: lectura pública, edición admin, cálculo, errores |
