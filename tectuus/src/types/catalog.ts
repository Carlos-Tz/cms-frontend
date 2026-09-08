// Shape of the CMS's public catalog endpoints. Unlike pages, the catalog is a
// data domain — the admin creates and deletes categories and products, so they
// arrive as their own collections instead of as `sections` of a page.

// `GET /product-categories` — feeds the Productos submenu and the filter bar.
export type ProductCategory = {
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  // Active products only.
  products_count: number;
};

export type ProductCategoryResponse = {
  status: string;
  data: ProductCategory[];
  meta: Record<string, any>;
};

// `GET /products` — the listing omits `description` and collapses `images` to
// the first one, so it has its own type separate from the detail below.
export type ProductListItem = {
  slug: string;
  name: string;
  // Decimal string ("189500.50") — never a number, and null means
  // "precio a cotizar". Always MXN; the API has no currency field.
  price: string | null;
  category: Pick<ProductCategory, "slug" | "name">;
  image?: string | null;
};

export type ProductListResponse = {
  status: string;
  data: ProductListItem[];
  meta: {
    site?: string;
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

// `GET /products/{slug}` — 404s for an inactive product, even if it exists.
export type Product = {
  slug: string;
  name: string;
  price: string | null;
  category: Pick<ProductCategory, "slug" | "name">;
  description?: string | null;
  images?: string[];
};

export type ProductResponse = {
  status: string;
  data: Product;
  meta: Record<string, any>;
};
