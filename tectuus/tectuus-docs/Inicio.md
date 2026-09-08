# Inicio

*Alta del sitio *`tectuus`* en el CMS y siembra de su portada con las 4 secciones que declara el árbol del cliente, más las 3 secciones globales del sitio. No hay código de aplicación nuevo: la funcionalidad es un blueprint (seeder) que se apoya en tipos de sección que ya existían.*

---

---

### Flujo Simple

```
Paso 1: php artisan db:seed --class=TectuusBlueprintSeeder
⬇️
Paso 2: Site::updateOrCreate(slug: 'tectuus')   → crea/reusa la fila del sitio
⬇️
Paso 3: home($site)    → page('inicio', '/')  +  4 sections con page_id
        globals($site) → 3 sections con page_id = null
⬇️
Paso 4: Upserts idempotentes en `sites`, `pages`, `sections`
⬇️
Paso 5: El front consume GET /api/public/tectuus/pages/inicio
        y el admin edita valores con PUT /api/admin/sections/{id}
```

### Decisiones Clave de Implementación

1. **El blueprint es un seeder, no config**

No existe `config/blueprints/tectuus.php`. La estructura vive en una subclase de `BlueprintSeeder`, que aporta los dos únicos helpers idénticos entre sitios:

```js
// database/seeders/BlueprintSeeder.php — upserts compartidos
protected function page(Site $site, string $slug, string $path, string $title, int $position, ?Page $parent = null): Page
{
    return Page::updateOrCreate(
        ['site_id' => $site->id, 'slug' => $slug],   // clave del upsert
        ['parent_id' => $parent?->id, 'path' => $path, 'title' => $title, 'position' => $position, 'is_published' => true],
    );
}

// Clave (site, page, type): una instancia por tipo por página. Por eso re-sembrar no duplica.
protected function section(Site $site, ?Page $page, string $type, int $position, array $content): void
{
    $site->sections()->updateOrCreate(
        ['page_id' => $page?->id, 'type' => $type],
        ['position' => $position, 'content' => $content],
    );
}
```

1. **Clasificación del árbol del cliente: los hijos de *****Inicio***** son secciones, no páginas**

Regla 1 de `references/gnu.md`. «Carrusel de banners», «Nuestros clientes» y «Contacto» no son subpáginas: son bloques de la portada. «Contacto» ahí es el formulario, distinto de la columna *Contacto* del menú.

```
private function home(Site $site): void
{
    // La portada NO lleva page_hero: el carrusel es su hero, igual que en los otros 3 sitios.
    $home = $this->page($site, 'inicio', '/', 'Inicio', 1);

    $this->section($site, $home, 'banner_carousel', 1, [...]);   // «Carrusel de banners»
    $this->section($site, $home, 'rich_text', 2, [...]);         // no está en el árbol; ver punto 3
    $this->section($site, $home, 'clients_showcase', 3, [...]);  // «Nuestros clientes»
    $this->section($site, $home, 'lead_capture_form', 4, [...]); // «Contacto»
}
```

1. **El **`rich_text`** extra absorbe el requisito «soporte para videos»**

El cliente lo declaró en *Requisitos principales*, no en el árbol. `rich_text.video_url` es el único lugar del catálogo donde ese requisito aterriza — no existe un tipo `video_embed`. Mismo criterio que en `gnu` y `traninn-logistic`.

1. `fields[]`** del formulario se siembra bloqueado**

```js
$this->section($site, $home, 'lead_capture_form', 4, [
    'title' => 'Contacto',
    'intro' => 'Déjanos tus datos y un asesor se comunicará contigo.',
    'submit_label' => 'Enviar',
    // Locked: the four core entries map to columns of `leads`, and this
    // form declares no extras, so it accepts nothing beyond them.
    'fields' => ['name', 'email', 'phone', 'message'],
]);
```

Es campo `fijo` del contrato de editabilidad. Se hace cumplir sin código nuevo: `UpdateSectionRequest::SCHEMAS` **omite** la clave `fields`, así que se cae del payload validado, y `SectionController@update` hace `array_merge($section->content, $validated)`, conservando el valor sembrado. Hay una prueba que lo demuestra.

1. **Secciones globales = **`page_id`** nulo**

```
private function globals(Site $site): void
{
    $this->section($site, null, 'contact_info', 1, [...]);
    $this->section($site, null, 'social_icons', 2, [...]);  // el nodo verde del árbol
    $this->section($site, null, 'whatsapp_button', 3, [...]);
}
```

1. **Lo que este sitio NO lleva, a propósito**

`savings_simulator`, `stations_map` y `testimonials`. Tectuus es el único de los 4 sin simulador de ahorro, así que su endpoint responde 404 — es el blueprint, no un hueco. Hay una prueba que lo fija.

### Configuración

