/**
 * Client-supplied page titles the CMS has not caught up with yet.
 *
 * Keyed by the page SLUG as the CMS serves it ("transporte-de-gnc"), not by
 * the text on screen. One entry covers every place that page's title is
 * shown: the header nav, the footer columns, the child-page cards, the page's
 * own hero and its browser title. Remove an entry once the wording is updated
 * in the admin and the CMS value takes over again.
 */
const TITLE_OVERRIDES: Record<string, string> = {
    "que-hacemos": "Filosofía empresarial",
    "proposito-empresarial": "Compromiso que nos mueve, visión que nos guía",
    "nuestra-historia": "¿Por qué traninn?",
    "carga-pesada": "Servicio dedicado de transporte",
    logistica: "Planeación logística",
    "transporte-de-gnc": "Transporte especializado de GNC",
}

/** The label to display for a page, preferring an override over the CMS title. */
export function pageTitle(slug: string | null | undefined, title: string): string {
    return (slug && TITLE_OVERRIDES[slug]?.trim()) || title
}

/**
 * Client-requested menu order, keyed by the PARENT page's slug. The child
 * slugs listed here come first in this order; any child not listed keeps the
 * CMS's own `position` ordering behind them. Drop an entry once the order is
 * fixed in the blueprint.
 */
const ORDER_OVERRIDES: Record<string, string[]> = {
    "nuestros-servicios": ["transporte-de-gnc", "carga-pesada", "logistica"],
}

/** Reorder one branch's children if an override names that parent. */
function orderChildren<T extends { slug: string }>(parentSlug: string, children: T[]): T[] {
    const order = ORDER_OVERRIDES[parentSlug]
    if (!order) return children

    // Unlisted slugs sort to the end; Array.sort is stable, so they keep the
    // order the CMS served them in.
    const rank = (slug: string) => {
        const index = order.indexOf(slug)
        return index === -1 ? order.length : index
    }

    return [...children].sort((a, b) => rank(a.slug) - rank(b.slug))
}

/**
 * Apply the title and order overrides across a CMS menu tree, children
 * included. Call it on the whole tree before picking a branch out of it, so
 * the branch comes back already renamed and reordered.
 */
export function applyTitleOverrides<T extends { slug: string; title: string; children?: T[] }>(
    items: T[]
): T[] {
    return items.map((item) => ({
        ...item,
        title: pageTitle(item.slug, item.title),
        children: item.children
            ? orderChildren(item.slug, applyTitleOverrides(item.children))
            : item.children,
    }))
}

/**
 * Split a title into display lines at sentence breaks, so a two-sentence
 * heading reads as two lines instead of wrapping wherever the column ends.
 *
 * Only a period followed by whitespace breaks the line, and only when at
 * least three word characters precede it — that keeps "S.A. de C.V." and
 * similar abbreviations on one line. A single-sentence title comes back as
 * one entry.
 */
export function titleLines(title: string | null | undefined): string[] {
    // Nullable at the source: banner slides and several section titles are
    // optional in the CMS schema, so callers pass through whatever they got.
    if (!title) return []

    return title
        .split(/(?<=\w{3}\.)\s+/)
        .map((line) => line.trim())
        .filter(Boolean)
}

/**
 * Split a card's text into display lines on "|", so an author can force a
 * break from the CMS without writing HTML:
 *
 *   "Cobertura nacional | Entregas programadas"
 *
 * Text with no pipe comes back as a single line, unchanged.
 */
export function textLines(text: string | null | undefined): string[] {
    if (!text) return []

    return text
        .split("|")
        .map((line) => line.trim())
        .filter(Boolean)
}
