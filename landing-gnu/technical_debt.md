# Deuda técnica — landing-gnu (sitio `gnu` en el CMS)

Todo lo que vive en el front porque el CMS no lo soporta o el panel no permite editarlo. Cada entrada dice qué está en duro, por qué y qué hace falta para eliminarlo.

> Regla general: si un texto o una imagen que el cliente puede querer cambiar está en el repositorio y no en el CMS, pertenece a este archivo.

Datos verificados contra la API en vivo (`/api/public/gnu/...`), no contra los seeders.

---

## 1. Franja de confianza bajo el hero de inicio

**Archivo:** `src/components/sections/TrustStrip.astro` → constante `items`
**Se renderiza en:** `/`, justo debajo del carrusel.

Las tres tarjetas (ícono, título y texto) están en duro. No existe un tipo de sección para esta franja; `index.astro` la monta directamente.

| ícono | título | texto |
| --- | --- | --- |
| `percent` | Haz que cada kilómetro rinda más. | Descubre cómo el gas natural vehicular puede ayudarte a reducir el gasto de combustible. |
| `map-pin` | Energía que acompaña tu operación. | Soluciones de suministro de gas natural para industrias y transporte, de acuerdo con la viabilidad de cada proyecto. |
| `leaf` | Eficiencia que genera ahorro. Energía que reduce tu huella. | Impulsamos una forma más eficiente de consumir energía, ayudando a la industria y al transporte a reducir costos y su impacto ambiental. |

**Qué hace falta (en el backend):** un tipo de sección nuevo en `pages/inicio`:

| campo | tipo | nota |
| --- | --- | --- |
| `trust_strip.items[]` | array (máx. 3) | una entrada por tarjeta |
| `items[].icon` | enum (`percent`, `map-pin`, `leaf`, …) | los íconos son SVG del front; el CMS solo elige cuál |
| `items[].title` | string | |
| `items[].text` | string | |

Después: leer la sección con `sectionOf(page, "trust_strip")` en `index.astro` y borrar `items` del componente.

---

## 2. Banda de cifras de inicio

**Archivo:** `src/pages/index.astro` → props `stats` y `cta` de `<StatsBand>`
**Se renderiza en:** `/`, después de "Nuestros clientes".

Las cuatro cifras, sus textos y el botón están en duro:

| valor | texto |
| --- | --- |
| 50 % | de ahorro frente a la gasolina |
| 3 | estaciones en Michoacán |
| 1 | centro especializado en en conversión a Gas Natural Vehícular |
| 3 | Soluciones energéticas para la industria y el transporte: GNV, GNC y GND |

Botón: "Conoce nuestros servicios" → `/nuestros-servicios`.

La tercera cifra tiene dos errores ("en en", "Vehícular"); se corrigen en el mismo archivo mientras siga en duro.

**Qué hace falta (en el backend):**

| campo | tipo | nota |
| --- | --- | --- |
| `stats_band.stats[]` | array | `value` (número), `suffix` (string, opcional), `label` (string) |
| `stats_band.cta_label` / `cta_url` | string | botón opcional |

Las cifras de estaciones podrían salir de `GET stations` (`meta.total`) en vez de escribirse a mano.

---

## 3. Contenido de Certificaciones

**Archivo:** `src/components/CertificacionesContent.astro` (`isoPoints` y el texto del bloque)
**Imagen:** `src/assets/images/certificaciones/iso-9001.png`
**Se renderiza en:** `/sobre-nosotros/certificaciones`, debajo del hero del CMS.

El bloque ISO 9001 (etiqueta, título, dos párrafos y tres puntos clave) está en duro. El `feature_grid` del CMS ("CERTIFICACIONES ACTUALES", una sola tarjeta) se oculta con `excludeTypes={["feature_grid"]}` en `src/pages/sobre-nosotros/certificaciones/index.astro`.

**Imagen:** entregada por el cliente como `certificaciones_images/certificacion iso.png` (1254×1254, PNG, 1.4 MB, con esquinas grises). Se copió a `src/assets/images/certificaciones/`; Astro la convierte a WebP al compilar. El original queda en `certificaciones_images/`.

**Qué hace falta (en el backend):** la sección `certifications` descrita en detalle en `certificaciones_images/CAMPOS-BACKEND.md` (sello, título, cuerpo, puntos, organismo certificador, número, vigencia, PDF). Después: componente `Certifications.astro` en `SectionRenderer.astro` y quitar `CertificacionesContent` y `excludeTypes` de la página.

---

## 4. Pie de página: lema, sellos y textos legales

