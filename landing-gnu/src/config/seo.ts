// Site-wide SEO defaults.
//
// Every page renders through `Layout.astro`, which reads this file to build
// <title>, <meta description>, canonical links, and Open Graph / Twitter tags.
// A page only needs to pass a `title`/`description` override when its content
// differs from these defaults — the brand name, separator, domain, etc. only
// need to change here.
export const seo = {
  // Shown after every page title, e.g. "Nuestros Servicios — GNU Gas Natural"
  siteName: "GNU Gas Natural",
  titleSeparator: "—",

  // Used for the homepage <title> and as a fallback when a page has no title.
  defaultTitle: "GNU Gas Natural — Energía limpia para tu hogar, negocio y flotilla",

  // Fallback <meta name="description"> when a page doesn't provide its own.
  defaultDescription:
    "GNU Gas Natural: soluciones de Gas Natural Comprimido, Domiciliario y Vehicular. Simula tu ahorro y encuentra tu estación más cercana.",

  // Production domain, no trailing slash. Used to build canonical/og:url links.
  siteUrl: "https://www.gnugas.mx",

  // Fallback social preview image (og:image / twitter:image). Set this to an
  // absolute path (e.g. "/og-image.jpg") once a 1200x630 image is added to
  // `public/`. Leave null to omit the image tags when no page provides one.
  defaultImage: null as string | null,

  // BCP 47 / og:locale format.
  locale: "es_MX",

  // e.g. "@gnugasnatural" — leave null to omit twitter:site.
  twitterHandle: null as string | null,
  twitterCard: "summary_large_image",
} as const;
