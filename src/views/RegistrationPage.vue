<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import RegistrationSteps from '@/components/RegistrationSteps.vue'
import type { Registration } from '@/api/models'
import { ApiError } from '@/api/client'
import { enrollmentService } from '@/api/services'
import { resolveAssetUrl } from '@/api/util/assetUrl'
import { usePageMeta } from '@/composables/usePageMeta'

/**
 * Step 2 of Register now: they are registered and their seat is held. Pay now
 * opens a fresh checkout; Pay later moves on to next steps. A link from an
 * email arrives with ?pay=1 and goes straight to checkout.
 */
const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.params.token ?? ''))
const registration = ref<Registration | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const isStartingCheckout = ref(false)
const checkoutError = ref('')

usePageMeta(() => ({
  robots: 'noindex, nofollow',
  title: registration.value ? `You're registered for ${registration.value.course.name} | LinkSkool` : 'Registration | LinkSkool',
  description: 'Your seat is reserved. Pay now to confirm it, or pay later.',
  keywords: 'course registration, linkskool',
  url: `https://linkskool.com/registration/${token.value}`,
  image: 'https://linkskool.com/og-image.png',
  type: 'website',
}))

const formatNaira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const courseImage = computed(() => {
  const r = registration.value
  return r ? resolveAssetUrl(r.cohort.imageUrl || r.course.imageUrl || '') : ''
})

const goToNextSteps = () =>
  router.push({ name: 'registration-next-steps', params: { token: token.value } })

const callbackUrl = () => {
  const url = new URL('/payment/completion', window.location.origin)
  url.searchParams.set('registration', token.value)
  if (registration.value?.program.slug) url.searchParams.set('program', registration.value.program.slug)
  return url.toString()
}

const payNow = async () => {
  if (isStartingCheckout.value) return
  checkoutError.value = ''
  isStartingCheckout.value = true

  try {
    const checkout = await enrollmentService.registrationCheckout(token.value, callbackUrl())
    if (checkout.status === 'paid' || !checkout.paymentUrl) {
      await goToNextSteps()
      return
    }
    window.location.assign(checkout.paymentUrl)
  } catch (error) {
    console.error('Failed to start checkout:', error)
    checkoutError.value =
      error instanceof ApiError && error.status < 500 && error.message
        ? error.message
        : 'Checkout could not start right now. Please try again.'
    isStartingCheckout.value = false
  }
}

onMounted(async () => {
  try {
    registration.value = await enrollmentService.registration(token.value)
  } catch (error) {
    console.error('Failed to load registration:', error)
    loadError.value =
      error instanceof ApiError && error.status === 404
        ? 'We could not find this registration. Check the link in your email.'
        : 'Your registration could not be loaded right now. Please refresh.'
    return
  } finally {
    isLoading.value = false
  }

  if (registration.value.status !== 'unpaid') {
    await router.replace({ name: 'registration-next-steps', params: { token: token.value } })
    return
  }

  if (route.query.pay === '1') {
    // Drop ?pay=1 first: back from checkout (or a cancelled payment) then lands
    // on this page as it is, instead of opening checkout all over again.
    const query = { ...route.query }
    delete query.pay
    await router.replace({ query })
    await payNow()
  }
})

/** Back from checkout, the browser may restore this page as it was left: mid-checkout. */
const onPageShow = (event: PageTransitionEvent) => {
  if (event.persisted) isStartingCheckout.value = false
}
onMounted(() => window.addEventListener('pageshow', onPageShow))
onBeforeUnmount(() => window.removeEventListener('pageshow', onPageShow))
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-slate-50">
    <AppHeader />

    <main class="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
      <div v-if="isLoading" class="space-y-6 animate-pulse">
        <div class="h-16 rounded-2xl bg-slate-200"></div>
        <div class="h-64 rounded-2xl bg-slate-200"></div>
      </div>

      <div v-else-if="loadError || !registration" class="card px-6 py-14 text-center">
        <i class="fa-solid fa-circle-exclamation text-4xl text-slate-300"></i>
        <p class="mt-4 text-slate-600">{{ loadError }}</p>
        <RouterLink to="/#programs" class="btn btn-secondary btn-sm mt-6">Browse programs</RouterLink>
      </div>

      <template v-else>
        <RegistrationSteps :current="2" />

        <section class="card card-raised mt-8 overflow-hidden">
          <div class="relative px-6 pb-8 pt-10 text-center sm:px-10">
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600 ring-8 ring-emerald-50/60"
            >
              <i class="fa-solid fa-check"></i>
            </div>
            <p class="eyebrow mt-6">You're registered</p>
            <h1 class="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Congratulations, {{ registration.learner.firstName || 'there' }}!
            </h1>
            <p class="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
              Your seat in <strong class="font-semibold text-slate-900">{{ registration.course.name }}</strong> is
              reserved. Pay now to confirm it and join the learners' group, or pay later and get set up first.
            </p>
          </div>

          <div class="border-t border-slate-100 bg-slate-50/60 px-6 py-6 sm:px-10">
            <div class="flex min-w-0 items-center gap-4">
              <img
                v-if="courseImage"
                :src="courseImage"
                alt=""
                class="h-16 w-24 flex-none rounded-xl border border-slate-200 object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-slate-950">{{ registration.course.name }}</p>
                <p class="truncate text-sm text-slate-500">
                  {{ registration.cohort.title }}
                  <template v-if="formatDate(registration.cohort.startDate)">
                    · Starts {{ formatDate(registration.cohort.startDate) }}
                  </template>
                </p>
              </div>
            </div>

            <dl class="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div>
                <dt class="text-slate-500">Invoice</dt>
                <dd class="mt-0.5 font-medium text-slate-900">{{ registration.invoice.number }}</dd>
              </div>
              <div class="text-right">
                <dt class="text-slate-500">Amount due</dt>
                <dd class="mt-0.5 text-xl font-semibold tracking-tight text-slate-950">
                  {{ formatNaira(registration.invoice.amount) }}
                </dd>
              </div>
            </dl>

            <p v-if="registration.learner.email" class="mt-4 flex items-start gap-2 text-sm text-slate-600">
              <i class="fa-solid fa-envelope mt-0.5 text-brand"></i>
              <span>
                We've emailed your invoice<template v-if="registration.links.curriculumUrl"> and the curriculum</template>
                to <strong class="font-medium text-slate-900">{{ registration.learner.email }}</strong>.
              </span>
            </p>
          </div>

          <div class="px-6 pb-8 pt-6 sm:px-10">
            <div
              v-if="checkoutError"
              class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {{ checkoutError }}
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="btn btn-primary flex-1"
                :disabled="isStartingCheckout"
                @click="payNow"
              >
                <i v-if="isStartingCheckout" class="fa-solid fa-spinner fa-spin"></i>
                <template v-else>
                  <i class="fa-solid fa-lock text-xs"></i>
                  Pay {{ formatNaira(registration.invoice.amount) }} now
                </template>
              </button>
              <button
                type="button"
                class="btn btn-secondary flex-1"
                :disabled="isStartingCheckout"
                @click="goToNextSteps"
              >
                Pay later
              </button>
            </div>
            <p class="mt-4 text-center text-xs text-slate-500">
              <i class="fa-solid fa-shield-halved mr-1"></i>
              Secure checkout by Paystack.
            </p>
          </div>
        </section>
      </template>
    </main>

    <AppFooter />
  </div>
</template>
