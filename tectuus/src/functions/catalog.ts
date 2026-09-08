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
