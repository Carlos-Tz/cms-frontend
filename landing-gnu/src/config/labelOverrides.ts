// Display-only labels, keyed by page slug — the CMS page keeps its own
// title (its hero heading, its place in any card linking to it, etc.);
// this only overrides what the nav bar and the browser tab show for it,
// client side, per request. Shared by Layout.astro (nav) and CmsPage.astro
// (document title) so the two can't drift apart.
export const NAV_LABEL_OVERRIDES: Record<string, string> = {
  "distintivo-esr": "Reconocimientos",
  ecovadis: "Compromiso sostenible",
  voluntariado: "Voluntariado corporativo",
  "iniciativas-rse": "Iniciativas y programas",
};
