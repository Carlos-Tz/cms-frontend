# Blue Gas — Lineamientos de UI y CSS para la plataforma de conversión de flotillas

Este documento describe el sistema de identidad visual, la configuración de CSS y las estrategias de UI/UX para la plataforma web en Astro de **Blue Gas**. El objetivo principal es convertir a los gerentes de flotillas (taxis, camiones de reparto y líneas de autobuses) generando confianza, demostrando un ROI alto y destacando la eficiencia ambiental.

---

## 1. Sistema de colores de marca

Con base en el **Manual de Identidad Corporativa de Blue Gas**, los colores primarios transmiten tecnología, aire limpio y confiabilidad, mientras que los colores secundarios dan señales visuales de alto contraste para el ROI, la seguridad y la categorización de flotillas.

### Paleta primaria (identidad de marca y UI base)
* **Pantone 281 UP (Azul marino oscuro)**: `#0B2545` — Fondos oscuros base, texto principal, tarjetas oscuras, encabezados, insignias de confianza.
* **Pantone 2925 UP (Cian aire limpio)**: `#2B9CDB` — Estados activos, íconos, CTAs secundarios, degradados.
* **Pantone 2171 UP (Azul océano tecnológico)**: `#0082CA` — Color principal de la marca, botones CTA principales, links interactivos.

### Paleta secundaria (funcional y para diferenciar flotillas)
* **Pantone 123 U (Verde eco)**: `#44B77B` — Resultados del cálculo de ROI, ahorro de combustible, certificaciones ecológicas, estados de éxito.
* **Pantone 142 U (Ámbar dorado)**: `#F5B025` — Insignias de alta prioridad, alertas de recuperación de la inversión, comparativas de precio de combustible, advertencias.
* **Pantone 2035 UP (Púrpura real)**: `#5C2D83` — Etiquetas de flotillas pesadas (autobuses/camiones), servicios premium, opciones de financiamiento.

---

## 2. Configuración de Astro y CSS

### CSS global (`src/styles/global.css`)
Agrega estas custom properties de CSS a tu hoja de estilos global para mantener la consistencia del tema en todas las páginas y componentes de Astro.

```css
@import "tailwindcss";

:root {
  /* Colores primarios de marca */
  --color-brand-navy: #0B2545;
  --color-brand-cyan: #2B9CDB;
  --color-brand-blue: #0082CA;

  /* Colores secundarios de marca */
  --color-brand-purple: #5C2D83;
  --color-brand-green: #44B77B;
  --color-brand-amber: #F5B025;

  /* Neutros para la UI */
  --color-bg-light: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text-main: #0F172A;
  --color-text-muted: #475569;
  --color-border: #E2E8F0;

  /* Fuentes */
  --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Resets y estilos base */
body {
  background-color: var(--color-bg-light);
  color: var(--color-text-main);
  font-family: var(--font-body);
  line-height: 1.6;
}

/* Fondo glassmorphism para las calculadoras de conversión */
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.glass-card-dark {
  background: rgba(11, 37, 69, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(43, 156, 219, 0.2);
}
```

### Config de Tailwind (`tailwind.config.mjs`)
Extiende Tailwind CSS para que se mapee directo a los lineamientos de la marca.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bluegas: {
          navy: '#0B2545',
          cyan: '#2B9CDB',
          blue: '#0082CA',
          purple: '#5C2D83',
          green: '#44B77B',
          amber: '#F5B025',
        },
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 130, 202, 0.25)',
        'glow-green': '0 0 20px rgba(68, 183, 123, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
```

---

## 3. Estrategias de UI/UX enfocadas en clientes con flotillas

A los gerentes de flotillas (taxis, camiones, autobuses) les importan tres métricas principales: **Ahorro en costos (OPEX)**, **Periodo de recuperación de la inversión** y **Confiabilidad/disponibilidad de la flotilla**.

### 1. Estrategia de la sección hero
* **Enfoque del titular**: Centrarse en el retorno económico y la eficiencia de la flotilla (p. ej., *"Reduce hasta 50% los costos operativos de tu flotilla con la conversión a GNC"*).
* **CTA de doble acción**: 
  * Acción principal (botón `#0082CA`): "Calcula el ahorro de tu flotilla".
  * Acción secundaria (borde `#2B9CDB`): "Solicita una auditoría de flotilla".
* **Visual de fondo**: Fondo azul marino oscuro de alto contraste (`#0B2545`) con patrones sutiles de líneas tecnológicas que representen el flujo de gas limpio y las redes de energía.

### 2. Categorización por segmento de flotilla
Usa los colores de la paleta secundaria para segmentar visualmente las soluciones que se ofrecen:

| Tipo de flotilla | Color de acento | Enfoque visual | Métrica de valor clave |
| :--- | :--- | :--- | :--- |
| **Taxis y transporte por aplicación** | `#F5B025` (Ámbar dorado) | Reducción del gasto diario en combustible | Reducción del costo de combustible/km y ROI en < 4 meses |
| **Autobuses y transporte urbano** | `#5C2D83` (Púrpura real) | Cumplimiento ambiental y ahorro a largo plazo | Cumplimiento de emisiones Euro VI y eficiencia en rutas urbanas |
| **Camiones pesados y de logística** | `#0082CA` (Azul océano tecnológico) | Sustitución de diésel por GNC | Ahorro mensual en alto kilometraje y vida útil del motor |

