import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { ApiNewsItem, NewsListPayload } from '@/api/models/news'
import { newsService } from '@/api/services'
import type { NewsCategory } from '@/data/news'
import { mapApiNewsToCard } from '@/utils/newsMapper'

const newsLimit = 25

export const useNewsList = () => {
  const activeCategory = ref<NewsCategory | 'All'>('All')
  // Pages 2+ are fetched client-side on scroll and appended here.
  const extraPages = ref<NewsListPayload[]>([])
  const loadError = ref('')
  const isLoadingMore = ref(false)
  const loadMoreTarget = ref<HTMLElement | null>(null)

  let observer: IntersectionObserver | null = null
  let abortController: AbortController | null = null

  // Server-render the first page so the feed is indexable and present in the
  // initial HTML. useAsyncData resolves before render on the server; the list
  // is derived with computed() so it is populated during SSR (watchers do not
  // run on the server).
  const {
    data: initialData,
    pending: isInitialLoading,
    error: initialError,
  } = useAsyncData('news-list-page-1', () => newsService.getAllNews({ page: 1, limit: newsLimit }))

  const categoryIds = computed(() => initialData.value?.data.categories ?? {})

  const categories = computed(() =>
    Object.keys(categoryIds.value).filter((category) => category.toLowerCase() !== 'all'),
  )

  const findCategoryForNews = (item: ApiNewsItem) =>
    Object.entries(categoryIds.value).find(
      ([category, ids]) => category.toLowerCase() !== 'all' && ids.includes(item.id),
    )?.[0]

  const apiItems = computed<ApiNewsItem[]>(() =>
    [initialData.value, ...extraPages.value]
      .filter((page): page is NewsListPayload => Boolean(page))
      .flatMap((page) => page.data.news),
  )

  const newsItems = computed(() =>
    apiItems.value.map((item, index) => mapApiNewsToCard(item, index, findCategoryForNews(item))),
  )

  const filteredNewsItems = computed(() => {
    if (activeCategory.value === 'All') {
      return newsItems.value
    }

    const allowedIds = new Set(categoryIds.value[activeCategory.value] ?? [])
    return newsItems.value.filter((item) => allowedIds.has(item.id))
  })

  const latestMeta = computed(
    () => extraPages.value.at(-1)?.meta ?? initialData.value?.meta ?? null,
  )

  const displayError = computed(() =>
    initialError.value ? 'Unable to load news right now.' : loadError.value,
  )

  const loadMoreNews = async () => {
    const meta = latestMeta.value
    if (isInitialLoading.value || isLoadingMore.value || !meta?.hasNext) {
      return
    }

    isLoadingMore.value = true
    loadError.value = ''
    abortController?.abort()
    abortController = new AbortController()

    try {
      const payload = await newsService.getAllNews({
        page: meta.currentPage + 1,
        limit: newsLimit,
        signal: abortController.signal,
      })

      extraPages.value = [...extraPages.value, payload]
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
    loadError: displayError,
    loadMoreTarget,
  }
}
