<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AdSenseSlot from '@/components/AdSenseSlot.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import NewsImageCarousel from '@/components/NewsImageCarousel.vue'
import NewsList from '@/components/NewsList.vue'
import { adsenseConfig } from '@/config/adsense'
import { useNewsDetail } from '@/composables/useNewsDetail'
import { usePageMeta } from '@/composables/usePageMeta'

const route = useRoute()

const slug = computed(() => {
  const rawSlug = route.params.slug
  return Array.isArray(rawSlug) ? (rawSlug[0] ?? '') : (rawSlug ?? '')
})

const { article, articleError, articleImages, isLoadingArticle, relatedNews } = useNewsDetail(slug)

usePageMeta(() => ({
  title: article.value ? `${article.value.title} - LinkSkool News` : 'News story - LinkSkool',
  description: article.value?.summary ?? 'Read LinkSkool news, opportunities, and stories.',
  keywords: 'LinkSkool news, education news, opportunities, career insights, learning community',
  url: article.value ? `https://linkskool.com/news/${article.value.slug}` : 'https://linkskool.com/news',
  image: article.value?.imageUrl ?? 'https://linkskool.com/assets/og-image.png',
  type: 'article',
}))

// NewsArticle structured data so search engines can render rich news results.
useHead(() => ({
  script: article.value
    ? [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.value.title,
            description: article.value.summary,
            image: article.value.imageUrl ? [article.value.imageUrl] : undefined,
            articleSection: article.value.category,
            author: { '@type': 'Organization', name: article.value.source || 'Linkskool' },
            publisher: {
              '@type': 'Organization',
              name: 'Linkskool',
              logo: { '@type': 'ImageObject', url: 'https://linkskool.com/assets/og-image.png' },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://linkskool.com/news/${article.value.slug}`,
            },
          }),
        },
      ]
    : [],
}))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="pt-24">
      <section v-if="isLoadingArticle" class="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <div class="mb-8 h-5 w-32 animate-pulse rounded bg-gray-200"></div>
        <div class="space-y-5">
          <div class="h-6 w-24 animate-pulse rounded-md bg-gray-200"></div>
          <div class="h-12 w-full animate-pulse rounded bg-gray-200"></div>
          <div class="h-12 w-4/5 animate-pulse rounded bg-gray-200"></div>
          <div class="h-6 w-2/3 animate-pulse rounded bg-gray-100"></div>
          <div class="h-[24rem] animate-pulse rounded-md bg-gray-200"></div>
        </div>
      </section>

      <section v-else-if="article" class="pb-16">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <RouterLink
            to="/news"
            class="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            <i class="fa-solid fa-arrow-left text-xs"></i>
            Back to News
          </RouterLink>

          <article>
            <div class="space-y-5">
              <div
                class="inline-flex rounded-md bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
              >
                {{ article.category }}
              </div>
              <h1 class="text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                {{ article.title }}
              </h1>
              <p class="text-lg leading-8 text-slate-600">
                {{ article.summary }}
              </p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-500">
                <span>{{ article.source }}</span>
                <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                <span>{{ article.publishedAt }}</span>
                <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                <span>{{ article.readTime }}</span>
              </div>
            </div>

            <AdSenseSlot class="mt-8" :slot="adsenseConfig.slots.newsDetailHero" />
            <NewsImageCarousel :images="articleImages" />
            <AdSenseSlot class="mt-8" :slot="adsenseConfig.slots.newsDetailTop" />

            <div
              v-if="article.contentHtml"
              class="news-content mt-8 border-t border-gray-200 pt-8 text-base leading-8 text-slate-700"
              v-html="article.contentHtml"
            ></div>
            <div v-else class="mt-8 space-y-5 border-t border-gray-200 pt-8">
              <p v-for="paragraph in article.body" :key="paragraph" class="text-base leading-8 text-slate-700">
                {{ paragraph }}
              </p>
            </div>

            <AdSenseSlot class="mt-10" :slot="adsenseConfig.slots.newsDetail" />
          </article>
        </div>
      </section>

      <section v-else class="mx-auto max-w-3xl px-4 pb-16 pt-10 text-center sm:px-6 lg:px-8">
        <h1 class="text-3xl font-black text-slate-950">News story not found</h1>
        <p class="mt-3 text-slate-600">{{ articleError || 'The story may have moved or no longer exists.' }}</p>
        <RouterLink
          to="/news"
          class="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View all news
        </RouterLink>
      </section>

      <section v-if="relatedNews.length > 0" class="bg-gray-50 pb-20">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 class="mb-6 text-2xl font-black text-slate-950">More for you</h2>
          <NewsList :news-items="relatedNews" />
          <AdSenseSlot class="mt-10" :slot="adsenseConfig.slots.newsDetailBottom" />
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.news-content :deep(p) {
  margin-bottom: 1.25rem;
}

.news-content :deep(a) {
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.news-content :deep(ul),
.news-content :deep(ol) {
  margin: 1rem 0 1.25rem 1.25rem;
}

.news-content :deep(ul) {
  list-style: disc;
}

.news-content :deep(ol) {
  list-style: decimal;
}

.news-content :deep(strong),
.news-content :deep(b) {
  color: #0f172a;
  font-weight: 800;
}
</style>
