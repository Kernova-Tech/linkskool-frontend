import { fetchAllNewsSlugs } from '../utils/fetchNewsSlugs'

const SITE = 'https://linkskool.com'

const staticRoutes = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/about', changefreq: 'monthly', priority: '0.8' },
  { loc: '/news', changefreq: 'daily', priority: '0.9' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  { loc: '/faqs', changefreq: 'monthly', priority: '0.6' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms-of-use', changefreq: 'yearly', priority: '0.3' },
]

export default defineEventHandler(async (event) => {
  const baseUrl = process.env.VITE_API_BASE_URL || 'https://linkskool.com/api/v4/public'
  const apiKey = process.env.VITE_API_KEY

  let newsSlugs: string[] = []
  try {
    newsSlugs = await fetchAllNewsSlugs(baseUrl, apiKey)
  } catch {
    // If the API is unreachable at build time, still emit the static routes.
  }

  const lastmod = new Date().toISOString().slice(0, 10)

  const urls = [
    ...staticRoutes,
    ...newsSlugs.map((slug) => ({
      loc: `/news/${slug}`,
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ]

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
      )
      .join('\n') +
    `\n</urlset>\n`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})
