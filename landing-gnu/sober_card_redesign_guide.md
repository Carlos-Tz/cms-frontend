# Sober & Professional Card Redesign Guide

This document outlines the redesign strategy for converting bright, consumer-focused testimonial cards into a sleek, corporate, and sober design for Astro projects.

---

## 1. Key Design Principles

### Layout & Alignment
* **Left-Aligned Content:** Shifting from centered text to left-aligned text establishes a clearer typographic hierarchy and creates an editorial feel.
* **Baseline Alignment:** Ensure card heights remain balanced across grid columns so action links align along the same horizontal line regardless of quote length.

### Visual Styling & Palette
* **Controlled Contrasts:** Avoid heavy dark gradient inversions on hover. Instead, stick to clean white/light-slate backgrounds with subtle borders and soft drop shadows.
* **Unified Brand Logos:** Keep client logos subtly muted in grayscale at rest. On hover, restore their original brand colors to create an intentional interaction.

### Typography & Hierarchy
* **Clean Sans-Serif:** Use modern sans-serif fonts such as Inter, Geist, or standard system fonts.
* **Muted Color Hierarchy:** Reserve dark charcoal/black for primary names, slate gray for quote text, and cool light gray for secondary roles or labels.

### Subtle Hover Effects
* **Elevation over Color Inversion:** Elevate cards on hover with a slight $Y$-axis translation (`transform: translateY(-4px)`) paired with a soft shadow spread.
* **Muted CTAs:** Replace brightly colored pill buttons with clean text links featuring a directional arrow icon that slides horizontally on hover.

---

## 2. Astro Component Implementation

Save the following code in your project under `src/components/TestimonialCard.astro`:

```astro
---
// src/components/TestimonialCard.astro
export interface Props {
  logoSrc: string;
  logoAlt: string;
  quote: string;
  authorName: string;
  authorRole: string;
  linkUrl: string;
}

const { logoSrc, logoAlt, quote, authorName, authorRole, linkUrl } = Astro.props;
---

<article class="corporate-card">
  <div class="card-body">
    <div class="logo-wrapper">
      <img src={logoSrc} alt={logoAlt} class="client-logo" />
    </div>
    
    <blockquote class="testimonial-quote">
      "{quote}"
    </blockquote>
    
    <div class="author-meta">
      <span class="author-name">{authorName}</span>
      <span class="author-role">{authorRole}</span>
    </div>
  </div>
  
  <div class="card-footer">
    <a href={linkUrl} class="read-more">
      Leer testimonio 
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
  </div>
</article>

<style>
  .corporate-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2.5rem 2rem;
    max-width: 420px;
    min-height: 380px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* Hover States */
  .corporate-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e1;
  }

  .logo-wrapper {
    margin-bottom: 2rem;
    height: 48px;
    display: flex;
    align-items: center;
  }

  .client-logo {
    max-height: 100%;
    max-width: 160px;
    object-fit: contain;
    filter: grayscale(100%) opacity(0.8);
    transition: filter 0.3s ease;
  }

  .corporate-card:hover .client-logo {
    filter: grayscale(0%) opacity(1);
  }

  .testimonial-quote {
    margin: 0 0 2rem 0;
    font-size: 1.05rem;
    line-height: 1.6;
    color: #334155;
    font-weight: 400;
  }

  .author-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 2rem;
  }

  .author-name {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.95rem;
  }

  .author-role {
    font-size: 0.85rem;
    color: #64748b;
  }

  .card-footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid #f1f5f9;
  }

  .read-more {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #0284c7;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }

  .read-more:hover {
    color: #0369a1;
  }

  .read-more svg {
    transition: transform 0.2s ease;
  }

  .read-more:hover svg {
    transform: translateX(4px);
  }
</style>
```

---

## 3. Tailwind CSS Alternative

If your Astro project utilizes Tailwind CSS, you can implement the equivalent layout directly using utility classes:

```html
<article class="flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-8 max-w-md min-h-[380px] shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 group">
  <div>
    <div class="h-12 flex items-center mb-8">
      <img 
        src={logoSrc} 
        alt={logoAlt} 
        class="max-h-full max-w-[160px] object-contain filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" 
      />
    </div>
    
    <blockquote class="text-slate-700 text-base leading-relaxed mb-8">
      "{quote}"
    </blockquote>
    
    <div class="flex flex-col gap-1 mb-8">
      <span class="font-semibold text-slate-900 text-sm">{authorName}</span>
      <span class="text-xs text-slate-500">{authorRole}</span>
    </div>
  </div>
  
  <div class="pt-6 border-t border-slate-100">
    <a href={linkUrl} class="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors">
      Leer testimonio
      <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>
  </div>
</article>
```