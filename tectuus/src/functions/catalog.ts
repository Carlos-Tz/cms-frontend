import { fetchData } from "./fetch";
import type {
  Product,
  ProductCategory,
  ProductCategoryResponse,
  ProductListItem,
  ProductListResponse,
  ProductResponse,
} from "../types/catalog";

// The catalog listing is paginated (12 per page) and the site is built
// statically, so a page can't forward `?category=`/`?q=` to the API. Both
// helpers below pull the whole collection at build time; filtering and search
// then happen in the browser, which also fixes the API's accent-blind LIKE.

// Safety net so a bad `last_page` can never spin the build forever.
const MAX_PAGES = 25;

export async function fetchCategories(): Promise<ProductCategory[]> {
  const response: ProductCategoryResponse | undefined = await fetchData("product-categories");
  return response?.data ?? [];
}

export async function fetchAllProducts(): Promise<ProductListItem[]> {
  const products: ProductListItem[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response: ProductListResponse | undefined = await fetchData(`products?page=${page}`);
    const items = response?.data;

    // Undefined means the request failed — return what we have rather than
    // pretending the catalog is empty.
    if (!items?.length) break;

    products.push(...items);

    if (page >= (response?.meta?.last_page ?? page)) break;
  }

  return products;
}

export async function fetchProduct(slug: string): Promise<Product | undefined> {
  const response: ProductResponse | undefined = await fetchData(`products/${slug}`);
  return response?.data;
}

// The listing has no `description`, but most products have no image either, so
// the catalog cards lean on text. This pulls each product's detail at build
// time, a few at a time so the CMS isn't hit with the whole catalog at once.
export async function fetchProductDetails(products: ProductListItem[]): Promise<Map<string, Product>> {
  const details = new Map<string, Product>();
  const BATCH = 5;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = await Promise.all(products.slice(i, i + BATCH).map((product) => fetchProduct(product.slug)));
    batch.forEach((detail) => detail && details.set(detail.slug, detail));
  }

  return details;
}

// Descriptions are pasted from spec sheets: prose hard-wrapped mid-sentence,
// then "• Label: value" bullets. Prose lines are rejoined into one summary and
// "Label: value" bullets become specs; other bullets are kept as plain points.
export function parseDescription(text: string | null | undefined) {
  const summary: string[] = [];
  const specs: { label: string; value: string }[] = [];
  const points: string[] = [];

  // Hard wraps also split bullets, so a plain line right after a bullet is
  // that bullet's continuation ("…aplicaciones" / "especiales de 4, 5 o 6
  // cilindros."), not more summary.
  let last: "summary" | "spec" | "point" = "summary";

  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      last = "summary";
      continue;
    }

    const bullet = line.match(/^[•\-–*·]\s*(.+)$/);
    if (!bullet) {
      if (last === "spec") specs[specs.length - 1].value += ` ${line}`;
      else if (last === "point") points[points.length - 1] += ` ${line}`;
      else summary.push(line);
      continue;
    }

    const spec = bullet[1].match(/^([^:]{2,40}):\s*(.+)$/);
    if (spec) {
      specs.push({ label: spec[1].trim(), value: spec[2].trim() });
      last = "spec";
    } else {
      points.push(bullet[1].trim());
      last = "point";
    }
  }

  const tidy = (value: string) => value.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  specs.forEach((spec) => (spec.value = tidy(spec.value)));

  return {
    summary: summary.join(" ").replace(/\s+/g, " ").trim(),
    specs,
    points: points.map(tidy),
  };
}

// Catalog names follow a "CODE | tagline" convention ("DA300 | Potencia y
// flexibilidad…"). Splitting them lets the code headline a card or shelf and
// the tagline sit under it; a name without a bar is all headline.
export function splitLabel(text: string): { head: string; tail: string | null } {
  const [head, ...rest] = text.split("|").map((part) => part.trim());
  const tail = rest.join(" | ").trim();
  return { head: head.charAt(0).toUpperCase() + head.slice(1), tail: tail || null };
}

// Some categories were saved with a slug-like name ("postes",
// "servicios-y-sistemas") and the real label in `description`. Prefer the
// description in that case so the catalog never shows a slug.
export function categoryLabel(category: Pick<ProductCategory, "name"> & { description?: string | null }) {
  const name = category.name.trim();
  const description = category.description?.trim();
  const nameIsBare = !name.includes("|") && (/^[^\s]+$/.test(name) || description?.includes("|"));
  return splitLabel(nameIsBare && description ? description : name);
}

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// `price` is a decimal string and null carries meaning: industrial equipment is
// quoted more often than listed.
export function formatPrice(price: string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "Precio a cotizar";

  const amount = Number(price);
  return Number.isFinite(amount) ? priceFormatter.format(amount) : "Precio a cotizar";
}
