# Landing Page & UI/CSS Optimization Recommendations

A comprehensive summary of actionable design, UX, content, and CSS/UI recommendations to improve conversion rates and visual aesthetics for the GNU Gas Natural landing page.

---

## 1. Hero Section & Primary CTAs

* **Action-Oriented Hero Button**: Replace the main CTA button **"Ir al sitio"**. Since visitors are already on the landing page, use a high-intent, direct action button such as **"Cotizar ahora"** or **"Calcula tu ahorro"**.
* **Streamline Floating Elements**: Reduce competing floating/fixed action elements (top-right header button *"Contacto"*, right vertical tab *"Calcula tu ahorro"*, and the WhatsApp icon bottom right). Keep WhatsApp pinned, make the header button sticky on scroll, and eliminate redundant floating banners.
* **Hero Subtitle Clarity**: Elaborate briefly on who the target audience is (e.g., *"Soluciones en Gas Natural para industrias, comercios y flotillas vehiculares en México"*).

---

## 2. Savings Calculator (Simulador de Ahorro)

* **Default Calculation State**: Replace the default **"$0 MXN"** output with a pre-filled, realistic example value (e.g., `$20,000 MXN` input) so visitors immediately see estimated savings without assuming the tool is broken.
* **Lead Capture Bridge**: Add a direct CTA inside or immediately below the calculator box reading **"Solicitar cotización con esta tarifa"**, automatically passing the calculated value down into the contact form message field.

---

## 3. Social Proof & Data Consistency

* **Fix Data Conflicts**:
  * **Station Count**: Resolve the conflict between **"120+ estaciones en México"** in the stats bar and **"2 estaciones · elige una para verla en el mapa"** in the map section title. Change the map title to *"Estaciones destacadas"* or add a location search filter.
  * **Placeholder Details**: Update the placeholder phone numbers (`+52 81 0000 0000`) and contact form examples (`Ej. 55 1234 5678`) to active business details before going live.
* **Refine the Client Stat**: Reframe *"14+ empresas que confían en GNU"* to *"14+ corporativos e industrias líderes"* to emphasize client tier and enterprise trust.
* **Enhance Testimonials**: Add concrete outcome metrics to testimonial cards (e.g., *"Reducción del 35% en costos operativos desde 2021"*) alongside representative names or roles.

---

## 4. Layout, Content & Visual Hierarchy

* **Section Contrast**: Break up the continuous light cyan background by introducing alternating section background colors (e.g., pure white `#FFFFFF` for the calculator and contact form; light slate `#F8FAFC` for testimonials and stats).
* **Media & Visuals**: Replace stylized/rendered graphics with high-resolution, authentic photography of industrial facilities, fleets, or equipment to build trust with enterprise B2B buyers.

---

## 5. CSS & UI Styling Specifics

### Component Styling & Shadows
* **Soften Box Shadows**: Replace heavy, dark drop shadows with diffuse, multi-layered shadows:
  ```css
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  ```
* **Declutter Client Logos**: Remove individual white card containers around client logos. Apply grayscale opacity filters and animate on hover:
  ```css
  .client-logo {
    filter: grayscale(100%) opacity(60%);
    transition: all 0.3s ease;
  }
  .client-logo:hover {
    filter: grayscale(0%) opacity(100%);
  }
  ```
* **Elevate Map Overlays**: Apply a frosted backdrop filter and elevated shadow to location cards floating over map tiles:
  ```css
  backdrop-filter: blur(8px);
  ```

### Typography, Spacing & Variables
* **Pill Badge Padding**: Adjust pill-shaped section badges to have proportional padding, letter-spacing, and font weight:
  ```css
  padding: 4px 16px;
  font-weight: 600;
  letter-spacing: 0.05em;
  ```
* **Standardize Border Radii**: Implement uniform CSS design tokens across elements:
  ```css
  :root {
    --radius-md: 8px;
    --radius-lg: 16px;
    --radius-xl: 24px;
  }
  ```
* **Subtle Grid Background**: Reduce the opacity of the background grid/dot pattern down to `0.03`–`0.05` so it functions purely as an understated texture.

### Interactions & Focus States
* **Form Input Focus States**: Add a highlighted focus ring on active input wrappers:
  ```css
  .input-field:focus-within {
    border-color: #00BCD4;
    box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.15);
  }
  ```
* **Tactile Button Hover States**: Include subtle vertical translation alongside soft brand-colored glow on main action buttons:
  ```css
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 188, 212, 0.3);
  }
  ```
* **Calculator Output Animation**: Smoothly transition calculated results using CSS transitions or a JavaScript count-up effect rather than instant snapping.