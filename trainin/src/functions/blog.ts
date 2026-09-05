import { fetchData } from "./fetch"

export type BlogPost = {
    slug: string
    title: string
    excerpt: string | null
    cover_image: string | null
    published_at: string | null
}

export type BlogEntry = BlogPost & { body: string }

type BlogListResponse = {
    status: string
    data: BlogPost[]
    meta: { page: number; per_page: number; total: number; last_page: number }
}

/** Every published post, following the endpoint's pagination. */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
    const first: BlogListResponse | undefined = await fetchData("blog")
    if (!first?.data) return []

    const posts = [...first.data]
    const lastPage = first.meta?.last_page ?? 1

    for (let page = 2; page <= lastPage; page++) {
        const next: BlogListResponse | undefined = await fetchData(`blog?page=${page}`)
        if (next?.data?.length) posts.push(...next.data)
    }

    return posts
}

/** "2026-09-04" → "4 de septiembre de 2026" (UTC, so the day never shifts). */
export function formatPublishedAt(value: string | null | undefined) {
    if (!value) return null
    const date = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) return null
    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(date)
}
