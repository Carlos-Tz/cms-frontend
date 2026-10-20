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
