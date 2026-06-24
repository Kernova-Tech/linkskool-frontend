import { toCamel } from '../../src/api/util/transform'

interface NewsListData {
  data?: { news?: Array<{ slug?: string }> }
  meta?: { hasNext?: boolean }
}

/**
 * Fetches every news article slug by walking the paginated news/list endpoint.
 * Used at build time to prerender each article and to build the sitemap.
 *
 * Mirrors what `client.ts` does (unwrap `.data`, then `toCamel`) so the rest of
 * the code keeps reading camelCase keys (`slug`, `hasNext`).
 */
export async function fetchAllNewsSlugs(baseUrl: string, apiKey?: string): Promise<string[]> {
  const slugs: string[] = []
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const limit = 100
  let page = 1

  // Hard cap as a safety net against an unexpected pagination loop.
  for (let guard = 0; guard < 50; guard++) {
    const response = await fetch(`${cleanBase}/news/list?page=${page}&limit=${limit}`, {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })

    if (!response.ok) {
      break
    }

    const raw = (await response.json()) as { data?: unknown }
    const payload = toCamel(raw?.data ?? raw) as NewsListData

    for (const item of payload?.data?.news ?? []) {
      if (item?.slug) {
        slugs.push(item.slug)
      }
    }

    if (!payload?.meta?.hasNext) {
      break
    }

    page++
  }

  return slugs
}
