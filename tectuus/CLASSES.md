# Clases para contenido del CMS — tectuus (sitio `tectuus`)

Clases CSS que se pueden escribir **dentro del HTML que se carga en el CMS**
para darle un estilo especial a una parte del texto. El sitio ya las conoce:
basta con agregar `class="…"` a la etiqueta.

> Regla general: solo funcionan las clases de esta lista. Cualquier otra se
> ignora y el texto se ve como un párrafo normal.

**Dónde funcionan:** en todo campo de texto enriquecido (HTML):

- la **descripción de un producto** (`/productos/[slug]`);
- el **cuerpo de una sección `rich_text`** de cualquier página (`body`).

**Dónde viven:** `src/styles/global.css`, bloque *CMS CLASSES*. Si se agrega
una clase nueva allí, hay que documentarla aquí.

---

## `highlight_tag` — distintivo destacado

Para resaltar una credencial o distinción: proveedor autorizado,
certificación, alianza, etc.

**Se ve como:** una insignia verde redondeada, con un ícono de certificado a la
izquierda, separada del texto anterior. En secciones de fondo azul oscuro se
pinta en verde claro.

**Uso:**

```html
<p class="highlight_tag">
    Tectuus Proveedor autorizado de Fornovogas.
</p>
```

**Ejemplo en uso:** descripción del producto DA300
(`/productos/da300-potencia-y-flexibilidad-para-operaciones-exigentes`).

**Recomendaciones:**

- Una frase corta, de una línea; el estilo está pensado para un distintivo,
  no para un párrafo largo.
- Una por bloque de texto, normalmente al final.
- No hace falta agregar el ícono: el sitio lo pone solo.