**Archivo:** `src/layouts/Layout.astro` (pie, `footerEmail`/`footerPhone`/`footerSchedule`)
**Imagen:** `src/assets/images/logo.png`, `src/assets/images/ESR1-min-1024x1024-1.png`, `src/assets/images/certificaciones/iso-9001.png`
**Se renderiza en:** todas las páginas.

En duro:

- El lema "Energía limpia y ahorro real para negocios y flotillas vehiculares en todo México."
- Los sellos ISO 9001 y ESR junto al logo, con sus enlaces a `/sobre-nosotros/certificaciones` y `/desarrollo-sostenible/distintivo-esr`.
- "Aviso de privacidad · Términos y condiciones": es texto plano, **sin enlace**; las páginas no existen.
- Respaldos de contacto si `globals.contact_info` viene vacío: `contacto@gnugas.mx`, `800 555 0192`, `Lun–Vie, 9:00–18:00`. Son datos inventados; hoy no se ven porque `globals` sí trae los reales.

**Imágenes:** `logo.png` es el logo blanco (560×530, PNG transparente). `ESR1-min-1024x1024-1.png` la entregó el cliente (1024×1024, PNG transparente, 67 KB). El sello ISO es el de la entrada 3. Astro genera versiones WebP de 64/128 px.

**Qué hace falta (en el backend):**

| campo | tipo | nota |
| --- | --- | --- |
| `globals.footer.tagline` | string | lema bajo el logo |
| `globals.footer.seals[]` | array | `image` (media), `alt`, `url` |
| `globals.footer.legal_links[]` | array | `label`, `url` (aviso de privacidad, términos) |

Los respaldos de contacto deberían quitarse en vez de migrarse: es mejor no mostrar nada que mostrar datos falsos.

---

## 5. Títulos de las secciones "Explora" en las páginas índice

**Archivo:** `src/pages/nuestros-servicios/index.astro`, `src/pages/sobre-nosotros/index.astro`, `src/pages/desarrollo-sostenible/index.astro`
**Se renderiza en:** las tres páginas índice, encima de las tarjetas de sus subpáginas.

Etiqueta, título y subtítulo están en duro en cada página:

| página | título | subtítulo |
| --- | --- | --- |
| `/nuestros-servicios` | Tres formas de aprovechar el gas natural | Compara GNV, GNC y GND, y encuentra la solución de GNU Gas Natural que mejor se adapta a tu operación. |
| `/sobre-nosotros` | El respaldo detrás de nuestra energía | Nuestra historia, propósito, valores y certificaciones: la experiencia y el compromiso con los que impulsamos a la industria y al transporte con energía confiable. |
| `/desarrollo-sostenible` | Nuestro compromiso, llevado a la acción | Descubre las evaluaciones, iniciativas, voluntariado y reconocimientos que forman parte de nuestra estrategia de sostenibilidad. |

Las tarjetas sí vienen del CMS (hero y `feature_grid` de cada subpágina); solo el encabezado es del front.

**Qué hace falta (en el backend):** una sección `child_pages` (o campos en la página índice):

| campo | tipo | nota |
| --- | --- | --- |
| `child_pages.eyebrow` | string | hoy "Conoce más" |
| `child_pages.title` | string | |
| `child_pages.subtitle` | string | |

Después: renderizar la sección desde `SectionRenderer.astro` con `ServiceCards`/`ChildPageCards` y quitar los encabezados de las tres páginas.

---

## 6. Nombres del menú distintos al título de la página

**Archivo:** `src/config/labelOverrides.ts` → `NAV_LABEL_OVERRIDES`
**Se renderiza en:** menú superior, menú móvil y título de la pestaña del navegador.

| slug | título en el CMS | se muestra |
| --- | --- | --- |
| `distintivo-esr` | Distintivo ESR | Reconocimientos |
| `ecovadis` | EcoVadis | Compromiso sostenible |
| `voluntariado` | Voluntariado | Voluntariado corporativo |
| `iniciativas-rse` | Iniciativas de RSE | Iniciativas y programas |

Los títulos de página los define el seeder y el panel no permite editarlos.

**Qué hace falta (en el backend):** permitir editar `title` de la página desde el panel, o un campo `nav_label` opcional por página. Después: borrar las entradas de `labelOverrides.ts`.

---

## 7. Orden del menú

**Archivo:** `src/config/menuOrder.ts` → `MENU_ORDER_OVERRIDES`; se aplica en `getMenu()` de `src/lib/cms.ts`
**Se renderiza en:** submenús de "Sobre nosotros" y "Desarrollo sostenible", y en las tarjetas de sus páginas índice.

| menú | orden en el front |
| --- | --- |
| Sobre nosotros | Nuestra historia, Propósito empresarial, Valores, Certificaciones |
| Desarrollo sostenible | Compromiso sostenible, Iniciativas y programas, Voluntariado corporativo, Reconocimientos |

