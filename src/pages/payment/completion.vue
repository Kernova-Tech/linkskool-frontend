<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import ProgramCard from '@/components/ProgramCard.vue'
import type { Program } from '@/api/models'
import { enrollmentService, programService } from '@/api/services'
import { usePageMeta } from '@/composables/usePageMeta'
import { clearPendingPayment } from '@/utils/pendingPayment'
import logoSrc from '@/assets/logo.png'

interface StepSegment {
  kind: 'text' | 'link'
  content: string
  href?: string
}

const route = useRoute()

const normalizeQueryKey = (key: string) => key.trim().replace(/^amp;/i, '').toLowerCase()

const getQueryParam = (...keys: string[]) => {
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()))

  for (const key of keys) {
    const raw = route.query[key]
    if (Array.isArray(raw)) {
      return raw[0] ?? ''
    }
    if (typeof raw === 'string') {
      return raw
    }
  }

  for (const [queryKey, rawValue] of Object.entries(route.query)) {
    if (!normalizedKeys.has(normalizeQueryKey(queryKey))) continue

    if (Array.isArray(rawValue)) {
      return rawValue[0] ?? ''
    }
    if (typeof rawValue === 'string') {
      return rawValue
    }
  }

  return ''
}

const programs = ref<Program[]>([])
const isLoadingPrograms = ref(false)
const isVerifyingPayment = ref(false)
const verificationError = ref('')
const showVideoModal = ref(false)
const androidAppUrl = (import.meta.env.VITE_LINKSKOOL_ANDROID_APP_URL as string | undefined)?.trim() ?? ''
const iosAppUrl = (import.meta.env.VITE_LINKSKOOL_IOS_APP_URL as string | undefined)?.trim() ?? ''
const desktopAppUrl = (import.meta.env.VITE_LINKSKOOL_DESKTOP_APP_URL as string | undefined)?.trim() ?? ''
const verificationState = ref<'idle' | 'loading' | 'success' | 'failed' | 'missing' | 'error'>('idle')

const callbackStatus = computed(() => {
  return getQueryParam('status').toLowerCase()
})

const paymentReference = computed(() => {
  return getQueryParam('reference', 'trxref')
})

const hasPaymentCallbackContext = computed(() => {
  if (paymentReference.value.trim()) return true
  if (callbackStatus.value.trim()) return true
  return Object.keys(route.query).length > 0
})

const callbackProgramSlug = computed(() => {
  return getQueryParam('program').trim()
})

const callbackWhatsappGroupLink = computed(() => {
  return getQueryParam('whatsapp').trim()
})

const selectedProgram = computed(() => {
  const slug = callbackProgramSlug.value.toLowerCase()
  if (!slug) return null
  return programs.value.find((program) => program.slug.toLowerCase() === slug) ?? null
})

const hasAndroidAppUrl = computed(() => Boolean(androidAppUrl))
const hasDesktopAppUrl = computed(() => Boolean(desktopAppUrl))

const normalizeUrl = (rawUrl: string) => {
  const cleaned = rawUrl.trim()
  if (!cleaned) return ''
  if (/^https?:\/\//i.test(cleaned)) return cleaned
  return `https://${cleaned}`
}

const parseStepSegments = (value: string): StepSegment[] => {
  const text = value.trim()
  if (!text) return []

  const linkRegex = /(https?:\/\/[^\s<>")]+|www\.[^\s<>")]+)/gi
  const segments: StepSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    const [url] = match
    const start = match.index

    if (start > lastIndex) {
      segments.push({
        kind: 'text',
        content: text.slice(lastIndex, start),
      })
    }

    segments.push({
      kind: 'link',
      content: url,
      href: normalizeUrl(url),
    })

    lastIndex = start + url.length
  }

  if (lastIndex < text.length) {
    segments.push({
      kind: 'text',
      content: text.slice(lastIndex),
    })
  }

  return segments.length > 0 ? segments : [{ kind: 'text', content: text }]
}

const toEmbeddableVideoUrl = (rawUrl: string | null | undefined) => {
  const value = rawUrl?.trim()
  if (!value) return null

  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.toString()
      }

      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    return value
  } catch {
    return null
  }
}

const additionalOnboardingSteps = computed(() => {
  const onboardingSteps = selectedProgram.value?.onboardingSteps
  if (!onboardingSteps) return []

  return onboardingSteps
    .map((step) => step.trim())
    .filter(Boolean)
})

