import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { ApiNewsItem, NewsListPayload } from '@/api/models/news'
import { newsService } from '@/api/services'
import type { NewsCard, NewsCategory } from '@/data/news'
import { mapApiNewsToCard } from '@/utils/newsMapper'

const newsLimit = 25

export const useNewsList = () => {
  const activeCategory = ref<NewsCategory | 'All'>('All')
  const newsItems = ref<NewsCard[]>([])
  const categories = ref<NewsCategory[]>([])
  const categoryIds = ref<Record<string, number[]>>({})
  const loadError = ref('')
  const isLoadingMore = ref(false)
  const loadMoreTarget = ref<HTMLElement | null>(null)

  let observer: IntersectionObserver | null = null
  let abortController: AbortController | null = null

  const filteredNewsItems = computed(() => {
    if (activeCategory.value === 'All') {
      return newsItems.value
    }

    const ids = categoryIds.value[activeCategory.value] ?? []
    const allowedIds = new Set(ids)
    return newsItems.value.filter((item) => allowedIds.has(item.id))
  })

  const findCategoryForNews = (item: ApiNewsItem) =>
    Object.entries(categoryIds.value).find(
      ([category, ids]) => category.toLowerCase() !== 'all' && ids.includes(item.id),
    )?.[0]

  const applyPayload = (payload: NewsListPayload, isFirstPage: boolean) => {
    categoryIds.value = payload.data.categories
    categories.value = Object.keys(payload.data.categories).filter(
      (category) => category.toLowerCase() !== 'all',
    )

    const offset = isFirstPage ? 0 : newsItems.value.length
    const mappedNews = payload.data.news.map((item, index) =>
      mapApiNewsToCard(item, offset + index, findCategoryForNews(item)),
    )

    newsItems.value = isFirstPage ? mappedNews : [...newsItems.value, ...mappedNews]
  }

  // Server-render the first page so the feed is indexable and present in the
  // initial HTML; subsequent pages are loaded client-side on scroll.
  const {
    data: initialData,
    pending: isInitialLoading,
    error: initialError,
  } = useAsyncData('news-list-page-1', () => newsService.getAllNews({ page: 1, limit: newsLimit }))

  const meta = ref(initialData.value?.meta ?? null)

  watch(
    initialData,
    (payload) => {
      if (payload) {
        meta.value = payload.meta
        applyPayload(payload, true)
      }
    },
    { immediate: true },
  )

  watch(
    initialError,
    (error) => {
      loadError.value = error ? 'Unable to load news right now.' : ''
    },
    { immediate: true },
  )

  const loadMoreNews = async () => {
    if (isInitialLoading.value || isLoadingMore.value || !meta.value?.hasNext) {
      return
    }

    isLoadingMore.value = true
    loadError.value = ''
    abortController?.abort()
    abortController = new AbortController()

    try {
      const payload = await newsService.getAllNews({
        page: meta.value.currentPage + 1,
        limit: newsLimit,
        signal: abortController.signal,
      })

      meta.value = payload.meta
      applyPayload(payload, false)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      console.error('Failed to fetch news:', error)
      loadError.value = 'Unable to load news right now.'
    } finally {
      isLoadingMore.value = false
    }
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreNews()
        }
      },
      { rootMargin: '320px' },
    )

    if (loadMoreTarget.value) {
      observer.observe(loadMoreTarget.value)
    }
  })

  onBeforeUnmount(() => {
    abortController?.abort()
    observer?.disconnect()
  })

  return {
    activeCategory,
    categories,
    filteredNewsItems,
    isInitialLoading,
    isLoadingMore,
    loadError,
    loadMoreTarget,
  }
}
