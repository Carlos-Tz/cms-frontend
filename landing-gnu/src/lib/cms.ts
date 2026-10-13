// Typed, memoized access to the CMS public API.
//
// The site is built statically: every page runs its frontmatter at build time,
// and the layout alone asks for `menu` and `globals` once per page. Memoizing
// by endpoint turns that into one request per endpoint per build, and gives
// every caller the same shapes instead of re-declaring them in each page.
import { fetchData } from "../functions/fetch";
import type { Globals } from "../types/globals";
import { MENU_ORDER_OVERRIDES } from "../config/menuOrder";

export type Section = { type: string; content: Record<string, any> };

export type Page = {
  slug: string;
  path: string;
  title: string;
  sections: Section[];
};

export type MenuItem = {
  slug: string;
  path: string;
  title: string;
  children: MenuItem[];
};

export type PageHero = {
  title: string;
  subtitle?: string | null;
  image?: string | null;
};

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
};

export type BlogPost = BlogPostSummary & { body: string };

export type BlogList = {
  posts: BlogPostSummary[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

type Envelope<T> = { status: string; data: T; meta: Record<string, any> };

const cache = new Map<string, Promise<Envelope<any> | undefined>>();

function get<T>(suffix: string): Promise<Envelope<T> | undefined> {
  if (!cache.has(suffix)) cache.set(suffix, fetchData(suffix));
  return cache.get(suffix)!;
}

async function data<T>(suffix: string): Promise<T | null> {
  const res = await get<T>(suffix);
  return res?.status === "success" ? res.data : null;
}

/** Children re-sorted per MENU_ORDER_OVERRIDES; unlisted ones keep CMS order, last. */
function applyMenuOrder(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    const children = applyMenuOrder(item.children ?? []);
    const order = MENU_ORDER_OVERRIDES[item.slug];
    if (!order) return { ...item, children };
    const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
    // Array.prototype.sort is stable, so unlisted children keep their CMS order.
    return { ...item, children: [...children].sort((a, b) => rank(a.slug) - rank(b.slug)) };
  });
}

export const getMenu = async () => applyMenuOrder((await data<MenuItem[]>("menu")) ?? []);
export const getGlobals = async () => (await data<Globals>("globals")) ?? {};
export const getPage = (slug: string) => data<Page>(`pages/${slug}`);

export async function getBlogList(page = 1): Promise<BlogList | null> {
  const res = await get<BlogPostSummary[]>(`blog?page=${page}`);
  if (res?.status !== "success") return null;
  return { posts: res.data, meta: res.meta as BlogList["meta"] };
}

export const getBlogPost = (slug: string) => data<BlogPost>(`blog/${slug}`);

/** Every post across all pages of `GET blog`, newest first. */
export async function getAllBlogPosts(): Promise<BlogPostSummary[]> {
  const first = await getBlogList(1);
  if (!first) return [];
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.last_page - 1) }, (_, i) => getBlogList(i + 2)),
  );
  return [first, ...rest].flatMap((list) => list?.posts ?? []);
}

export const sectionOf = (page: Page | null, type: string) =>
  page?.sections.find((section) => section.type === type)?.content;

/** The page's "Encabezado de página", which doubles as its SEO summary. */
export const heroOf = (page: Page | null) => sectionOf(page, "page_hero") as PageHero | undefined;

/** A menu entry by slug, anywhere in the tree. */
export async function findMenuItem(slug: string): Promise<MenuItem | null> {
  const walk = (items: MenuItem[]): MenuItem | null => {
    for (const item of items) {
      if (item.slug === slug) return item;
      const found = walk(item.children ?? []);
      if (found) return found;
    }
    return null;
  };
  return walk(await getMenu());
}

/**
 * wa.me link from the site-wide whatsapp_button, or null without a number.
 * A link to a placeholder number looks live and goes nowhere, which is worse
 * than no link at all.
 */
export function whatsappHref(globals: Globals): string | null {
  const digits = (globals.whatsapp_button?.phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const message = globals.whatsapp_button?.prefilled_message;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * Published children of a page, as the CMS menu lists them. Unpublishing a
 * page in the admin drops it from the menu, so hubs built from this never link
 * to a page that 404s.
 */
export const childrenOf = async (slug: string) => (await findMenuItem(slug))?.children ?? [];
