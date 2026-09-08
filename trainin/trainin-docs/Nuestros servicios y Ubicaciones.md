# Nuestros servicios y Ubicaciones

*Cierra la migración de *`traninn-logistic`* de 2 a **4 de 5 columnas**: siembra la columna de servicios con sus tres páginas hijas y la columna de ubicaciones con su mapa, alimentado por la tabla *`stations`*. **Cero endpoints nuevos y cero código de aplicación**: los cuatro tipos de sección que usa ya eran editables y el CRUD de estaciones ya existía. Es seeder, tests y documentación.*

---

---

## Flujo Simple

```
Paso 1: Clasificar los nodos del árbol del cliente
        Transporte de GNC / Logística / Carga pesada → páginas
        Ubicaciones → cabeza de columna SIN nada declarado adentro
⬇️
Paso 2: Decidir la forma de Ubicaciones (el cliente no la dio)
        → page_hero + stations_map, pines desde la tabla `stations`
⬇️
Paso 3: TraninnLogisticBlueprintSeeder — services() y locations()
        siembran 5 páginas, 13 secciones y 2 filas de `stations`
⬇️
Paso 4: El admin edita secciones (PUT /sections/{id})
        y gestiona las bases con el CRUD de estaciones
⬇️
Paso 5: El front arma el menú y pinta el mapa
        GET /menu · GET /pages/{slug} · GET /stations
```

---

## Decisiones Clave de Implementación

### 1. Las tres hijas son páginas, no secciones

La regla 3 de clasificación de `gnu.md` solo convierte en secciones a los hijos de *Inicio* y *Contacto*. *Transporte de GNC*, *Logística* y *Carga pesada* cuelgan de *Nuestros servicios*, y ninguno de esos nombres coincide con un tipo del catálogo (que es la única excepción de la regla). Por lo tanto: tres páginas hijas, con `parent_id` apuntando a la cabeza de columna.

### 2. Ubicaciones: la forma la decidió el blueprint, no el cliente

Es el primer nodo del proyecto que llegó **literalmente vacío** — el árbol lo lista como *«columna final, sin subsecciones declaradas»*. Se resolvió reusando lo de los otros dos sitios en vez de inventar un tipo:

```js
private function locations(Site $site): void
{
    $locations = $this->page($site, 'ubicaciones', '/ubicaciones', 'Ubicaciones', 5);

    $this->section($site, $locations, 'page_hero', 1, [
        'title' => 'Ubicaciones',
        'subtitle' => 'Dónde operamos.',
        'image' => null,
    ]);

    $this->section($site, $locations, 'stations_map', 2, $this->map('Nuestras bases'));

    $this->stations($site);
}
```

**Ojo con la lectura del dato:** en `gnu` y `gnu-vehicular` las filas de `stations` son estaciones de carga; aquí son **bases de operación**. La tabla es la misma y el significado lo pone el sitio — quedó anotado en el blueprint y en el catálogo de tipos para que nadie lo lea al revés.

### 3. El helper `map()` **no** subió al seeder base

Es el tercer sitio con `stations_map`, así que la regla de tres invitaba a extraerlo. No se hizo, y con motivo: cada sitio centra su propia ciudad.

| seeder | `center` | ciudad |
| --- | --- | --- |
| `GnuBlueprintSeeder` | `25.6714,-100.3094` | Monterrey |
| `GnuVehicularBlueprintSeeder` | `19.7028,-101.1920` | Morelia |
| `TraninnLogisticBlueprintSeeder` | `19.7028,-101.1920` | Morelia |

No son tres copias del mismo valor, son tres valores distintos con la misma forma. Extraerlo obligaría a parametrizar coordenadas y zoom, que es exactamente el helper que ya existe.

### 4. Las páginas de servicio son informativas

Ninguna lleva `lead_capture_form`. El formulario vive en la portada y vivirá en la columna *Contacto*. Mismo criterio con el que *Estaciones móviles* de `gnu-vehicular` se quedó sin captura. La columna tampoco lleva `clients_showcase`, a diferencia de la equivalente de `gnu`: en este árbol *Nuestros clientes* cuelga de *Inicio* y de *Sobre nosotros*.

### 5. Las tres hijas se siembran en bucle

La forma se repite, así que el contenido va en una tabla de datos y no en tres bloques copiados:

