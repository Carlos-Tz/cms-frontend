# GNU Gas Natural – Landing Page Feedback

This is feedback on the GNU Gas Natural landing page, based on a full-page screenshot. Part 1 covers content, credibility, and conversion. Part 2 covers CSS and UI.

Overall this is a solid foundation. The visual system is consistent (teal accent, pill labels, rounded cards), and the savings simulator, floating "Calcula tu ahorro" button, and WhatsApp shortcut are good choices for this business. Most of the issues are small credibility problems, plus a page that hides its strongest selling points.

---

# Part 1 – General Tips

## Fix before launch

**Placeholder data.** "Av. Ejemplo 123" and "+52 81 0000 0000" appear in the contact cards, both station cards, and the footer. Visitors read placeholder details as a sign the site isn't real.

**The 120 vs. 2 contradiction.** The hero cards promise "+120 estaciones en todo México," but the map section says "2 estaciones." If you operate 2 stations inside a larger network, say so, for example "2 estaciones propias · acceso a +120 en la red."

**Cropped client logos.** Artifibras, Marves, Synthoner, Innovia and AAK are all clipped. Use `object-fit: contain` with some padding inside each card. You can also drop the name captions, since the logos already show the names.

**Clipped station card.** The second station card's buttons are cut off at the bottom, which probably means the container has a fixed height. Let it grow, or make the list scroll.

**The dark floating toolbar over the "Cobertura" card.** If it's part of the page, it's hiding the card. If it's from your screenshot tool, ignore this.

## Biggest conversion wins

**Hero CTA.** "Ir al sitio" makes no sense on a page the visitor is already on. Change it to "Calcula tu ahorro" (linking down to the simulator), with "Cotiza sin compromiso" as a secondary button. The headline is also generic. Your best number is 40%, so lead with it: something like "Ahorra hasta 40% en combustible con gas natural."

**Hero image.** A hazy skyline full of smokestacks works against your "Energía responsable / menor huella de carbono" message. A photo of your stations, trucks, or a clean fleet would support the message instead.

**Simulator.** Before anyone types, it shows "$0 MXN," which is a deflating first impression. Prefill a realistic example so it shows a real saving when the page loads. After someone calculates, add a "Quiero esta cotización" button that fills the contact form with their numbers. That makes the simulator a lead generator.

**Services section.** GNC, GND and GNV only appear as a stat, and most visitors won't know the acronyms. Add three cards that each cover what the service is, who it's for, and one key benefit. Related to this, the footer mentions "hogares, negocios y flotillas," but your clients are industrial. Pick a primary audience, or add clear paths for each segment.

**Testimonials.** The logos take up most of each card, while the actual quote is tiny gray italic text cut off behind a button. Reverse that. Show the quote with a concrete result, plus the person's name and role, and keep the logo small. "Más de 10 años con Essity" is strong proof, so put it up front.

**Stats.** "14+ empresas" can look small next to "120+ estaciones," and "3 soluciones" isn't really a stat. Better options would be years in operation, m³ delivered, tons of CO₂ avoided, or vehicles converted. Also, 40% and 120+ already appear in the hero cards, so repeating them here wastes space.

## Polish

**Button contrast.** White text on bright cyan probably fails WCAG contrast. Darken the teal or switch to dark button text.

**"Energía Confiable" section.** The justified text creates uneven gaps, which get worse on mobile, so left-align it. The pipe image there also looks like a low-res render, and a real photo of your infrastructure would build more trust.

**Navigation.** "Contacto" appears twice, as a link and as the button. Make the button an action instead, like "Cotizar." The header logo is also quite small.

**Section labels.** Several just repeat their heading, like "NUESTROS CLIENTES" above "Nuestros clientes." Use the label for a different message, or drop it.

**Contact form.** For B2B leads, a "Consumo mensual aproximado" or "Tipo de empresa" field helps you qualify inquiries. "Solicitar cotización" is a stronger button than "Enviar." Linking your aviso de privacidad next to the button also reassures people before they submit.

---

# Part 2 – CSS / UI Tips

These tips are based on what's visible in the screenshot, so check the details against your actual code.

## 1. Add design tokens first

The biggest UI problem is drift. There are at least three blues (the cyan buttons, the darker blue stat numbers, the blue "Cómo llegar" link), border radii that vary between cards, inputs and buttons, and shadows that change from section to section. Define everything once:

```css
:root {
  --c-primary: #12b5cb;      /* fills, icons, buttons */
  --c-primary-ink: #0b7285;  /* text & links on white (5.5:1) */
  --c-text: #1a2433;
  --c-muted: #5b6676;        /* body gray that still passes 4.5:1 */
  --c-border: #c3cad4;       /* inputs need 3:1 against the bg */

  --radius-sm: 8px;  --radius-md: 14px;  --radius-lg: 24px;
  --shadow-1: 0 1px 3px rgb(16 24 40 / .08);
  --shadow-2: 0 16px 40px -12px rgb(16 24 40 / .18);
  --section-y: clamp(4rem, 8vw, 7rem);
}
```