const parsedAdditionalOnboardingSteps = computed(() =>
  additionalOnboardingSteps.value.map((step) => ({
    text: step,
    segments: parseStepSegments(step),
  })),
)

const whatsappJoinLink = computed(() => callbackWhatsappGroupLink.value)
const hasWhatsappStep = computed(() => Boolean(whatsappJoinLink.value))
const programVideoEmbedUrl = computed(() => toEmbeddableVideoUrl(selectedProgram.value?.videoUrl ?? null))
const hasVideoStep = computed(() => Boolean(selectedProgram.value?.videoUrl && programVideoEmbedUrl.value))
const videoStepNumber = computed(() => (hasWhatsappStep.value ? 3 : 2))
const remainingStepsStartNumber = computed(() => videoStepNumber.value + (hasVideoStep.value ? 1 : 0))
const programVideoPreviewUrl = computed(() => {
  const embed = programVideoEmbedUrl.value
  if (!embed) return null
  const match = embed.match(/\/embed\/([^/?]+)/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
})
const faqStepNumber = computed(() => remainingStepsStartNumber.value + parsedAdditionalOnboardingSteps.value.length)

//const isSuccessful = computed(() => verificationState.value === 'success')

const statusBadgeLabel = computed(() => {
  if (verificationState.value === 'loading') {
    return 'Verifying Payment'
  }
  if (verificationState.value === 'success') {
    return 'Payment Received'
  }
  if (verificationState.value === 'failed') {
    return 'Payment Not Completed'
  }
  if (verificationState.value === 'missing') {
    return 'Reference Missing'
  }
  return 'Verification Needed'
})

const heroTitle = computed(() => {
  if (verificationState.value === 'loading') {
    return 'Verifying your payment'
  }
  if (verificationState.value === 'success') {
    return 'Thank you for your payment'
  }
  if (verificationState.value === 'failed') {
    return 'Payment was not completed'
  }
  if (verificationState.value === 'missing') {
    return 'Payment reference missing'
  }
  return 'We could not verify this payment yet'
})

const heroBody = computed(() => {
  if (verificationState.value === 'loading') {
    return 'Please wait while we confirm your transaction with the server.'
  }
  if (verificationState.value === 'success') {
    if (selectedProgram.value?.name) {
      return `Your payment was successful for ${selectedProgram.value.name}. Follow the onboarding steps below to get started immediately.`
    }
    return 'Your payment was successful. Follow the onboarding steps below to get started immediately.'
  }
  if (verificationState.value === 'failed') {
    return 'This transaction was not confirmed as successful. You can return to enrollment and restart payment if needed.'
  }
  if (verificationState.value === 'missing') {
    return 'The callback did not include a payment reference, so we could not verify this transaction.'
  }
  return verificationError.value || 'We could not confirm this payment right now. Please try again shortly or contact support with your reference.'
})

const ctaLabel = computed(() => {
  if (verificationState.value === 'success') {
    return 'Explore more programs'
  }
  if (verificationState.value === 'failed') {
    return 'Try enrollment again'
  }
  return 'Browse programs'
})

const featuredPrograms = computed(() => programs.value.slice(0, 6))

const openVideoModal = () => {
  if (!programVideoEmbedUrl.value) return
  showVideoModal.value = true
}

const closeVideoModal = () => {
  showVideoModal.value = false
}

usePageMeta(() => ({
  title: verificationState.value === 'success'
    ? 'Payment Complete | Linkskool'
    : verificationState.value === 'loading'
      ? 'Verifying Payment | Linkskool'
      : 'Payment Verification | Linkskool',
  description: verificationState.value === 'success'
    ? 'Your Linkskool payment was successful. Discover more programs and continue your learning journey.'
    : 'Verify your Linkskool payment status and continue your enrollment flow.',
  keywords: 'payment completion, paystack callback, program enrollment, linkskool',
  url: 'https://linkskool.com/payment/completion',
  image: 'https://linkskool.com/assets/og-image.png',
  type: 'website',
}))

const verifyPayment = async () => {
  const reference = paymentReference.value.trim()

  verificationError.value = ''

  if (!reference) {
    if (callbackStatus.value === 'success' || callbackStatus.value === 'failed' || callbackStatus.value === 'abandoned') {
      clearPendingPayment()
    }
    verificationState.value = 'missing'
    return
  }

  verificationState.value = 'loading'
  isVerifyingPayment.value = true

  try {
    const isPaid = await enrollmentService.paymentStatus(reference)
    verificationState.value = isPaid ? 'success' : 'failed'
    clearPendingPayment()
  } catch (error) {
    console.error('Failed to verify payment status:', error)
    if (callbackStatus.value === 'success') {
      clearPendingPayment()
    }
    verificationState.value = 'error'
    verificationError.value = 'Payment verification failed. Please try again shortly.'
  } finally {
    isVerifyingPayment.value = false
  }
}

onMounted(async () => {
  if (hasPaymentCallbackContext.value) {
    // Once the provider redirects back here, clear any stale checkout lock.
    clearPendingPayment()
  }

  isLoadingPrograms.value = true
  try {
    const response = await programService.getAllPrograms()
    programs.value = response
  } catch (error) {
    console.error('Failed to fetch programs for payment completion page:', error)
  } finally {
    isLoadingPrograms.value = false
  }
})

watch(paymentReference, () => {
  verifyPayment()
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <section class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 pt-24 pb-16">
      <div class="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-300/20 blur-2xl"></div>
      <div class="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-orange-300/20 blur-2xl">
      </div>

      <div class="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ statusBadgeLabel }}</span>
        </div>

        <h1 class="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
          {{ heroTitle }}
        </h1>

        <p class="mt-5 max-w-3xl text-lg leading-relaxed text-blue-100">
          {{ heroBody }}
        </p>

        <div v-if="isVerifyingPayment"
          class="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm text-white">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>Confirming transaction status...</span>
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-4">
          <a v-if="verificationState === 'success'" href="#next-steps"
            class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl">
            <span>Start onboarding steps</span>
            <i class="fa-solid fa-arrow-down"></i>
          </a>

          <RouterLink v-else to="/#programs"
            class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl">
            <span>{{ ctaLabel }}</span>
            <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>

        <div v-if="paymentReference"
          class="mt-8 inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm text-blue-100">
          <span class="font-semibold">Reference:</span>
          <span class="font-mono">{{ paymentReference }}</span>
        </div>
      </div>
    </section>

    <section id="next-steps" v-if="verificationState === 'success'" class="py-16 bg-white">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10">
          <h2 class="text-3xl font-black text-gray-900 md:text-4xl">What to do next</h2>
          <p class="mt-2 text-gray-600">Complete these onboarding steps to begin learning smoothly.</p>
        </div>

        <div class="space-y-5">
          <article class="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 md:p-6">
            <div class="flex items-start gap-4">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                1
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900">Download the LinkSkool app</h3>
                <p class="mt-1 text-gray-600">Install on Android or Desktop. iOS will be available soon.</p>

                <div class="mt-4 flex flex-wrap gap-3">
                  <a v-if="hasAndroidAppUrl" :href="androidAppUrl" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-700">
                    <i class="fa-brands fa-google-play"></i>
                    <span>Android (Play Store)</span>
                  </a>
                  <button v-else type="button" disabled
                    class="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-5 py-3 font-semibold text-gray-500"
                    aria-disabled="true">
                    <i class="fa-brands fa-google-play"></i>
                    <span>Android (Unavailable)</span>
                  </button>

                  <a v-if="hasDesktopAppUrl" :href="desktopAppUrl" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:border-blue-300 hover:text-blue-700">
                    <img :src="logoSrc" alt="LinkSkool" class="h-5 w-5 object-contain" />
                    <span>Desktop App</span>
                  </a>
                  <button v-else type="button" disabled
                    class="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-5 py-3 font-semibold text-gray-500"
                    aria-disabled="true">
                    <img :src="logoSrc" alt="LinkSkool" class="h-5 w-5 object-contain opacity-50" />
                    <span>Desktop (Unavailable)</span>
                  </button>

                  <button type="button" disabled
                    class="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-5 py-3 font-semibold text-gray-500"
                    :title="iosAppUrl ? 'iOS app coming soon' : 'iOS app not available yet'" aria-disabled="true">
                    <i class="fa-brands fa-apple"></i>
                    <span>iOS (Coming soon)</span>
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article v-if="hasWhatsappStep" class="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 md:p-6">
            <div class="flex items-start gap-4">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                2
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900">Join the WhatsApp group</h3>
                <p class="mt-1 text-gray-600">Receive onboarding updates, class reminders, and direct support.</p>
                <a :href="whatsappJoinLink" target="_blank" rel="noopener noreferrer"
                  class="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-600">
                  <i class="fa-brands fa-whatsapp"></i>
                  <span>Join WhatsApp Group</span>
                </a>
              </div>
            </div>
          </article>

          <article v-if="hasVideoStep" class="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/60">
            <div class="flex min-h-[200px] flex-col md:flex-row">
              <div class="flex flex-1 flex-col justify-between gap-4 p-5 md:p-6">
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                    {{ videoStepNumber }}
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">Watch onboarding video</h3>
                    <p class="mt-1 text-gray-600">Get a quick walkthrough before your first class.</p>
                  </div>
                </div>
                <button type="button" @click="openVideoModal"
                  class="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-700">
                  <i class="fa-solid fa-circle-play"></i>
                  <span>Watch onboarding video</span>
                </button>
              </div>
              <button type="button" @click="openVideoModal" class="group relative shrink-0 md:w-80">
                <img v-if="programVideoPreviewUrl" :src="programVideoPreviewUrl" alt="Video preview"
                  class="h-full w-full object-cover" />
                <div v-else
                  class="flex h-full min-h-[160px] w-full items-center justify-center bg-orange-100 text-orange-300">
                  <i class="fa-solid fa-circle-play text-5xl"></i>
                </div>
                <div class="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <i class="fa-solid fa-circle-play text-5xl text-white drop-shadow"></i>
                </div>
              </button>
            </div>
          </article>

          <article v-for="(step, index) in parsedAdditionalOnboardingSteps" :key="`${index}-${step.text}`"
            class="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div class="flex items-start gap-4">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                {{ remainingStepsStartNumber + index }}
              </div>
              <div class="flex-1 pt-1 text-gray-700 leading-relaxed">
                <template v-for="(segment, segmentIndex) in step.segments" :key="`${segment.kind}-${segmentIndex}`">
                  <a v-if="segment.kind === 'link' && segment.href" :href="segment.href" target="_blank"
                    rel="noopener noreferrer" class="font-semibold text-blue-700 underline decoration-blue-300">
                    {{ segment.content }}
                  </a>
                  <span v-else>{{ segment.content }}</span>
                </template>
              </div>
            </div>
          </article>

          <article class="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 md:p-6">
            <div class="flex items-start gap-4">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                {{ faqStepNumber }}
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900">Need more guidance?</h3>
                <p class="mt-1 text-gray-600">Check the FAQs for additional help and common answers.</p>
                <RouterLink to="/faqs"
                  class="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3 font-semibold text-violet-700 transition-colors hover:bg-violet-100">
                  <i class="fa-solid fa-circle-question"></i>
                  <span>Check FAQs</span>
                </RouterLink>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-else class="py-12 bg-white border-b border-gray-100">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-3">
          <a v-if="hasWhatsappStep" :href="whatsappJoinLink" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-600">
            <i class="fa-brands fa-whatsapp"></i>
            <span>Join WhatsApp Group</span>
          </a>
          <RouterLink to="/faqs"
            class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700">
            <i class="fa-solid fa-circle-question"></i>
            <span>Check FAQs</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 class="text-3xl font-black text-gray-900 md:text-4xl">Keep your learning streak alive</h2>
            <p class="mt-2 max-w-2xl text-gray-600">Here are additional programs you can enroll in right away.</p>
          </div>
          <RouterLink to="/#programs"
            class="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700">
            <span>View all programs</span>
            <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>

        <div v-if="isLoadingPrograms" class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="h-96 animate-pulse rounded-2xl bg-gray-200"></div>
        </div>

        <div v-else-if="featuredPrograms.length > 0" class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ProgramCard v-for="program in featuredPrograms" :key="program.id" :program="program" />
        </div>

        <div v-else class="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <i class="fa-solid fa-book-open-reader text-4xl text-gray-400"></i>
          <p class="mt-4 text-gray-600">Programs are not available right now. Please check back shortly.</p>
        </div>
      </div>
    </section>

    <div v-if="showVideoModal && programVideoEmbedUrl"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/80 p-4" @click.self="closeVideoModal">
      <div class="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
        <button type="button" @click="closeVideoModal"
          class="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-colors hover:bg-white"
          aria-label="Close video modal">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="aspect-video w-full">
          <iframe :src="programVideoEmbedUrl" class="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