```js
$pages = [
    ['transporte-de-gnc', 'Transporte de GNC', 1, 'Suministro de gas natural comprimido donde lo necesites.', [
        'Unidades certificadas', 'Cobertura regional', 'Suministro programado',
    ]],
    ['logistica', 'Logística', 2, 'Planeación y control de tus rutas.', [
        'Planeación de rutas', 'Monitoreo en tiempo real', 'Reportes de operación',
    ]],
    ['carga-pesada', 'Carga pesada', 3, 'Equipo y experiencia para cargas de gran tonelaje.', [
        'Flota de gran tonelaje', 'Maniobras especializadas', 'Seguro de carga',
    ]],
];

foreach ($pages as [$slug, $title, $position, $subtitle, $cards]) {
    $page = $this->page($site, $slug, "/nuestros-servicios/{$slug}", $title, $position, $services);

    $this->section($site, $page, 'page_hero', 1, [
        'title' => $title, 'subtitle' => $subtitle, 'image' => null,
    ]);
    $this->section($site, $page, 'rich_text', 2, $this->body());
    $this->section($site, $page, 'feature_grid', 3, $this->cards("Qué incluye {$title}", $cards));
}
```

### 6. Un test existente **tuvo que cambiar**

No es un test nuevo: el del menú en `TraninnAboutTest` afirmaba 2 columnas y *Sobre nosotros* en `data.1`. Con las dos columnas nuevas pasa a 4 columnas y `data.2`. Lo mismo aplica al front si ya estaba consumiendo el menú por índice.

---

## Configuración

Sin migraciones, sin variables de entorno, sin dependencias. Para aplicar:

```
php artisan db:seed --class=TraninnLogisticBlueprintSeeder   # idempotente
# o
php artisan migrate:fresh --seed
```

---

## Implementación

### Páginas y secciones sembradas

| ruta | pos | padre | secciones (en orden) |
| --- | --- | --- | --- |
| `/nuestros-servicios` | 2 | — | `page_hero`, `rich_text` |
| `/nuestros-servicios/transporte-de-gnc` | 1 | Nuestros servicios | `page_hero`, `rich_text`, `feature_grid` |
| `/nuestros-servicios/logistica` | 2 | Nuestros servicios | `page_hero`, `rich_text`, `feature_grid` |
| `/nuestros-servicios/carga-pesada` | 3 | Nuestros servicios | `page_hero`, `rich_text`, `feature_grid` |
| `/ubicaciones` | 5 | — | `page_hero`, `stations_map` |

**5 páginas, 13 secciones y 2 filas de **`stations`**.** La columna *Contacto* ocupa la posición 4 y no está sembrada: el menú la omite sin dejar hueco.

### IDs reales tras un `migrate:fresh --seed`

Útiles para probar de inmediato; cambian si se re-siembra desde cero.

| id | tipo | página |
| --- | --- | --- |
| 99 / 100 | `page_hero`, `rich_text` | `/nuestros-servicios` |
| 101 / 102 / 103 | `page_hero`, `rich_text`, `feature_grid` | `/transporte-de-gnc` |
| 104 / 105 / 106 | ídem | `/logistica` |
| 107 / 108 / 109 | ídem | `/carga-pesada` |
| 124 / 125 | `page_hero`, `stations_map` | `/ubicaciones` |
| 5 / 6 | — | filas de `stations`: Base Morelia, Base Uruapan |

---

## Endpoints

**Ninguno nuevo.** Las 53 rutas son las mismas de antes del commit. Lo que cambió es **qué devuelven** para `traninn-logistic` y **qué endpoints se activan** para este sitio, que antes no tenía ni mapa ni estaciones. Esta sección detalla los seis que el front y el panel van a usar contra el contenido nuevo.

### Envelope común

Toda respuesta implementada trae tres claves. `meta` lleva `site`, `total`, paginación o `message` según el caso.

```
{ "status": "success", "data": …, "meta": { … } }
```

---

### 9.1 · Menú del sitio — cambió su forma

```
GET /api/public/traninn-logistic/menu
```

Sin token. Deriva el árbol de las páginas **publicadas**; no hay CRUD de menús que mantener.

