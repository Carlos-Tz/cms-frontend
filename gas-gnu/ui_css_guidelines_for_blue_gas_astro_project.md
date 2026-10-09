# Blue Gas — UI & CSS Guidelines for Fleet Conversion Platform

This document outlines the visual identity system, CSS configuration, and UI/UX strategies for the **Blue Gas** Astro web platform. The primary goal is to convert fleet managers (taxis, delivery trucks, and bus lines) by establishing trust, demonstrating high ROI, and highlighting environmental efficiency.

---

## 1. Brand Color System

Based on the **Blue Gas Manual de Identidad Corporativa**, the primary colors convey technology, clean air, and reliability, while secondary colors provide high-contrast visual cues for ROI, safety, and fleet categorization.

### Primary Palette (Brand Identity & Core UI)
* **Pantone 281 UP (Dark Navy)**: `#0B2545` — Base darks, primary text, dark cards, headers, trust badges.
* **Pantone 2925 UP (Clean Air Cyan)**: `#2B9CDB` — Active states, icons, secondary CTAs, gradients.
* **Pantone 2171 UP (Tech Ocean Blue)**: `#0082CA` — Primary brand color, main CTA buttons, interactive links.

### Secondary Palette (Functional & Fleet Differentiating)
* **Pantone 123 U (Eco Green)**: `#44B77B` — ROI calculation results, fuel savings, eco certifications, success states.
* **Pantone 142 U (Amber Gold)**: `#F5B025` — High priority badges, payback alerts, fuel price comparisons, warnings.
* **Pantone 2035 UP (Royal Purple)**: `#5C2D83` — Heavy-duty fleet tags (buses/trucks), premium services, financing options.

---

## 2. Astro & CSS Configuration

### Global CSS (`src/styles/global.css`)
Add these CSS custom properties to your global stylesheet to maintain theme consistency across all Astro pages and components.

```css
@import "tailwindcss";

:root {
  /* Brand Primary Colors */
  --color-brand-navy: #0B2545;
  --color-brand-cyan: #2B9CDB;
  --color-brand-blue: #0082CA;

  /* Brand Secondary Colors */
  --color-brand-purple: #5C2D83;
  --color-brand-green: #44B77B;
  --color-brand-amber: #F5B025;

  /* Neutrals for UI */
  --color-bg-light: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text-main: #0F172A;
  --color-text-muted: #475569;
  --color-border: #E2E8F0;

  /* Fonts */
  --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Base resets & styles */
body {
  background-color: var(--color-bg-light);
  color: var(--color-text-main);
  font-family: var(--font-body);
  line-height: 1.6;
}

/* Glassmorphism background for conversion calculators */
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

### Tailwind Config (`tailwind.config.mjs`)
Extend Tailwind CSS to map directly to the brand guidelines.

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

## 3. Targeted UI/UX Strategies for Fleet Clients

Fleet managers (taxis, trucks, buses) care about three main metrics: **Cost Savings (OPEX)**, **Payback Period**, and **Fleet Reliability/Uptime**.

### 1. Hero Section Strategy
* **Headline Focus**: Focus on economic return and fleet efficiency (e.g., *"Reduce Your Fleet Operating Costs by up to 50% with CNG Conversion"*).
* **CTA Dual Action**: 
  * Primary Action (`#0082CA` button): "Calculate Fleet Savings".
  * Secondary Action (`#2B9CDB` border): "Request Fleet Audit".
* **Background Visual**: High-contrast dark navy background (`#0B2545`) with subtle tech line patterns representing clean gas flow and energy networks.

### 2. Fleet Segment Categorization
Use secondary palette colors to visually segment solution offerings:

| Fleet Type | Accent Color | Visual Focus | Key Value Metric |
| :--- | :--- | :--- | :--- |
| **Taxi & Rideshare** | `#F5B025` (Amber Gold) | Daily fuel expense reduction | Fuel cost/km reduction & ROI in < 4 months |
| **Buses & Urban Transport** | `#5C2D83` (Royal Purple) | Environmental compliance & long-term savings | Euro VI emissions compliance & urban route efficiency |
| **Heavy-Duty & Logistics Trucks** | `#0082CA` (Tech Ocean Blue) | Diesel-to-CNG displacement | High-mileage monthly savings & engine lifespan |

### 3. Interactive Fuel Savings Calculator
Place an interactive component prominently on the homepage:
* Use **Eco Green (`#44B77B`)** for the final money saved counter to highlight immediate value.
* Allow users to toggle between **Taxi**, **Bus**, and **Truck**.
* Sliders for: *Number of Vehicles*, *Average Daily Mileage (km)*, and *Current Monthly Fuel Spend*.

---

## 4. Reusable Astro UI Component Examples

### Component A: Hero Section (`src/components/Hero.astro`)

```astro
---
---

<section class="relative bg-bluegas-navy text-white py-20 px-6 overflow-hidden">
  <!-- Subtle decorative light arc mirroring brand manual -->
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

    <!-- Quick Stats Card -->
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

### Component B: Fleet Segment Card (`src/components/FleetCard.astro`)

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

## 5. Summary Checklist forastro Developers

1. **Accessibility & Contrast**: Ensure text placed on `#0B2545` (Navy) is white or light slate (`#F8FAFC`). Use dark text on `#44B77B` or `#F5B025` buttons.
2. **Performance**: Use Astro's static site generation (SSG) for fast rendering on mobile devices used by field fleet managers.
3. **Interactive Islands**: Implement the savings calculator using React, Vue, or vanilla JS wrapped in an Astro client directive (`client:visible`).
4. **Trust Signals**: Reserve space in the footer or sub-hero section for ISO certifications, gas equipment provider badges, and bank financing partners.