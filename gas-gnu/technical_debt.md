# Deuda técnica — gas-gnu (sitio `gnu-vehicular` en el CMS)

Todo lo que vive en el front porque el CMS no lo soporta o el panel no permite editarlo. Cada entrada dice qué está en duro, dónde, y qué hace falta para eliminarlo.

> Regla general: si un texto o una imagen que el cliente puede querer cambiar está en el repositorio y no en el CMS, pertenece a este archivo.

Datos verificados contra la API en vivo (`/api/public/gnu-vehicular/...`), no contra los seeders. En vivo, `pages/inicio` trae solo: `banner_carousel`, `savings_simulator`, `feature_grid`, `testimonials`, `stations_map` y `lead_capture_form`.

> **Antes de mover cualquier bloque al CMS:** no correr los seeders en producción para crear las secciones nuevas. `BlueprintSeeder::section()` y `page()` hacen `updateOrCreate`: sobrescriben el contenido de **todas** las secciones de los cuatro sitios con los valores del seeder (se pierde todo lo editado desde el panel) y vuelven a publicar las páginas ocultas. Las secciones nuevas deben entrar con una migración que solo inserte lo que falta, como `2026_09_30_195011_backfill_image_video_url_in_rich_text_sections.php`.

---

## 1. Banda de cifras de inicio

**Archivo:** `src/pages/index.astro` → props `stats` y `cta` de `<StatsBand>`
**Se renderiza en:** `/`, justo debajo del carrusel.

| cifra | texto |
| --- | --- |
| +5,000 | equipos instalados |
| 60 % | ahorro promedio |
| 24/7 | estaciones activas |

Botón: "Conoce nuestros servicios" → `#servicios`.

**Qué hace falta (en el backend):** el tipo `stats_band` ya existe en `UpdateSectionRequest::SCHEMAS` y en `GnuVehicularBlueprintSeeder`, pero **no está en la base de producción** y el panel no tiene editor para él (cae al `<pre>` de solo lectura de `page-sections-editor.jsx`). Además, el esquema no alcanza para estas tres cifras:

| campo | hoy | falta |
| --- | --- | --- |
| `stats[].value` | numérico | "24/7" no es un número: hace falta un campo de texto libre (p. ej. `display`) |
| `stats[].suffix` | string | — |
| `stats[].prefix` | no existe | para el "+" de "+5,000" |
| `cta_label` / `cta_href` | existen | — |

Después: leer `sectionOf(page, "stats_band")` en `index.astro` y borrar el arreglo en duro. `StatsBand.astro` ya acepta `prefix` y `display`.

---

## 2. Texto "Haz que cada kilómetro te cueste menos"

**Archivo:** `src/pages/index.astro` → constante `introRichText`
**Se renderiza en:** `/`, entre la banda de cifras y el simulador de ahorro, con el mismo componente que las secciones `rich_text` del CMS (`RichText.astro`).

Contenido en duro: el título y cinco bloques (cuatro párrafos y el subtítulo "¿Quieres saber cuánto podrías ahorrar?").

**Qué hace falta (en el backend):** el tipo `rich_text` ya existe y es editable en el panel, pero `pages/inicio` de `gnu-vehicular` no tiene ninguna. Agregar una (`title`, `body`; `video_url` e `image_video_url` vacíos) con una migración, copiando este texto como valor inicial.

Después: en `index.astro`, `const introRichText = sectionOf(page, "rich_text")` y borrar la constante. El `body` es el mismo HTML que guardaría el editor.

---

## 3. Encabezados y textos de sección en duro

Las secciones vienen del CMS, pero estos títulos, antetítulos e introducciones no tienen campo:

| dónde | texto en duro |
| --- | --- |
| `/` — servicios (`index.astro`) | antetítulo "Nuestros servicios", título "Todo lo que necesitas para moverte con GNV" |
| `/` — contacto (`index.astro` → `ContactBand`) | título de la tarjeta del formulario "Cotiza sin compromiso" (el `title` e `intro` del `lead_capture_form` van a la columna izquierda) |
| cualquier página con una sección `lead_capture_form` vía `SectionRenderer.astro` → `ContactBand` (p. ej. `/nuestros-servicios/instala-tu-equipo-de-gnv/cotiza-tu-equipo`) | mismo caso: título de la tarjeta "Cotiza sin compromiso", `title`/`intro` del CMS van a la columna izquierda |
| `/` — blog (`BlogTeaser.astro`) | antetítulo "Blog", título "Explora el mundo del GNV", subtítulo "Conoce nuestros artículos y descubre por qué el Gas Natural es la mejor opción.", botón "Ver todo el blog" |
| `/nuestros-servicios` | "Conoce más" / "Explora Nuestros servicios" |
| `/nuestros-servicios/instala-tu-equipo-de-gnv` | "Conoce más" / "Explora Instala tu equipo de GNV" |
| `/ubicaciones` | "Conoce más" / "Explora Ubicaciones" |
| `/contacto` (`contacto/index.astro`) | título de la tarjeta del formulario "Cotiza sin compromiso" (el `title` del CMS va al encabezado de la izquierda) |
| antetítulos de sección | "Simulador de ahorro", "Testimoniales", "Contacto" |
| tarjetas de servicio (`ServiceCards.astro`) | botón "Ver página completa" |
| blog (`blog/[slug].astro`, `BlogIndex.astro`) | "En este artículo", "Sigue leyendo", "Más artículos", "← Volver al blog", paginación, "Aún no hay publicaciones disponibles." |

