import { computed, type Ref } from 'vue'

import { newsService } from '@/api/services'
import { mapApiNewsToCard, mapApiRelatedNewsToCard } from '@/utils/newsMapper'

export const useNewsDetail = (slug: Ref<string>) => {
  // useAsyncData runs on the server during SSR, so the article content and its
  // meta tags are present in the initial HTML for crawlers and social scrapers.
  const { data, pending, error } = useAsyncData(
    () => `news-detail-${slug.value}`,
    () => newsService.getNewsBySlug(slug.value),
    { watch: [slug] },
  )

  const article = computed(() => {
    if (!data.value) {
      return null
    }
    const category = data.value.news.categories?.[0]?.name
    return mapApiNewsToCard(data.value.news, 0, category)
  })

  const relatedNews = computed(
    () => data.value?.more.map((item, index) => mapApiRelatedNewsToCard(item, index)) ?? [],
  )

  const articleImages = computed(() => article.value?.images ?? [])

  const articleError = computed(() => (error.value ? 'Unable to load this story right now.' : ''))

  return {
    article,
    articleError,
    articleImages,
    isLoadingArticle: pending,
    relatedNews,
  }
}