`GET menu` no trae ningún campo de orden; el front reordena lo que llega.

**Qué hace falta (en el backend):** un campo `sort_order` por página (editable en el panel) y que `GET menu` ordene por él. Después: vaciar `MENU_ORDER_OVERRIDES`.

---

## 8. Secciones ocultas o movidas por página

**Archivo:** prop `excludeTypes` / `insertSection` de `src/components/CmsPage.astro`, usada en cada página
**Se renderiza en:** las páginas de la tabla.

| página | qué hace el front |
| --- | --- |
| `/sobre-nosotros/proposito-empresarial` | oculta su `feature_grid` ("Características") |
| `/sobre-nosotros/certificaciones` | oculta su `feature_grid` (ver entrada 3) |
| `/nuestros-servicios` | oculta su `clients_showcase` |
| `/nuestros-servicios/gnc` y `/gnd` | ocultan `savings_simulator` |
| `/nuestros-servicios/gnv` | muestra el `savings_simulator` **de la página GNC**, después de "Beneficios", y consulta precios con `page=gnc` |

El simulador se edita en la pantalla de GNC pero solo se ve en GNV. Es confuso para quien edita.

**Qué hace falta:** nada técnico en la mayoría de los casos — es una decisión de contenido. Quien edita puede borrar esas secciones en el panel y luego se quitan los `excludeTypes`. Para el simulador: crear el `savings_simulator` en la página GNV desde el panel (el front ya lo prefiere si existe), borrarlo de GNC y quitar `insertSection` de `gnv/index.astro`.

---

## 9. Orden de las estaciones

**Archivo:** `src/components/sections/StationsMap.astro` (`[...data].reverse()`)
**Se renderiza en:** todo `stations_map`: `/`, `/contacto`, `/nuestros-servicios/gnc`.

El front invierte el orden que manda `GET stations`. La respuesta no trae `id`, orden ni fecha, así que si alguien reordena en el panel, el sitio muestra ese orden al revés.

**Qué hace falta (en el backend):**

| campo | tipo | nota |
| --- | --- | --- |
| `stations[].sort_order` | entero | editable en el panel; `GET stations` ordena por él |

Después: quitar `.reverse()`.

---

## 10. Carrusel de inicio: logo, flecha y diapositivas de respaldo

**Archivo:** `src/components/sections/HeroCarousel.astro` (`fallbackSlides`, bloque `hero-slide__actions`)
**Imagen:** `src/assets/images/logo.png`
**Se renderiza en:** `/` (y cualquier página que agregue un `banner_carousel`).

- El logo blanco con su divisor junto al botón aparece en todas las diapositivas; no se puede quitar ni cambiar por diapositiva.
- El círculo con flecha del botón es parte del diseño.
- `fallbackSlides`, que se muestran solo si el carrusel llega vacío, repiten cifras en duro ("50% de ahorro en combustible frente a la gasolina", "3 estaciones en Michoacán") con la etiqueta "Cobertura nacional", que no corresponde a una cobertura solo en Michoacán. Hay que mantenerlas al día con la entrada 2 o borrar los respaldos.

**Qué hace falta:** nada del CMS para el logo y la flecha — es diseño. Si el cliente quiere controlarlo: `banner_carousel.show_logo` (booleano). Los respaldos se corrigen en el código.

---

## 11. Textos del simulador de ahorro

**Archivo:** `src/components/sections/SavingsSimulator.astro`, `src/components/SimulatorCalculator.astro`, `src/components/SimulatorFab.astro`
**Se renderiza en:** `/`, `/nuestros-servicios/gnv` y el botón flotante "Calcula tu ahorro" en todas las páginas.

En duro: la etiqueta "Simulador de ahorro"; las tres píldoras "Resultado al instante", "Precios de referencia actualizados", "Sin registro"; las etiquetas del formulario y del resultado; el texto del botón flotante y "Descubre cuánto ahorras con gas natural". El título e intro sí vienen del CMS (con respaldo en duro). El botón flotante siempre usa los precios del simulador de **inicio**, aunque esté en GNV.

**Qué hace falta (en el backend):**

| campo | tipo | nota |
| --- | --- | --- |
| `savings_simulator.highlights[]` | string[] | las píldoras |

Las etiquetas del formulario son interfaz (ver entrada 14).

---

## 12. Imágenes del diseño de tarjetas y logos generados

**Archivo:** `src/components/CardBadge.astro`, `src/components/SimulatorCalculator.astro`
**Imagen:** `src/assets/images/Texto_del_párrafo__1_-removebg-preview.png`, `src/assets/images/logo-blue-hd.png`

