<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import NewsSection from '@/components/NewsSection.vue'
import { useNewsList } from '@/composables/useNewsList'
import { usePageMeta } from '@/composables/usePageMeta'

usePageMeta({
  title: 'News - LinkSkool Opportunities and Stories',
  description:
    'Read LinkSkool news, program announcements, opportunities, career insights, technology notes, and community stories in a masonry-style feed.',
  keywords: 'LinkSkool news, education news, opportunities, career insights, learning community',
  url: 'https://linkskool.com/news',
  image: 'https://linkskool.com/assets/og-image.png',
  type: 'website',
})

const {
  activeCategory,
  categories,
  filteredNewsItems,
  isInitialLoading,
  isLoadingMore,
  loadError,
  loadMoreTarget,
} = useNewsList()
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <AppHeader />
    <NewsSection
      :news-items="filteredNewsItems"
      :categories="categories"
      :active-category="activeCategory"
      :is-loading="isInitialLoading"
      :is-loading-more="isLoadingMore"
      @category-change="activeCategory = $event"
    />
    <div ref="loadMoreTarget" class="h-1"></div>
    <p v-if="loadError" class="px-4 pb-10 text-center text-sm font-semibold text-red-600">
      {{ loadError }}
    </p>
    <AppFooter />
  </div>
</template>
