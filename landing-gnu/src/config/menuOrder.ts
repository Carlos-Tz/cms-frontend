// Display order for a menu entry's children, keyed by the parent's slug —
// applied client side over the order the CMS menu returns. Children not
// listed keep their CMS order after the listed ones, so a page added in the
// admin still shows up. Used by getMenu (lib/cms.ts), so the nav dropdowns
// and the hub cards built from childrenOf() all follow it.
export const MENU_ORDER_OVERRIDES: Record<string, string[]> = {
  "sobre-nosotros": ["nuestra-historia", "proposito-empresarial", "valores", "certificaciones"],
  // Labels shown via NAV_LABEL_OVERRIDES: Compromiso sostenible, Iniciativas y
  // programas, Voluntariado corporativo, Reconocimientos.
  "desarrollo-sostenible": ["ecovadis", "iniciativas-rse", "voluntariado", "distintivo-esr"],
};