**Qué hace falta:** campos opcionales `eyebrow` / `title` / `intro` en el `page_hero` o en la sección correspondiente, o aceptar que son textos de interfaz y dejarlos aquí. Los encabezados de "Nuestros servicios" y del blog no tienen sección propia en el CMS: salen del menú y de `GET blog`.

---

## 4. Encabezado y pie de página

**Archivo:** `src/layouts/Layout.astro`

| elemento | en duro |
| --- | --- |
| botones del encabezado | "Agenda tu verificación" y "Cotiza tu equipo" (los destinos sí salen del menú del CMS) |
| botón del menú móvil | "Cotiza tu equipo" |
| lema del pie | "Gas Natural Vehicular — energía más limpia y económica para tu movilidad." |
| títulos de columnas | "Navegación", "Servicios", "Contacto" |
| enlace extra | "Ver todas las estaciones →" |
| línea legal | "© {año} GNU Gas Natural Vehicular. Todos los derechos reservados." y "Aviso de privacidad · Términos y condiciones" (**texto plano, sin enlace**: no existen esas páginas) |

**Qué hace falta:** un campo `tagline` en `contact_info` (o una sección global nueva) para el lema, y las páginas de aviso de privacidad y términos en el CMS para poder enlazarlas.

---

## 5. Etiquetas de formularios y del simulador

| archivo | en duro |
| --- | --- |
| `LeadCaptureForm.astro` → `FIELD_META` | etiqueta y placeholder de cada campo. El CMS (`lead_capture_form.fields[]`) solo lista las claves (`name`, `email`, `phone`, `message`, `vehicle_description`, `fleet_size`); un campo nuevo en el CMS sin entrada aquí no tendría etiqueta |
| `ServiceScheduling.astro` | "Estación", "Fecha", "Ver horarios", "Placa", "Descripción del vehículo", "Confirmar cita", etc. |
| `SimulatorCalculator.astro` | "Combustible que usas actualmente", "Gasto mensual actual (MXN)", "Calcular mi ahorro", "Ahorro mensual estimado", "Hoy pagas", "Con gas natural" |
| `SimulatorFab.astro` | "Calcula tu ahorro" (el título y el subtítulo del panel sí vienen del `savings_simulator` de inicio) |
| `ContactInfo.astro` | "Dirección", "Teléfono", "Correo", "WhatsApp", "Horario" |

**Qué hace falta:** si el cliente quiere editarlas, `fields[]` tendría que pasar de lista de claves a objetos `{ key, label, placeholder, required }`.

---

## 6. Datos y comportamiento en código

| qué | dónde | problema / qué hace falta |
| --- | --- | --- |
| IDs de estaciones para agendar | `ServiceScheduling.astro` → `LEGACY_STATION_IDS` (hoy: `"...Quiroga Morelia...": 3`, `"...Charo Morelia...": 4`, `"...Blue GAS Uruapan...": 13`) | `GET stations` no devuelve `id`, y la agenda lo necesita. **Esto ya pasó una vez:** las tres estaciones se renombraron en el panel y el mapa (con los nombres viejos "Estación Morelia"/"Estación Uruapan") dejó de encontrar coincidencias — `stations.length` cayó a 0 y la sección completa se cayó al mensaje "Agenda no disponible", sin ningún error visible. Los IDs se recuperaron probando `GET appointments/availability?station={n}` (la respuesta trae `data.station.{id,name}`) hasta encontrar los tres. **Backend:** agregar `'id' => $station->id` en `StationController::present()`; después borrar el mapa. Hasta entonces, cualquier renombrado de estación en el panel vuelve a romper la agenda igual. |
| mensaje de cita confirmada | `ServiceScheduling.astro` | se muestra `meta.message` de la API ("Tu cita quedó registrada. Te esperamos."), así que el `success_message` editable del CMS nunca aparece. Mostrar primero el del CMS. |
| ahorro de respaldo | `SimulatorCalculator.astro` → `FALLBACK_SAVINGS_RATE = 0.6` | solo se usa si la API del simulador falla; el 60 % es la promesa comercial del sitio. |
| ejemplo inicial del simulador | `SimulatorCalculator.astro` → `value="20000"` | el simulador abre ya calculado con $20,000 de gasto mensual. |
| SEO por defecto | `src/config/seo.ts` | título, descripción y `siteUrl` (`https://www.gnu-gnv.mx`, sin verificar que sea el dominio real). No hay campos SEO en el CMS. |