Adjust the hex values to your brand. The rule that matters is that cyan is for fills and the darker teal is for text. Use `--section-y` for every section's vertical padding. Right now the clients section has much more padding than the others.

## 2. Typography

Your body text, chips, eyebrow labels and footer all look like 11–13px light gray. That's hard to read, especially on mobile.

```css
body { font-size: 1rem; line-height: 1.6; color: var(--c-text); }
p    { max-width: 65ch; text-wrap: pretty; }
h1, h2 { line-height: 1.1; text-wrap: balance; }
h2   { font-size: clamp(1.75rem, 1.2rem + 2vw, 2.5rem); }
.eyebrow { font-size: .75rem; letter-spacing: .08em; }  /* never below 12px */
.stat-number { font-variant-numeric: tabular-nums; }
```

`text-wrap: balance` prevents headings like "Energía que impulsa a / México" from leaving one word alone on the last line. `tabular-nums` keeps the stats and the simulator result from jittering if you animate them counting up.

## 3. Section-by-section fixes

**Hero.** The headline sits on a busy orange and teal image. A gradient scrim makes it readable no matter which photo you use:

```css
.hero { position: relative; min-height: min(85svh, 760px); }
.hero::before {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgb(0 0 0 / .6), rgb(0 0 0 / .15) 55%, transparent 75%);
}
.hero img { object-fit: cover; object-position: 60% center; }
```

Use `svh` rather than `vh` so mobile browser toolbars don't cause layout jumps. Give the hero image `fetchpriority="high"`. You can also remove the scroll-mouse icon, because the overlapping cards already show there's more below.

**Simulator.** It currently has a card with a shadow inside another card with a shadow. Flatten the inner result panel to a tinted background with no shadow, and match the radii with *inner radius = outer radius − padding*. Style the `<select>` with `appearance: none` and a custom chevron so it matches the inputs. Use `inputmode="numeric"` on the amount field, and format thousands as the user types.

**Logo marquee.** This implements the crop fix from Part 1. Drop the card around each logo and give every logo the same height:

```css
.logos { mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.logos img { height: 40px; width: auto; object-fit: contain;
             filter: grayscale(1); opacity: .65; transition: .2s; }
.logos img:hover { filter: none; opacity: 1; }
.logos:hover .track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .track { animation: none; } }
```

A mask fades the edges into any background, so you don't need white overlay divs. Use transparent SVG or PNG logos, since a few of yours look like they have white boxes.

**Contact info grid.** Five cards in two columns leave "Horario" alone on the last row. Either span it with `.horario { grid-column: 1 / -1; }` or merge it into another card. I'd also drop the headset avatar next to the heading, because it looks like clip art next to the cleaner icons elsewhere.

**Form.** The input borders are too faint to see. Use `--c-border`, and give every field a clear `:focus-visible` state. Add `autocomplete="name"`, `type="email"` and `type="tel"` so mobile shows the right keyboards and can autofill. Stack email and phone below about 600px. Make the submit button at least 44px tall, and full width on mobile.

**Station list.** Make the map and the list share one height, and let the list scroll inside it:

```css
.stations-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; height: 420px; }
.stations-list { overflow-y: auto; scroll-snap-type: y proximity; }
.station[aria-pressed="true"] { border-color: var(--c-primary); box-shadow: var(--shadow-2); }
```

The selected station also needs a visible state, so users can tell which one the map is showing. On mobile, switch to a single column with `height: auto`.

## 4. Interaction and accessibility states

```css
:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 2px; }
header { position: sticky; top: 0; background: rgb(255 255 255 / .85); backdrop-filter: blur(12px); }
section[id] { scroll-margin-top: 80px; }   /* anchors don't hide under header */
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
```

The small "Leer testimonio" pills and the footer social icons look under 44px, so enlarge their hit areas with padding. On mobile, the two floating buttons will cover content, including the form's submit button. Put `bottom: calc(1rem + env(safe-area-inset-bottom))` on them, and hide "Calcula tu ahorro" with an IntersectionObserver while the simulator is on screen.

## 5. Consistency cleanup

The sections use too many background treatments: gradient blobs, a dot grid, a diagonal band, grid lines and a flat tint. Choose two and alternate them, for example white and a soft tint, with blobs only in the hero area.

Section headers also vary. Some have an eyebrow pill, some an underline bar, and some both. Build one `.section-head` component and use it on every section.

Finally, limit yourself to the two shadow levels above. The about image, the map and the simulator all have heavy shadows right now, which makes everything look equally elevated.