```
{
  "status": "success",
  "data": [
    { "title": "Inicio", "path": "/", "slug": "inicio", "children": [] },
    { "title": "Nuestros servicios", "path": "/nuestros-servicios", "slug": "nuestros-servicios",
      "children": [
        { "title": "Transporte de GNC", "path": "/nuestros-servicios/transporte-de-gnc", "children": [] },
        { "title": "Logística",         "path": "/nuestros-servicios/logistica",          "children": [] },
        { "title": "Carga pesada",      "path": "/nuestros-servicios/carga-pesada",       "children": [] }
      ] },
    { "title": "Sobre nosotros", "path": "/sobre-nosotros", "children": [ … 3 hijas … ] },
    { "title": "Ubicaciones", "path": "/ubicaciones", "slug": "ubicaciones", "children": [] }
  ],
  "meta": { "site": "traninn-logistic" }
}
```

> ⚠️ **Cambio incompatible para el front:** el menú pasó de **2 a 4 entradas** y *Sobre nosotros* se recorrió de `data.1` a `data.2`. Si algo indexa por posición, se rompe. Conviene indexar por `slug`. Despublicar una página la saca del menú **con toda su rama**.

---

### 9.2 · Página por slug — las 5 páginas nuevas

```
GET /api/public/traninn-logistic/pages/{slug}
```

Sin token. Slugs disponibles: `nuestros-servicios`, `transporte-de-gnc`, `logistica`, `carga-pesada`, `ubicaciones`. Devuelve las secciones **en el orden del blueprint**; el front las pinta en ese orden y no negocia.

Respuesta real de `/pages/ubicaciones`:

```json
{
  "status": "success",
  "data": {
    "slug": "ubicaciones",
    "path": "/ubicaciones",
    "title": "Ubicaciones",
    "sections": [
      { "type": "page_hero",
        "content": { "title": "Ubicaciones", "subtitle": "Dónde operamos.", "image": null } },
      { "type": "stations_map",
        "content": { "title": "Nuestras bases", "center": "19.7028,-101.1920", "zoom": "11" } }
    ]
  },
  "meta": { "site": "traninn-logistic" }
}
```

Nota de lectura para quien renderice: `stations_map`** no trae los pines.** Solo dice dónde va el mapa y con qué encuadre inicial. Los pines se piden aparte (9.3).

Una página despublicada responde **404 en español**, no un 200 vacío.

---

### 9.3 · Estaciones públicas — los pines del mapa

```
GET /api/public/traninn-logistic/stations
```

Sin token. **Sin paginar a propósito**: un mapa dibuja todos sus pines de una vez. Devuelve **solo las activas**, ordenadas por nombre.

```json
{
  "status": "success",
  "data": [
    { "name": "Base Morelia",
      "address": "Carretera Morelia-Salamanca km 12, Morelia, Mich.",
      "latitude": 19.7412, "longitude": -101.25,
      "phone": "+52 443 000 0000", "schedule": "Lunes a viernes de 8:00 a 18:00" },
    { "name": "Base Uruapan",
      "address": "Carretera Uruapan-Paracho km 5, Uruapan, Mich.",
      "latitude": 19.455, "longitude": -102.03,
      "phone": "+52 443 000 0000", "schedule": "Lunes a viernes de 8:00 a 18:00" }
  ],
  "meta": { "site": "traninn-logistic", "total": 2 }
}
```

Dos detalles que no se deducen del JSON:

