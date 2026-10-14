# Certificaciones: campos que necesitamos del backend

La página `/sobre-nosotros/certificaciones` muestra hoy su contenido escrito
directamente en el frontend (`src/components/CertificacionesContent.astro`),
con las imágenes de esta carpeta. Para que el equipo pueda editarlo desde el
administrador, el endpoint `GET pages/certificaciones` debe devolver las
secciones descritas abajo.

El `page_hero` ya existe y no cambia. El `feature_grid` actual
("CERTIFICACIONES ACTUALES", con una sola tarjeta ISO 9001) se oculta en el
frontend y lo sustituye la sección siguiente.

Todas las imágenes se envían como en el resto del CMS: una ruta de media o una
URL absoluta.

---

## 1. `certifications`: certificaciones vigentes (sección nueva)

Bloque destacado con el sello de cada certificación junto a su descripción.
Hoy hay una (ISO 9001), pero debe aceptar varias.

```json
{
  "type": "certifications",
  "content": {
    "eyebrow": "Certificación vigente",
    "items": [
      {
        "badge": "media/iso-9001.png",
        "badge_alt": "Sello de certificación ISO 9001",
        "title": "ISO 9001: calidad en cada proceso",
        "body": "<p>En GNU Gas Natural contamos con la certificación ISO 9001…</p><p>Este respaldo abarca…</p>",
        "points": [
          "Procesos documentados y controlados",
          "Mejora continua en cada etapa",
          "Enfoque en la satisfacción del cliente"
        ],
        "issuer": null,
        "certificate_number": null,
        "valid_from": null,
        "valid_until": null,
        "document": null
      }
    ]
  }
}
```

| Campo                        | Tipo                    | Requerido | Notas |
| ---------------------------- | ----------------------- | --------- | ----- |
| `eyebrow`                    | string o null           | No        | Etiqueta pequeña sobre el título. |
| `items[]`                    | array                   | Sí        | Una entrada por certificación, en el orden en que se muestran. |
| `items[].badge`              | media                   | Sí        | Sello o logo. Imagen cuadrada, de al menos 640×640 px. Se muestra recortada en círculo. |
| `items[].badge_alt`          | string                  | Sí        | Texto alternativo del sello, por accesibilidad. |
| `items[].title`              | string                  | Sí        | Título del bloque. |
| `items[].body`               | HTML (texto enriquecido) | Sí       | Uno o más párrafos. |
| `items[].points`             | string[]                | No        | Puntos clave que se muestran como etiquetas. Se recomiendan de 2 a 4. |
| `items[].issuer`             | string o null           | No        | Organismo certificador. **No lo conocemos todavía.** |
| `items[].certificate_number` | string o null           | No        | Número de certificado. **No lo conocemos todavía.** |
| `items[].valid_from`         | fecha (YYYY-MM-DD) o null | No      | Fecha de emisión. **No la conocemos todavía.** |
| `items[].valid_until`        | fecha (YYYY-MM-DD) o null | No      | Fecha de vigencia. Si ya pasó, la certificación no debería mostrarse como "vigente". |
| `items[].document`           | media (PDF) o null      | No        | Certificado descargable. |

El frontend todavía no muestra `issuer`, `certificate_number`, las fechas ni
`document`. Se incluyen porque una certificación gana credibilidad cuando los
muestra; en cuanto lleguen, se añaden al diseño.

---

## Orden de las secciones en `pages/certificaciones`

1. `page_hero` (ya existe)
2. `certifications`

## Cuando el backend esté listo

En el frontend habrá que:

- crear el componente `Certifications.astro` y
  registrarlo en `SectionRenderer.astro`;
- quitar `CertificacionesContent` y `excludeTypes={["feature_grid"]}` de
  `src/pages/sobre-nosotros/certificaciones/index.astro`.