Ninguna nueva. Ni migraciones, ni variables de entorno, ni tipos de sección nuevos:

- `sections.type` es `string` libre y `sections.content` es JSON → un sitio nuevo o un tipo nuevo no requieren migración.
- Los 7 tipos usados ya tenían entrada en `UpdateSectionRequest::SCHEMAS`, así que la portada nace editable desde el panel.

Único registro necesario, para que `php artisan db:seed` incluya el sitio:

```
// database/seeders/DatabaseSeeder.php
$this->call([
    AdminUserSeeder::class,
    GnuBlueprintSeeder::class,
    GnuVehicularBlueprintSeeder::class,
    TraninnLogisticBlueprintSeeder::class,
    TectuusBlueprintSeeder::class,   // ← agregado
]);
```

### Implementación

**Mapa sembrado**

| # | ruta | título | padre | pos | secciones (en orden) |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | Inicio | — | 1 | `banner_carousel`, `rich_text`, `clients_showcase`, `lead_capture_form` |

Globales (`page_id = null`): `contact_info`, `social_icons`, `whatsapp_button`. **Total: 7 filas en **`sections`**, 1 en **`pages`**, 1 en **`sites`**.**

**Ejecución**

```
php artisan db:seed --class=TectuusBlueprintSeeder   # idempotente: correrlo dos veces deja 7 secciones
```

### Endpoints

Ninguno nuevo. Los que ya existían ahora responden para el sitio `tectuus`.

**Portada con sus secciones en orden** — lectura pública, sin auth

```
GET /api/public/tectuus/pages/inicio
```

```json
{
  "status": "success",
  "data": {
    "slug": "inicio",
    "path": "/",
    "title": "Inicio",
    "sections": [
      { "type": "banner_carousel",   "content": { "slides": [ { "image": "media/placeholder-banner-tectuus.jpg", "title": "Equipo industrial para gas natural", "subtitle": "EDRM, compresoras y valvulería.", "link_url": null, "link_label": null } ] } },
      { "type": "rich_text",         "content": { "title": null, "body": "<p>Contenido pendiente de redactar.</p>", "video_url": null } },
      { "type": "clients_showcase",  "content": { "title": "Nuestros clientes", "logos": [ { "image": "media/placeholder-logo.png", "name": "Cliente de ejemplo", "url": null } ] } },
      { "type": "lead_capture_form", "content": { "title": "Contacto", "intro": "Déjanos tus datos y un asesor se comunicará contigo.", "submit_label": "Enviar", "fields": ["name","email","phone","message"] } }
    ]
  },
  "meta": { "site": "tectuus" }
}
```

**Secciones globales**

```
GET /api/public/tectuus/globals
```

```json
{
  "status": "success",
  "data": {
    "contact_info":    { "address": "Av. Ejemplo 321, Morelia, Michoacán", "phone": "+52 443 000 0000", "email": "contacto@tectuus.mx", "schedule": "Lunes a viernes de 9:00 a 18:00", "additional_info": null },
    "social_icons":    { "networks": [ { "network": "facebook", "url": "https://facebook.com/tectuus" }, { "network": "linkedin", "url": "https://linkedin.com/company/tectuus" } ] },
    "whatsapp_button": { "phone": "+524430000000", "prefilled_message": "Hola, quiero información sobre equipo industrial." }
  },
  "meta": { "site": "tectuus" }
}
```

`testimonials` no aparece: no está declarado para este sitio.

**Menú de navegación**

```
GET /api/public/tectuus/menu
```

```json
{ "status": "success", "data": [ { "slug": "inicio", "path": "/", "title": "Inicio", "children": [] } ], "meta": { "site": "tectuus" } }
```

Solo una columna, porque las otras tres aún no están sembradas.

**Edición de valores por el admin** — requiere JWT

```
Headers requeridos:
Authorization: Bearer {token}
Content-Type: application/json

PUT /api/admin/sections/{id}
```

Petición (reemplazo de los logos de `clients_showcase`):

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

Respuesta exitosa (HTTP 200):

```
{ "status": "success", "data": { "id": 1, "type": "clients_showcase", "content": { "title": "Empresas que confían en nosotros", "logos": [ ... ] } }, "meta": { "message": "Sección actualizada." } }
```

**Comportamiento con campo **`fijo` — responde 200 pero descarta el cambio:

```
// Petición: { "content": { "title": "Escríbenos", "submit_label": "Enviar", "fields": ["name","rfc"] } }
// Estado guardado después:  fields = ["name","email","phone","message"]
```

**Simulador de ahorro — 404 esperado**

```
GET /api/public/tectuus/savings-simulator?fuel=diesel&quantity=1000
→ HTTP 404
```

Tectuus no declara `savings_simulator`; el `firstOrFail()` del controlador no encuentra sección que resolver.
