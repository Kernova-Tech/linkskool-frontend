<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DOMPurify from 'dompurify'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import type { Faqs } from '@/api/models'
import { faqsService } from '@/api/services'
import { usePageMeta } from '@/composables/usePageMeta'

const faqs = ref<Faqs[]>([])
const isLoading = ref(false)
const loadError = ref('')
const expandedFaqIds = ref<number[]>([])

const sanitizeAnswerHtml = (answer: string) =>
  DOMPurify.sanitize(answer, {
    USE_PROFILES: { html: true },
  })

const displayedFaqs = computed(() =>
  faqs.value.map((faq, index) => ({
    ...faq,
    order: index + 1,
    answerHtml: sanitizeAnswerHtml(faq.answer),
  })),
)

usePageMeta({
  title: 'FAQs | Linkskool',
  description: 'Find answers to common questions about Linkskool programs, enrollment, payments, and learning experience.',
  keywords: 'linkskool faqs, enrollment questions, payment help, course support',
  url: 'https://linkskool.com/faqs',
  image: 'https://linkskool.com/assets/og-image.png',
  type: 'website',
})

const isExpanded = (faqId: number) => expandedFaqIds.value.includes(faqId)

const toggleFaq = (faqId: number) => {
  if (isExpanded(faqId)) {
    expandedFaqIds.value = expandedFaqIds.value.filter((id) => id !== faqId)
    return
  }
  expandedFaqIds.value = [...expandedFaqIds.value, faqId]
}

const fetchFaqs = async () => {
  isLoading.value = true
  loadError.value = ''
  faqs.value = []
  expandedFaqIds.value = []

  try {
    faqs.value = await faqsService.getFaqs()
  } catch (error) {
    console.error('Failed to load FAQs:', error)
    loadError.value = 'Unable to load FAQs right now. Please try again shortly.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchFaqs()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <section class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 pt-24 pb-14">
      <div class="pointer-events-none absolute -top-24 -left-12 h-72 w-72 rounded-full bg-blue-300/20 blur-2xl">
      </div>
      <div class="pointer-events-none absolute -bottom-20 -right-8 h-72 w-72 rounded-full bg-orange-300/20 blur-2xl">
      </div>

      <div class="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
          <i class="fa-solid fa-circle-question"></i>
          <span>Help Center</span>
        </div>

        <h1 class="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p class="mx-auto mt-4 max-w-3xl text-lg text-blue-100">
          Quick answers to common questions about our programs, payments, and enrollment process.
        </p>
      </div>
    </section>

    <section class="py-14">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div v-if="isLoading" class="space-y-4">
            <div v-for="i in 6" :key="i" class="rounded-2xl border border-gray-100 p-4">
              <div class="h-5 w-4/5 animate-pulse rounded bg-gray-200"></div>
              <div class="mt-3 h-4 w-full animate-pulse rounded bg-gray-100"></div>
              <div class="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-100"></div>
            </div>
          </div>

          <div v-else-if="loadError" class="rounded-2xl border border-red-100 bg-red-50 px-5 py-6 text-center">
            <i class="fa-solid fa-circle-exclamation text-2xl text-red-500"></i>
            <p class="mt-3 text-red-700">{{ loadError }}</p>
            <button type="button" @click="fetchFaqs"
              class="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-500">
              <i class="fa-solid fa-rotate-right"></i>
              <span>Try again</span>
            </button>
          </div>

          <div v-else-if="displayedFaqs.length > 0" class="space-y-3">
            <article v-for="faq in displayedFaqs" :key="faq.id"
              class="rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:border-blue-200">
              <button type="button" @click="toggleFaq(faq.id)"
                class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                :aria-expanded="isExpanded(faq.id)">
                <div class="flex items-start gap-3">
                  <span
                    class="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-bold text-blue-700">
                    {{ faq.order }}
                  </span>
                  <h2 class="text-base font-semibold text-gray-900 sm:text-lg">{{ faq.question }}</h2>
                </div>
                <i class="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  :class="isExpanded(faq.id) ? 'rotate-180 text-blue-600' : ''"></i>
              </button>

              <transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-96 opacity-100" leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="max-h-96 opacity-100" leave-to-class="max-h-0 opacity-0">
                <div v-if="isExpanded(faq.id)" class="overflow-hidden px-5 pb-5">
                  <div
                    class="border-l-2 border-blue-100 pl-4 text-gray-600 leading-relaxed [&_a]:font-semibold [&_a]:text-blue-700 [&_a:hover]:text-blue-600 [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-gray-900"
                    v-html="faq.answerHtml">
                  </div>
                </div>
              </transition>
            </article>
          </div>

          <div v-else class="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-8 text-center">
            <i class="fa-solid fa-comments text-3xl text-gray-400"></i>
            <p class="mt-3 text-gray-600">No FAQs are available yet. Please check back soon.</p>
          </div>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
