<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AdSenseSlot from '@/components/AdSenseSlot.vue'
import { adsenseConfig } from '@/config/adsense'
import type { NewsCard, NewsCategory } from '@/data/news'

defineProps<{
  newsItems: NewsCard[]
  categories: NewsCategory[]
  activeCategory: NewsCategory | 'All'
  isLoading?: boolean
  isLoadingMore?: boolean
}>()

const emit = defineEmits<{
  categoryChange: [category: NewsCategory | 'All']
}>()

const cardClassBySize: Record<NewsCard['size'], string> = {
  feature: 'news-card-feature',
  horizontal: 'news-card-horizontal',
  square: 'news-card-square',
}

const accentClassByColor: Record<NewsCard['accent'], string> = {
  blue: 'from-blue-600 to-cyan-500',
  orange: 'from-orange-500 to-amber-400',
  green: 'from-emerald-500 to-teal-400',
  violet: 'from-violet-600 to-fuchsia-500',
  rose: 'from-rose-500 to-orange-400',
}

const shouldShowInlineAd = (index: number) => (index + 1) % 10 === 0
</script>

<template>
  <section class="relative overflow-hidden bg-gray-50 pt-28 pb-20 text-slate-950">
    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header class="mb-8 max-w-3xl">
        <h1 class="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
          News, opportunities, and stories from LinkSkool
        </h1>
        <p class="mt-3 text-base leading-7 text-slate-600">
          Announcements, career insights, technology notes, and community updates from across the
          LinkSkool network.
        </p>
      </header>

      <AdSenseSlot :slot="adsenseConfig.slots.newsTop" />

      <div class="mt-8 flex flex-wrap justify-center gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          class="rounded-md border px-4 py-2 text-sm font-semibold transition cursor-pointer"
          :class="
            activeCategory === 'All'
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
          "
          @click="emit('categoryChange', 'All')"
        >
          All
        </button>
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="rounded-md border px-4 py-2 text-sm font-semibold transition cursor-pointer"
          :class="
            activeCategory === category
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
          "
          @click="emit('categoryChange', category)"
        >
          {{ category }}
        </button>
      </div>

      <div v-if="isLoading" class="news-grid mt-14">
        <div
          v-for="item in 10"
          :key="`news-skeleton-${item}`"
          class="news-card overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
          :class="item === 1 || item === 10 ? 'news-card-horizontal' : 'news-card-square'"
        >
          <div class="h-[52%] animate-pulse bg-gray-200"></div>
          <div class="space-y-3 p-4">
            <div class="h-4 w-4/5 animate-pulse rounded bg-gray-200"></div>
            <div class="h-4 w-3/5 animate-pulse rounded bg-gray-200"></div>
            <div class="h-3 w-full animate-pulse rounded bg-gray-100"></div>
            <div class="h-3 w-2/3 animate-pulse rounded bg-gray-100"></div>
          </div>
        </div>
      </div>

      <div v-else class="news-grid mt-14">
        <template v-for="(item, index) in newsItems" :key="item.id">
          <RouterLink
            :to="`/news/${item.slug}`"
            class="news-card group relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
            :class="cardClassBySize[item.size]"
          >
            <template v-if="item.size === 'square'">
              <div class="relative h-[52%] overflow-hidden">
                <img
                  :src="item.imageUrl"
                  :alt="item.imageAlt"
                  class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  class="absolute left-3 top-3 rounded-md bg-gradient-to-r px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                  :class="accentClassByColor[item.accent]"
                >
                  {{ item.category }}
                </div>
                <div
                  v-if="(item.images?.length ?? 0) > 1"
                  class="absolute right-3 top-3 rounded-md bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white"
                >
                  +{{ (item.images?.length ?? 1) - 1 }}
                </div>
              </div>

              <div class="flex h-[48%] flex-col justify-between bg-white p-4">
                <div class="space-y-2">
                  <h2 class="line-clamp-2 text-base font-black leading-tight text-slate-950">
                    {{ item.title }}
                  </h2>
                  <p class="line-clamp-2 text-xs leading-5 text-slate-600">
                    {{ item.summary }}
                  </p>
                </div>
                <span
                  class="mt-2 inline-flex items-center gap-2 self-start text-xs font-bold text-blue-700 transition hover:text-blue-900 cursor-pointer"
                >
                  Read story
                  <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
              </div>
            </template>

            <template v-else>
              <img
                :src="item.imageUrl"
                :alt="item.imageAlt"
                class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent"></div>
              <div
                class="absolute left-4 top-4 rounded-md bg-gradient-to-r px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                :class="accentClassByColor[item.accent]"
              >
                {{ item.category }}
              </div>
              <div
                v-if="(item.images?.length ?? 0) > 1"
                class="absolute right-4 top-4 rounded-md bg-slate-950/80 px-3 py-1 text-xs font-bold text-white"
              >
                +{{ (item.images?.length ?? 1) - 1 }}
              </div>

              <div class="absolute inset-x-0 bottom-0 space-y-3 p-4 sm:p-5">
                <h2
                  class="line-clamp-3 text-xl font-black leading-tight text-white"
                  :class="{ 'sm:text-4xl': item.size === 'feature', 'sm:text-2xl': item.size === 'horizontal' }"
                >
                  {{ item.title }}
                </h2>

                <span
                  class="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-blue-100 cursor-pointer"
                >
                  Read story
                  <i class="fa-solid fa-arrow-right text-xs"></i>
                </span>
              </div>
            </template>
          </RouterLink>

          <AdSenseSlot
            v-if="shouldShowInlineAd(index)"
            :slot="adsenseConfig.slots.newsInline"
            class="news-ad-card"
          />
        </template>

        <AdSenseSlot
          v-if="newsItems.length > 0"
          :slot="adsenseConfig.slots.newsBottom"
          class="news-ad-card"
        />
      </div>

      <div v-if="isLoadingMore" class="news-grid mt-4">
        <div
          v-for="item in 4"
          :key="`news-more-skeleton-${item}`"
          class="news-card news-card-square overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
        >
          <div class="h-[52%] animate-pulse bg-gray-200"></div>
          <div class="space-y-3 p-4">
            <div class="h-4 w-4/5 animate-pulse rounded bg-gray-200"></div>
            <div class="h-3 w-full animate-pulse rounded bg-gray-100"></div>
            <div class="h-3 w-2/3 animate-pulse rounded bg-gray-100"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.news-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.news-card {
  min-height: 22rem;
}

.news-ad-card {
  min-height: 8rem;
}

.news-grid-glow {
  filter: blur(72px);
}

@media (min-width: 768px) {
  .news-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: minmax(17rem, auto);
  }

  .news-card {
    min-height: auto;
  }

  .news-card-square {
    aspect-ratio: 1 / 1;
  }

  .news-card-horizontal,
  .news-card-feature {
    grid-column: span 2;
    aspect-ratio: 2 / 1;
  }

  .news-ad-card {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1180px) {
  .news-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-flow: dense;
    grid-auto-rows: 19rem;
  }

  .news-card-feature {
    grid-column: span 2;
    grid-row: span 2;
    aspect-ratio: auto;
  }

  .news-card-horizontal {
    grid-column: span 2;
    aspect-ratio: auto;
  }

  .news-card-square {
    grid-column: span 1;
    aspect-ratio: auto;
  }
}
</style>