---

## 7. Respaldos que solo aparecen si el CMS falla al compilar

`fetchData` (`src/functions/fetch.ts`) no revisa el estado HTTP: si la API no responde, la compilación **no falla** y publica estos respaldos como si fueran contenido real. Algunos son promesas o testimonios **inventados**:

| archivo | respaldo |
| --- | --- |
| `HeroCarousel.astro` → `fallbackSlides` | "Ahorra hasta un 60% en combustible con GNV", "Instalación con 20% de descuento este mes", "Financiamiento a 12 meses sin intereses" |
| `index.astro` → `fallbackTestimonials` | tres testimonios con nombres inventados (Ricardo Peña, Lupita Camacho, Juan Osorio) |
| `index.astro` → `fallbackBenefits`, `RewardsProgram.astro` | beneficios del programa de recompensas y botón "Quiero inscribirme" |
| `index.astro` → `fallbackLocations`, `LocationsList.astro` | "3 puntos de carga activos las 24 horas", "Carga rápida y área de espera techada", etc. |
| `index.astro`, `nuestros-servicios`, `ubicaciones`, `instala-tu-equipo-de-gnv` → `fallback*` | listas de páginas hijas |
| `Layout.astro` | menú, enlaces de servicios del pie y correo `hola@gnu-gnv.mx` |
| componentes (`?? "…"`) | títulos por defecto del simulador, testimonios, clientes, blog, contacto, etc. |

**Qué hace falta:** que `fetchData` lance un error cuando la respuesta no sea `ok` en `menu`, `globals` y `pages/*`, para que una caída del CMS detenga el despliegue en vez de publicar estos textos. Después, borrar los respaldos inventados (hero, testimonios, recompensas, ubicaciones).

---

## 8. Imágenes en el repositorio

No son contenido editable, pero viven en código: logos (`src/assets/images/logo*.png`, `public/logo*.png`), el ícono de asesor del bloque de contacto, la insignia de flecha de las tarjetas (`Texto_del_párrafo__1_-removebg-preview.png`), el placeholder `noimg.jpg` y el cursor (`public/pointer.png`).

---

## 9. Texto inyectado por JS en cliente (ni CMS ni build)

**Archivo:** `src/pages/nuestros-servicios/estaciones-moviles/index.astro` → `<script>` al final del archivo.
**Se renderiza en:** `/nuestros-servicios/estaciones-moviles`, debajo del título "Abastece tu vehículo en nuestras estaciones de GNV" (la sección `feature_grid` de esa página).

El script busca el `.section-title` cuyo texto sea exactamente ese título y le inserta un `<p class="section-subtitle">` después, con este texto fijo:

> Contamos con estaciones ubicadas en Morelia y Uruapan para facilitar el suministro de Gas Natural Vehicular en tus recorridos diarios. Consulta la estación más conveniente, revisa sus horarios de atención y ubica cómo llegar antes de iniciar tu trayecto. Nuestro equipo puede orientarte durante el proceso de carga.

Es el caso más fuera de lo normal del archivo: no es un valor por defecto (`??`) ni una constante leída en el build como las demás entradas — se escribe en el DOM después de que la página ya cargó, así que **no existe en el HTML servido** (no lo indexa un buscador, y si JS falla o tarda, el visitante nunca lo ve). Se hizo así porque el `feature_grid` no tiene campo para una introducción y el `text` de cada tarjeta llegó vacío (`"."`), dejando la sección con el título solo y tres tarjetas sin texto.

**Qué hace falta:** agregar un campo `intro` opcional al esquema de `feature_grid` (lo mismo que ya le falta a `stats_band`, ver §1) y, mientras tanto, pedir que se llene el `text` real de cada tarjeta en el panel en vez de dejar el placeholder `"."`. Hecho cualquiera de los dos, borrar el `<script>` completo.

---