- **Insignia de flecha** (círculo azul) en las tarjetas del blog y de `/desarrollo-sostenible`: entregada como `Texto_del_párrafo__1_-removebg-preview.png` (500×499, PNG transparente, 70 KB), usada tal cual; Astro genera WebP de 56/112 px. Las tarjetas de `feature_grid` usan una insignia dibujada en CSS, no esta imagen.
- **`logo-blue-hd.png` es generado**: el logo blanco (`logo.png`, 560×530) recoloreado a `#015694`, porque `logo-blue.png` solo mide 94×94. Se usa en el simulador. Si cambia el logo, hay que volver a generarlo.
- El encabezado, el formulario de contacto y el botón flotante siguen usando `logo-blue.png` (94 px), que se ve borroso a tamaños grandes.

**Qué hace falta:** nada del CMS, solo regenerar los generados si cambia el logo. Lo ideal es que el cliente entregue el logo en SVG (azul y blanco) y reemplazar los PNG.

---

## 13. SEO por defecto

**Archivo:** `src/config/seo.ts`
**Se renderiza en:** `<head>` de todas las páginas.

Nombre del sitio, separador, título y descripción por defecto, dominio de producción y redes para Open Graph están en duro. Cada página usa el subtítulo de su hero como descripción, así que el respaldo solo aplica donde falta.

**Qué hace falta (en el backend):**

| campo | tipo | nota |
| --- | --- | --- |
| `globals.seo.default_title` | string | |
| `globals.seo.default_description` | string | |
| `globals.seo.og_image` | media | imagen para compartir por defecto |

---

## 14. Textos de interfaz

**Archivo:** `LeadCaptureForm.astro`, `ContactBand.astro`, `StationsMap.astro`, `BlogIndex.astro`, `ServiceCards.astro`, `ChildPageCards.astro`, `ContactInfo.astro`, `SocialBand.astro`, `ClientsShowcase.astro`, `Testimonials.astro`
**Se renderiza en:** todo el sitio.

Etiquetas de formulario ("Nombre completo", "Correo electrónico", …), mensajes de éxito y error del envío, "Ver en el mapa", "Cómo llegar", "Leer más", "Ver más", "Ver página completa", "← Anteriores / Siguientes →", "Aún no hay publicaciones disponibles", las etiquetas pequeñas sobre los títulos ("Contacto", "Testimonios", "Redes sociales") y los títulos de respaldo cuando una sección llega sin título.

**Qué hace falta:** nada técnico — es una decisión. Son textos de interfaz, no contenido; lo normal es dejarlos en el código. Solo valdría moverlos si el sitio se tradujera.

---

## 15. Rutas sobrantes y restos de depuración

**Archivo:** `src/pages/inicio/index.astro`, `src/pages/public.html`, `src/components/ServiceCards.astro`

- `/inicio` publica una página de prueba ("Home", `lang="en"`, sin estilos).
- `/public.html` publica una plantilla de SEO con datos que no son del cliente ("Conversión a Gas Natural Vehicular (GNC) en Monterrey", "ahorra hasta 40%", "red de estaciones en todo México").
- `ServiceCards.astro` tiene `console.log` marcados `DEBUG` que imprimen cada respuesta del CMS en cada compilación.

**Qué hace falta:** nada del CMS. Borrar los dos archivos de `src/pages/` (o moverlos fuera) y los `console.log`.

---

## 16. Contenido pendiente en el CMS (no es deuda de código)

Problemas que se arreglan desde el panel:

- **Extractos del blog sin redactar:** `impacto-del-gas-natural-en-el-medio-ambiente` ("Extracto pendiente de redactar"), `gas-natural-vs-otros-combustibles` ("Resumen pendiente de redactar."), `nuevo-blog-desde-el-administrador` ("Excerpt del nuevo blog") y `beneficios-financieros-del-gas-natural-en-la-industria` (vacío).
- **Entrada de prueba publicada:** `nuevo-blog-desde-el-administrador` parece de prueba; despublicarla.
- **Dobles espacios pegados** en subtítulos de hero (GNV, GNC, GND) y en extractos del blog ("gas  natural", "Control  climático", "El  impulso").
- **Enlace del botón del carrusel:** `https://gnu.165.227.59.215.sslip.io//contacto#contacto-form-panel` tiene doble barra y, al ser una URL completa, se abre en otra pestaña. Debe ser `/contacto#contacto-form-panel`.
- **Imágenes de hero:** el carrusel de inicio espera 1138×474 (o 800×340); los heroes internos, 2048×768 en imagen y 800×320 en GIF. Otras medidas se recortan o muestran franjas difuminadas.
