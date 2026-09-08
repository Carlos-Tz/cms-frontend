# Catálogo de productos



*Gestión dinámica de categorías y productos: el administrador las crea, edita y elimina; el sitio público las consume con filtro por categoría y búsqueda por texto. Sustituye a lo que el árbol del cliente dibujaba como tres nodos fijos bajo PRODUCTOS (EDRM, Compresoras, Valvulería).*


## Flujo Simple

```
ADMIN                                    PÚBLICO
─────                                    ───────
POST /api/admin/products
⬇️
auth:api (JWT)
⬇️
ProductRequest
 · site_id required (create) / prohibited (update)
 · product_category_id debe pertenecer a ESE sitio
 · slug derivado del name si no viene
⬇️
Product::create()                        GET /api/public/tectuus/products?category=&q=
⬇️                                       ⬇️
products (site_id, product_category_id)  Route binding {site:slug} → Site
⬇️                                       ⬇️
201 {status, data, meta.message}         scope active() + filtros + paginate(12)
                                         ⬇️
                                         present() — sin description, 1 imagen
                                         ⬇️
                                         200 {status, data[], meta}
```

## Decisiones Clave de Implementación

**El catálogo es dominio de datos, no una sección del blueprint**

La decisión de fondo. El candidato `product_catalog` quedó **descartado**: el cliente pidió gestión dinámica, y el contrato de editabilidad dice que el admin gestiona *datos* pero nunca *estructura*. Precedente literal: `/blog` es una página con solo `page_hero` y los artículos son filas de `blog_posts`.

```js
// database/seeders/TectuusBlueprintSeeder.php
private function products(Site $site): void
{
    // La página existe en el blueprint y lleva UNA sola sección.
    $products = $this->page($site, 'productos', '/productos', 'Productos', 3);

    $this->section($site, $products, 'page_hero', 1, [
        'title' => 'Productos',
        'subtitle' => 'Equipo industrial para gas natural.',
        'image' => null,
    ]);

    // Las 3 categorías NO son páginas: son filas gestionables.
    foreach ($categories as [$slug, $name, $position, $description]) {
        $site->productCategories()->updateOrCreate(['slug' => $slug], [...]);
    }
}
```

**Consecuencia que hay que tener presente:** las categorías **no aparecen** en `GET /api/public/tectuus/menu`, porque ese menú se deriva de la tabla `pages`. El front arma el submenú de PRODUCTOS con `GET /product-categories`. Es la misma renuncia ya aceptada con los artículos del blog, y es el precio de que el admin pueda crear categorías sin tocar código.

`price`** nullable = «precio a cotizar»**

```
// database/migrations/..._create_products_table.php
// ponytail: null = «precio a cotizar». Industrial equipment is quoted
// more often than listed. No currency column: everything is MXN.
$table->decimal('price', 12, 2)->nullable();
```

Casteado a `decimal:2`, no a `float`: el precio se muestra y se compara, nunca se acumula en PHP. **Por eso la API devuelve **`"189500.50"`** como string**, no como número — dato importante para el front.

**Las imágenes son JSON, no una tabla**

```
$table->json('images'); // lista ordenada de paths de media
```

Misma forma que las colecciones dentro de `sections.content` (`banner_carousel.slides[]`, `image_gallery.images[]`). Una tabla `product_images` se paga el día que cada imagen necesite su propio `alt` y `caption`; hoy no los necesita.

**Borrar una categoría con productos es un 409, no una cascada**

```js
// app/Http/Controllers/Admin/ProductCategoryController.php
public function destroy(ProductCategory $productCategory): JsonResponse
{
    if ($productCategory->products()->exists()) {
        return response()->json([
            'status' => 'error',
            'data' => null,
            'meta' => ['message' => 'La categoría tiene productos asociados. Muévelos o elimínalos primero.'],
        ], 409);
    }

    $productCategory->delete();
    // ...
}
```

El candado real es la FK (`restrictOnDelete`); esta comprobación solo convierte el error del motor en un mensaje legible en español. Es la única respuesta 409 de toda la API.

**Aislamiento entre sitios: la categoría se valida contra el sitio**

```
// app/Http/Requests/Admin/ProductRequest.php
$siteId = $product?->site_id ?? $this->integer('site_id');

'product_category_id' => [
    'required', 'integer',
    Rule::exists('product_categories', 'id')->where('site_id', $siteId),
],
```

Un producto de `tectuus` archivado en una categoría de `gnu` es un **422**, nunca una fila huérfana. `site_id` es `prohibited` en update: un producto no cambia de sitio.

**El filtro público de búsqueda**

```
// app/Http/Controllers/Public/ProductController.php
// ponytail: plain LIKE, no accent folding. FTS5 if the catalogue
// ever grows past a few hundred rows.
->when($search !== '', fn ($query) => $query->where(
    fn ($match) => $match->where('name', 'like', "%{$search}%")
        ->orWhere('description', 'like', "%{$search}%")
))
```

**Techo conocido:** `LIKE` no pliega acentos — buscar `medicion` no encuentra `medición`. Se acepta a este volumen; la ruta de mejora es FTS5 de SQLite.

## Configuración

Ninguna variable de entorno nueva. Solo:

