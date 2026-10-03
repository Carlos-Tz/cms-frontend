// Several client-logo files the CMS serves are PNGs with a baked-in, fully
// opaque light-grey canvas (confirmed by sampling pixels: corners around
// rgb(219,218,218), center around rgb(249,248,247) — a flat radial gradient,
// not transparency), so no amount of CSS (object-fit, blend modes, filters)
// can make them sit cleanly on a white card — multiply/screen blending is a
// no-op against a white backdrop, and the grey covers the whole canvas, not
// just the edges, so cropping doesn't help either.
//
// This maps each affected upload to a pre-cleaned local copy (chroma-keyed:
// desaturated near-white/grey pixels turned transparent, trimmed, re-padded —
// see the one-off cleanup script used to generate public/images/clients/).
// Anything not in this map — a logo that never had the issue, or a future
// upload — just passes through unchanged.
const CLEANED: Record<string, string> = {
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/1u6K5NDxjjkxThZzUPUSPpk4eWbpO43fgffBwABH.png": "/images/clients/essity.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/JraNw52EjJJRh3tvRHLJVyIpbXgxteoFRDOV38T9.png": "/images/clients/artifibras.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/3ZAOsYMgBu94Ni0RW0zMyK2rTWJ3DGv1uQBUi7hw.png": "/images/clients/marves.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/u0fMqYxSCSYRjUzLIKwhiu1QyZTCMMYU0wAlHuXK.png": "/images/clients/synthoner.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/H0eTwckKHGkwOWvO2ariN1vuTgR9o64YfV4gf7Ia.png": "/images/clients/agrovim.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/y6puBmpYcH3eMZA1FxB9P0FpiE2WhxdYZDG9PAKb.png": "/images/clients/innovia.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/NXYiJB9tGmzTlqR52RtF8hftvtBVYahnNUy86FqA.png": "/images/clients/aak.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/FfavhZcYnOWdJ6ujkkfjbe4ooilzuDnDKukEwaqN.png": "/images/clients/defrut.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/8Ikphqg5ICTq6s7GIVEUQHPonaftbYRh1AjIdWJT.png": "/images/clients/kng.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/NR8G72hGqxTtfQl1AbQmfBuKXYGlPy2UsjnaVday.png": "/images/clients/bafar.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/g4Lch5Flcqu7gtRIpkrvGnKLKAruTYARFpNOkpj1.png": "/images/clients/clase-azul.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/bQptUkuO3MOLZ7f2buA9vVXENP5IAePsSak2QBmh.png": "/images/clients/quimic.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/hNrGlmXnhR1Z7M6a6u2KU35IxCae9ngE65m2w0tv.png": "/images/clients/bofrymex.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/YIkd0EWQ9y92ategF52nzqH9C1jeVuuGHnmfsP1S.png": "/images/clients/dinvertech.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/IcmUOKlpqRWtDC5DoOWBEVlfnEORkdiwrPBhlaIB.png": "/images/clients/artifibras-quote.png",
  "https://gnu-headless-cms.165.227.59.215.sslip.io/storage/media/v4bT6aE9WK13H6GEvQnn2Kf66foPzXJ6UFrh0cP4.png": "/images/clients/essity-quote.png",
};

export function cleanClientLogoUrl(url: string): string {
  return CLEANED[url] ?? url;
}