- **El payload público no incluye **`id`** ni **`is_active`**.** Para Traninn no estorba: el mapa dibuja por coordenadas. Lo dejo señalado porque el endpoint de disponibilidad de citas (`?station={id}`) sí pide un id que este endpoint no entrega — es un asunto de `gnu-vehicular`, ajeno a este commit, pero vale revisarlo aparte.
- `latitude`**/**`longitude`** son **`decimal(10,7)`, \~1 cm de precisión. Llegan como número, no como string.

---

### 9.4 · Gestión de las bases (panel) — el CRUD que se activa

```
GET    /api/admin/stations?site=traninn-logistic&page=1
POST   /api/admin/stations
GET    /api/admin/stations/{id}
PUT    /api/admin/stations/{id}
DELETE /api/admin/stations/{id}
```

Con `Authorization: Bearer {token}`. Es aquí donde el admin da de alta las bases reales; las dos sembradas son placeholders. El `index` **sí pagina** (20 por página) y lista activas e inactivas.

**Crear** — `site_id` es obligatorio y es el único punto donde el cliente lo envía:

```json
{
  "site_id": 3,
  "name": "Base Morelia",
  "address": "Carretera Morelia-Salamanca km 12, Morelia, Mich.",
  "latitude": 19.7412,
  "longitude": -101.25,
  "phone": "+52 443 000 0000",
  "schedule": "Lunes a viernes de 8:00 a 18:00",
  "is_active": true
}
```

**Actualizar** — el mismo cuerpo **sin **`site_id`: en `update` la regla es `prohibited`, así que mandarlo devuelve 422. Es deliberado: impide mover una base de un sitio a otro.

`is_active: false` es la forma de **quitar un pin del mapa sin perder sus datos**; el `DELETE` sí borra la fila. Hay un test que verifica que el endpoint público deja de listarla.

---

### 9.5 · Editar el contenido de las secciones nuevas

```
GET /api/admin/sections?site=traninn-logistic&page=ubicaciones
PUT /api/admin/sections/{id}
```

Con token. El `index` acepta `site`, `page` (slug) y `global=1`; conviene resolver los IDs por ahí en lugar de fijarlos.

`stations_map`** — solo **`title`** es editable:**

```json
{ "content": { "title": "Dónde encontrarnos", "center": "0,0", "zoom": "20" } }
```

Responde **200**, pero `center` y `zoom` **se ignoran** y conservan su valor: no están en las reglas del tipo, así que se caen del payload validado y el `array_merge` del controlador preserva lo guardado. Son configuración de layout sin significado de marketing. Hay un test que lo fija.

`feature_grid`** — la colección se manda completa:**

```json
{
  "content": {
    "title": "Qué incluye Carga pesada",
    "items": [
      { "icon": "media/icono.svg", "title": "Flota de gran tonelaje", "text": "…" },
      { "icon": null,             "title": "Maniobras especializadas", "text": "…" }
    ]
  }
}
```

El merge es **superficial**: el array que mandas reemplaza al anterior y su orden es el orden en pantalla. Para quitar una tarjeta, se envía el array sin ella. Aplica igual a `slides`, `logos`, `images` y `fuel_prices`.

**Errores comunes**

```
// 422 — falta un campo obligatorio de la colección
{ "message": "El campo content.items.0.title es obligatorio.",
  "errors": { "content.items.0.title": ["El campo content.items.0.title es obligatorio."] } }

// 401 — sin token
{ "status": "error", "data": null, "meta": { "message": "No autenticado" } }
```

---

### 9.6 · Publicar y despublicar las páginas nuevas

```
GET /api/admin/pages?site=traninn-logistic
PUT /api/admin/pages/{id}
```

```json
{ "is_published": false }
```

Es el **único** campo admitido: `title`, `path` y `parent_id` se caen del payload aunque se envíen. No existen `POST` ni `DELETE` de páginas — la estructura es del blueprint. Despublicar *Nuestros servicios* saca del menú también a sus tres hijas.

---

### Colección de Hoppscotch

Ya cubre estos endpoints: se regeneró en el commit anterior (`2626082`) contra las 53 rutas reales, con ejemplos de cuerpo para los 14 tipos de sección y el CRUD de estaciones. **No hizo falta tocarla en este commit**, porque no se agregó ninguna ruta. Solo conviene apuntar la variable `SITE` a `traninn-logistic` para probar lo nuevo.

---

## Pruebas incluidas

`tests/Feature/TraninnServicesTest.php` — 6 tests nuevos:

| Test | Qué protege |
| --- | --- |
| `lists the four seeded columns in navigation order` | Las 4 columnas en orden y que *Contacto* no aparezca |
| `hangs the three services off their column` | Las 3 hijas cuelgan de la cabeza, y la cabeza lleva 2 secciones |
| `keeps the service pages informative, with no lead form` | Las 3 páginas con sus 3 secciones y **sin** `lead_capture_form` |
| `returns the locations page with its map` | `page_hero` + `stations_map`, con el título sembrado |
| `feeds the map from the stations table, active ones only` | Las 2 bases salen del endpoint público; al desactivar una, deja de listarse |
| `keeps the map center and zoom locked` | `title` cambia, `center` y `zoom` sobreviven al `PUT` |

`tests/Feature/TraninnAboutTest.php` — ajuste obligado del test de menú (2 → 4 columnas, `data.1` → `data.2`).

**Suite completa: 171 tests, 742 aserciones, todos verdes** (eran 165). Pint sin observaciones. Verificado además contra Herd con `migrate:fresh --seed`: menú con 4 columnas, `/ubicaciones` con su mapa y las 2 bases en `/stations`.

---