## 10. Renombre por JS del título de menú "Estaciones móviles"

**Archivo:** `src/layouts/Layout.astro` → `<script>` al final del archivo.
**Se renderiza en:** todas las páginas — el enlace "Estaciones móviles" del dropdown "Nuestros servicios" (escritorio), del menú móvil y del pie "Servicios"; y en `/` (inicio), el encabezado de su tarjeta en `ServiceCards.astro` (el `<h3>` que, a falta de subtítulo propio en la página, cae al título de la página — ver `card.subtitle ?? card.title`).

El título real de esa página en el CMS sigue siendo "Estaciones móviles" (lo trae `getMenu()` y es lo que ve el admin en el panel). El script busca, después de cargar la página, cualquier `<a>`, `<summary>` o `<h3>` sin hijos cuyo texto sea exactamente "Estaciones móviles" y lo reemplaza por "Estaciones de suministro de GNV". Igual que el caso del §9: **no existe en el HTML servido** (no lo indexa un buscador tal cual, y si JS falla o tarda, el visitante ve el título real un instante o de forma permanente). Se hizo así para no tocar el título de la página en el CMS (que también es su identificador en el panel) solo por cambiar cómo se lee en la navegación y en esta tarjeta.

**Qué hace falta:** si el nombre "Estaciones de suministro de GNV" es el definitivo, renombrar el título de la página directamente en el panel del CMS y borrar este script.

---

## 11. Texto de "Hablemos de tu vehículo" fijo para todo `lead_capture_form`

**Archivo:** `src/lib/cms.ts` → `CONTACT_PITCH_TITLE`, `CONTACT_PITCH_INTRO`. Se usan en `src/components/SectionRenderer.astro` (caso `lead_capture_form`, cubre `cotiza-tu-equipo`, `flotillas-empresariales` y cualquier página nueva con esta sección) y en `src/pages/contacto/index.astro`.
**Se renderiza en:** el lado izquierdo (ícono + "CONTACTO" + encabezado + párrafo) de toda banda de contacto del sitio, **excepto** la de inicio (`src/pages/index.astro`), que sigue leyendo `title`/`intro` del CMS tal cual.

Cada página tiene su propio `title`/`intro` en el panel para esta sección — "Cotiza tu equipo" / "Déjanos los datos de tu vehículo y te enviamos una cotización.", "Cotiza para tu flotilla" / "Cuéntanos cuántas unidades tienes...", "Captación de leads" / "Cuéntanos qué necesitas..." en `contacto` — pero en el front ya no se usan: todas muestran el texto de inicio ("¿Tienes dudas? Hablemos de tu vehículo" / "No necesitas conocer todos los detalles técnicos para comenzar...") para que la banda de contacto se vea igual en cualquier página. El `fields` de cada sección (qué campos trae el formulario — p. ej. `vehicle_description` en Cotiza tu equipo, `fleet_size` en Flotillas) sigue viniendo del CMS sin cambios; solo el texto de la izquierda está fijo.

**Qué hace falta:** si el texto por página era intencional (y no un campo que ningún admin llegó a revisar), revertir esto y volver a leer `section.content.title`/`.intro`. Si el texto único es el definitivo, lo más limpio es borrar `title`/`intro` del esquema de `lead_capture_form` en el CMS (no hacen nada ya) y dejar `CONTACT_PITCH_TITLE`/`CONTACT_PITCH_INTRO` como la única fuente.

---

## 12. Sección "¿Qué se instala?" oculta en Instala tu equipo de GNV

**Archivo:** `src/pages/nuestros-servicios/instala-tu-equipo-de-gnv/index.astro` → prop `excludeTypes={["feature_grid"]}` de `<CmsPage>` (mecanismo genérico agregado en `src/components/CmsPage.astro`, reutilizable en cualquier página con el mismo problema).
**Se renderiza en:** `/nuestros-servicios/instala-tu-equipo-de-gnv` — ya no se renderiza, mejor dicho.

El `feature_grid` "¿Qué se instala?" de esta página tiene sus tres tarjetas ("Evaluacion de tu vehiculo", "Instalación certificada", "Seguimiento técnico") con el campo `text` en `"-"` — un placeholder, no contenido real —, dejando la sección en pantalla con título e ícono pero sin texto que decir. Se ocultó por completo en vez de mostrarla a medio llenar, a pedido explícito mientras se llena el contenido real en el panel.

**Qué hace falta:** pedir que se escriba el `text` real de cada tarjeta en el panel del CMS (sección `feature_grid` de esta página) y, hecho eso, quitar `excludeTypes={["feature_grid"]}` de este archivo.
