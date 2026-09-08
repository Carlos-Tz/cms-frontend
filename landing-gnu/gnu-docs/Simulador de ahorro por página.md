# Simulador de ahorro por página

*El endpoint tomaba siempre la primera sección *`savings_simulator`* del sitio. Al sembrar GNC —que lleva la suya— sus precios habrían quedado ignorados en silencio. Ahora cada instancia es direccionable.*

---

---

## Flujo Simple

```
Paso 1: El front pide el cálculo
        GET /savings-simulator?fuel=diesel&quantity=1000&page=gnc
⬇️
Paso 2: Validación inline — fuel requerido, quantity > 0, page opcional
⬇️
Paso 3: Se busca la sección savings_simulator del sitio
        CON page → whereHas('page', slug = page)
        SIN page → la primera por page_id (la portada)
⬇️
Paso 4: fuel_prices se indexa por `fuel`; se extraen base (gas-natural) y actual
⬇️
Paso 5: Cálculo — costo actual, equivalente en gas, ahorro y porcentaje
⬇️
Paso 6: Respuesta con ambos costos desglosados
```

## Decisiones Clave de Implementación

**El parámetro **`page`**, no una sección global** — `app/Http/Controllers/Public/SavingsSimulatorController.php`

```
$input = $request->validate([
    'fuel' => ['required', 'string'],
    'quantity' => ['required', 'numeric', 'gt:0'],
    'page' => ['nullable', 'string'],
], [], ['fuel' => 'combustible', 'quantity' => 'cantidad', 'page' => 'página']);

// A site can carry several savings_simulator sections (GNU has one on the
// home page and one on /nuestros-servicios/gnc) and each keeps its own
// reference prices. `page` picks which one; without it the caller gets
// the site's first, which is the home page.
$section = $site->sections()
    ->where('type', 'savings_simulator')
    ->when($request->string('page')->isNotEmpty(), fn ($query) => $query->whereHas(
        'page',
        fn ($page) => $page->where('slug', $request->string('page'))
    ))
    ->orderBy('page_id')
    ->firstOrFail();
```

Se evaluó mover el bloque a **sección global** para tener una sola fuente de precios. Se descartó: una sección global no tiene `position` dentro de una página, y el simulador ocupa un lugar concreto del contenido (posición 2 de la portada, 4 de GNC). El parámetro conserva el modelo de secciones ordenadas y elimina el ignorado silencioso.

**Compatible hacia atrás:** sin `page` el comportamiento es idéntico al anterior, por eso los tests previos siguen pasando sin tocarse.

## Configuración

Ninguna. Los precios los mantiene el admin dentro de la sección, vía `PUT /api/admin/sections/{id}`.

## Implementación

**Endpoint**

```
GET /api/public/{site}/savings-simulator?fuel={slug}&quantity={n}&page={pageSlug}
```

**Respuesta Exitosa (HTTP 200)**

```json
{ "status": "success",
  "data": {
    "current_fuel": { "fuel": "diesel", "label": "Diésel", "quantity": 1000,
                      "unit": "litro", "price_per_unit": 25.9, "cost": 25900 },
    "natural_gas":  { "quantity": 950, "unit": "m³", "price_per_unit": 12.5, "cost": 11875 },
    "savings": 14025,
    "savings_percent": 54.15
  },
  "meta": { "site": "gnu" } }
```

**Errores**

| Código | Caso |
| --- | --- |
| 422 | `fuel` desconocido, o `fuel=gas-natural` (es la base, no una opción) |
| 422 | `quantity` ausente o ≤ 0 |
| 404 | `page` apunta a una página sin sección `savings_simulator` |
| 503 | El precio del gas natural no está configurado |

## Archivos involucrados

| Capa | Ruta | Estado |
| --- | --- | --- |
| Controlador | app/Http/Controllers/Public/SavingsSimulatorController.php | Modificado |
| Seeder | database/seeders/GnuBlueprintSeeder.php | Helper `fuelPrices()` reutilizado por ambas instancias |
| Pruebas | tests/Feature/GncAndContactTest.php | «picks the simulator of a given page», «404s on a page without a simulator» |