### 3. Calculadora interactiva de ahorro de combustible
Coloca un componente interactivo en un lugar destacado de la página de inicio:
* Usa **Verde eco (`#44B77B`)** para el contador final de dinero ahorrado y así resaltar el valor inmediato.
* Permite a los usuarios alternar entre **Taxi**, **Autobús** y **Camión**.
* Sliders para: *Número de vehículos*, *Kilometraje diario promedio (km)* y *Gasto mensual actual en combustible*.

---

## 4. Ejemplos de componentes de UI reutilizables en Astro

### Componente A: Sección hero (`src/components/Hero.astro`)

```astro
---
---

<section class="relative bg-bluegas-navy text-white py-20 px-6 overflow-hidden">
  <!-- Arco de luz decorativo sutil que replica el manual de marca -->
  <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-bluegas-cyan/20 pointer-events-none"></div>
  <div class="absolute -top-16 -right-16 w-96 h-96 rounded-full border border-bluegas-blue/30 pointer-events-none"></div>

  <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
    <div class="lg:col-span-7 space-y-6">
      <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-bluegas-cyan/10 text-bluegas-cyan border border-bluegas-cyan/30">
        Clean Energy Solutions for Fleets
      </span>
      <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
        Convert Your Fleet to <span class="text-transparent bg-clip-text bg-gradient-to-r from-bluegas-cyan to-bluegas-blue">CNG</span> & Cut Fuel Costs by 50%
      </h1>
      <p class="text-slate-300 text-lg">
        Custom fuel conversion kits and certified engineering for Taxis, Delivery Trucks, and Bus lines.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 pt-2">
        <a href="#calculator" class="px-8 py-4 bg-bluegas-blue hover:bg-bluegas-cyan transition-all duration-300 rounded-xl font-bold text-center text-white shadow-glow-blue">
          Calculate Your Fleet ROI
        </a>
        <a href="#contact" class="px-8 py-4 border border-bluegas-cyan/50 text-white hover:bg-bluegas-cyan/10 transition-all rounded-xl font-semibold text-center">
          Schedule Fleet Audit
        </a>
      </div>
    </div>

    <!-- Tarjeta de cifras rápidas -->
    <div class="lg:col-span-5 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
      <h3 class="text-lg font-semibold text-bluegas-cyan mb-4">Proven Fleet Impact</h3>
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-bluegas-navy/60 border border-slate-700">
          <p class="text-xs text-slate-400">Average Monthly Savings per Vehicle</p>
          <p class="text-2xl font-bold text-bluegas-green">$450 - $1,200 USD</p>
        </div>
        <div class="p-4 rounded-xl bg-bluegas-navy/60 border border-slate-700">
          <p class="text-xs text-slate-400">Emissions Reduction (CO2)</p>
          <p class="text-2xl font-bold text-bluegas-cyan">Up to -25%</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Componente B: Tarjeta de segmento de flotilla (`src/components/FleetCard.astro`)

```astro
---
interface Props {
  title: string;
  category: 'taxi' | 'bus' | 'truck';
  description: string;
  roiMonths: number;
  badgeColor: string;
}

const { title, category, description, roiMonths, badgeColor } = Astro.props;

const borderAccent = {
  taxi: 'border-t-bluegas-amber',
  bus: 'border-t-bluegas-purple',
  truck: 'border-t-bluegas-blue',
}[category];
---

<div class={`bg-white rounded-2xl p-6 shadow-md border border-slate-100 border-t-4 ${borderAccent} flex flex-col justify-between hover:shadow-xl transition-shadow`}>
  <div>
    <div class="flex justify-between items-center mb-4">
      <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white" style={`background-color: ${badgeColor};`}>
        {category.toUpperCase()}
      </span>
      <span class="text-xs font-medium text-slate-500">Payback ~{roiMonths} Mos</span>
    </div>
    <h3 class="text-xl font-bold text-bluegas-navy mb-2">{title}</h3>
    <p class="text-slate-600 text-sm">{description}</p>
  </div>
  
  <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
    <span class="text-xs text-slate-500">Certified Conversion Kit</span>
    <a href={`/solutions/${category}`} class="text-bluegas-blue font-semibold text-sm hover:text-bluegas-cyan transition-colors flex items-center gap-1">
      Learn More &rarr;
    </a>
  </div>
</div>
```

---

## 5. Checklist de resumen para desarrolladores de Astro

1. **Accesibilidad y contraste**: Asegúrate de que el texto sobre `#0B2545` (azul marino) sea blanco o slate claro (`#F8FAFC`). Usa texto oscuro en botones `#44B77B` o `#F5B025`.
2. **Rendimiento**: Usa la generación de sitios estáticos (SSG) de Astro para un renderizado rápido en los dispositivos móviles que usan los gerentes de flotilla en campo.
3. **Islas interactivas**: Implementa la calculadora de ahorro con React, Vue o JS puro envuelto en una directiva de cliente de Astro (`client:visible`).
4. **Señales de confianza**: Reserva espacio en el footer o en la sección sub-hero para certificaciones ISO, insignias de proveedores de equipo de gas y bancos aliados para financiamiento.