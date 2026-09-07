// Site-wide SEO defaults.
//
// Every page renders through `Layout.astro`, which reads this file to build
// <title>, <meta description>, canonical links, and Open Graph / Twitter tags.
// A page only needs to pass a `title`/`description` override when its content
// differs from these defaults — the brand name, separator, domain, etc. only
// need to change here.
export const seo = {
  // Shown after every page title, e.g. "Productos — Tectuus"
  siteName: "Tectuus",
  titleSeparator: "—",

  // Used for the homepage <title> and as a fallback when a page has no title.
  defaultTitle: "Tectuus — Soluciones en gas natural para tu industria",

  // Fallback <meta name="description"> when a page doesn't provide its own.
  defaultDescription:
    "Tectuus: ingeniería y equipo industrial para gas natural — EDRM, compresoras y valvulería, con instalación y mantenimiento certificado.",

  // Production domain, no trailing slash. Used to build canonical/og:url links.
  siteUrl: "https://www.tectuus.mx",

  // Fallback social preview image (og:image / twitter:image). Set this to an
  // absolute path (e.g. "/og-image.jpg") once a 1200x630 image is added to
  // `public/`. Leave null to omit the image tags when no page provides one.
  defaultImage: null as string | null,

  // BCP 47 / og:locale format.
  locale: "es_MX",

  // e.g. "@tectuus" — leave null to omit twitter:site.
  twitterHandle: null as string | null,
  twitterCard: "summary_large_image",
} as const;