```
php artisan migrate                                  # crea product_categories y products
php artisan db:seed --class=TectuusBlueprintSeeder   # siembra las 3 categorías (idempotente)
```

El seeder **no siembra productos**: los carga el admin, igual que las estaciones de los otros sitios.

## Implementación

**Estructura de la Petición (admin)**

```
Headers requeridos:
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

**Crear un producto**

```
POST /api/admin/products
```

```json
{
    "site_id": 4,
    "product_category_id": 1,
    "name": "Estación EDRM 500",
    "description": "Regulación y medición de alta presión.",
    "price": 189500.50,
    "images": ["media/edrm-1.jpg", "media/edrm-2.jpg"],
    "is_active": true
}
```

`slug` es opcional: se deriva de `name` con `Str::slug()`. Si el slug generado choca con otro del mismo sitio, la petición **falla con 422** en vez de sufijar `-2` — el admin decide la URL final.

**Respuesta Exitosa (HTTP 201)**

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "site_id": 4,
        "product_category_id": 1,
        "slug": "estacion-edrm-500",
        "name": "Estación EDRM 500",
        "description": "Regulación y medición de alta presión.",
        "price": "189500.50",
        "images": ["media/edrm-1.jpg", "media/edrm-2.jpg"],
        "is_active": true,
        "created_at": "2026-09-04T22:14:00.000000Z",
        "updated_at": "2026-09-04T22:14:00.000000Z"
    },
    "meta": { "message": "Producto creado correctamente" }
}
```

**Nota sobre **`PUT`**:** el request toma el payload completo (semántica PUT). Si omites `images`, el producto queda **sin imágenes** — no se conservan las anteriores.

## Endpoints

### Públicos — `/api/public/{site}` (sin auth)

**Listar categorías** — alimenta el submenú de PRODUCTOS

```
GET /api/public/tectuus/product-categories
```

```json
{
    "status": "success",
    "data": [
        { "slug": "edrm", "name": "EDRM", "description": "Estaciones de regulación y medición.", "image": null, "products_count": 3 },
        { "slug": "compresoras", "name": "Compresoras", "description": "Equipos de compresión de gas natural.", "image": null, "products_count": 0 },
        { "slug": "valvuleria", "name": "Valvulería", "description": "Válvulas y accesorios para gas natural.", "image": null, "products_count": 0 }
    ],
    "meta": { "site": "tectuus" }
}
```

`products_count` cuenta **solo los activos**. Sin paginar y ordenado por `position`.

**Listar productos, con filtro y búsqueda**

```
GET /api/public/tectuus/products
GET /api/public/tectuus/products?category=edrm
GET /api/public/tectuus/products?q=compresor
GET /api/public/tectuus/products?category=edrm&q=500&page=2
```

```json
{
    "status": "success",
    "data": [
        {
            "slug": "estacion-edrm-500",
            "name": "Estación EDRM 500",
            "price": "189500.50",
            "category": { "slug": "edrm", "name": "EDRM" },
            "image": "media/edrm-1.jpg"
        }
    ],
    "meta": { "site": "tectuus", "page": 1, "per_page": 12, "total": 1, "last_page": 1 }
}
```

El listado **omite **`description`** y devuelve solo la primera imagen** — mismo criterio con el que el listado del blog omite `body`.

**Detalle de un producto**

```
GET /api/public/tectuus/products/{productSlug}
```

```json
{
    "status": "success",
    "data": {
        "slug": "estacion-edrm-500",
        "name": "Estación EDRM 500",
        "price": "189500.50",
        "category": { "slug": "edrm", "name": "EDRM" },
        "description": "Regulación y medición de alta presión.",
        "images": ["media/edrm-1.jpg", "media/edrm-2.jpg"]
    },
    "meta": { "site": "tectuus" }
}
```

Un producto con `is_active = false` responde **404** aquí, aunque exista.

### Admin — `/api/admin` (JWT)

| Método | URI | Nota |
| --- | --- | --- |
| GET | `product-categories` | `?site={slug}`, con `products_count`, `paginate(20)` |
| POST | `product-categories` | 201. `site_id` requerido |
| GET | `product-categories/{id}` | la categoría con su conteo |
| PUT/PATCH | `product-categories/{id}` | `site_id` `prohibited` |
| DELETE | `product-categories/{id}` | **409** si todavía tiene productos |
| GET | `products` | `?site={slug}&category={slug}`. **Incluye inactivos** |
| POST | `products` | 201 |
| GET | `products/{id}` | el producto con su categoría |
| PUT/PATCH | `products/{id}` | payload completo |
| DELETE | `products/{id}` | mensaje |

**Respuestas de Error Comunes**

**Error 422 — categoría de otro sitio**

```json
{
    "message": "La categoría no pertenece a este sitio.",
    "errors": { "product_category_id": ["La categoría no pertenece a este sitio."] }
}
```

**Error 409 — categoría con productos**

```json
{
    "status": "error",
    "data": null,
    "meta": { "message": "La categoría tiene productos asociados. Muévelos o elimínalos primero." }
}
```

**Error 401 — sin token**

```json
{ "status": "error", "data": null, "meta": { "message": "No autenticado." } }
```
