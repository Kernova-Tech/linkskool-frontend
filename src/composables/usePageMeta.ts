interface PageMetaOptions {
    title: string
    description?: string
    keywords?: string
    image?: string
    url?: string
    type?: string
}

/**
 * Composable to set page meta tags for SEO and social media sharing.
 *
 * Backed by Nuxt's `useHead`/`useSeoMeta`, so the tags are rendered into the
 * server-side HTML. This is what allows crawlers and social scrapers
 * (Google, WhatsApp, Facebook, X, LinkedIn) — which do not execute JavaScript
 * — to read the correct per-page title, description, and Open Graph image.
 *
 * Accepts a static object or a getter for reactive (data-driven) pages.
 */
export function usePageMeta(options: PageMetaOptions | (() => PageMetaOptions)) {
    const get = () => (typeof options === 'function' ? options() : options)

    useHead({
        title: () => get().title,
        link: () => {
            const url = get().url
            return url ? [{ rel: 'canonical', href: url }] : []
        },
    })

    useSeoMeta({
        title: () => get().title,
        description: () => get().description,
        keywords: () => get().keywords,
        ogTitle: () => get().title,
        ogDescription: () => get().description,
        ogUrl: () => get().url,
        ogImage: () => get().image,
        ogType: () => (get().type as 'website' | 'article') || 'website',
        twitterCard: 'summary_large_image',
        twitterTitle: () => get().title,
        twitterDescription: () => get().description,
        twitterImage: () => get().image,
    })
}
