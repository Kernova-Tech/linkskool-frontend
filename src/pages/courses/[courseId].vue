<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import EnrollmentCard from '@/components/EnrollmentCard.vue'
import EnrollmentForm from '@/components/EnrollmentForm.vue'
import type { CourseDetail, PaymentPayload, ReservePayload } from '@/api/models'
import { enrollmentService, programService } from '@/api/services'
import { resolveAssetUrl } from '@/api/util/assetUrl'
import { usePageMeta } from '@/composables/usePageMeta'
import {
  clearPendingPayment,
  readPendingPayment,
  savePendingPayment,
  type PendingPayment,
} from '@/utils/pendingPayment'

interface EnrollmentFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const route = useRoute()
const router = useRouter()

const courseDetail = ref<CourseDetail | null>(null)
const isLoading = ref(false)
const loadError = ref('')
const showEnrollmentForm = ref(false)
const enrollmentAction = ref<'pay' | 'reserve' | 'free'>('pay')
const submitError = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const lastPaymentUrl = ref('')
const lastPaymentReference = ref('')
const pendingPayment = ref<PendingPayment | null>(readPendingPayment())
const isCheckingPendingPayment = ref(false)
const configuredPaymentCallbackUrl = (import.meta.env.VITE_PAYMENT_CALLBACK_URL as string | undefined)?.trim() ?? ''
const PAYMENT_CALLBACK_URL = configuredPaymentCallbackUrl || `${window.location.origin}/payment/completion`

const buildPaymentCallbackUrl = (programSlug?: string | null, whatsappGroupLink?: string | null) => {
  const raw = PAYMENT_CALLBACK_URL.trim()
  if (!raw) return `${window.location.origin}/payment/completion`

  const whatsapp = whatsappGroupLink?.trim() ?? ''

  try {
    const callbackUrl = new URL(raw)
    if (programSlug) {
      callbackUrl.searchParams.set('program', programSlug)
    }
    if (whatsapp) {
      callbackUrl.searchParams.set('whatsapp', whatsapp)
    }
    return callbackUrl.toString()
  } catch {
    const queryParts: string[] = []
    if (programSlug) {
      queryParts.push(`program=${encodeURIComponent(programSlug)}`)
    }
    if (whatsapp) {
      queryParts.push(`whatsapp=${encodeURIComponent(whatsapp)}`)
    }

    if (queryParts.length === 0) {
      return raw
    }

    const separator = raw.includes('?') ? '&' : '?'
    return `${raw}${separator}${queryParts.join('&')}`
  }
}

const hasPendingPayment = computed(() => Boolean(pendingPayment.value?.reference && pendingPayment.value?.paymentUrl))

const syncPendingPaymentState = (value: PendingPayment | null) => {
  pendingPayment.value = value
  lastPaymentReference.value = value?.reference ?? ''
  lastPaymentUrl.value = value?.paymentUrl ?? ''
}

const setPendingPaymentState = (value: PendingPayment) => {
  savePendingPayment(value)
  syncPendingPaymentState(value)
}

const clearPendingPaymentState = () => {
  clearPendingPayment()
  syncPendingPaymentState(null)
}

const checkPendingPaymentStatus = async () => {
  const reference = pendingPayment.value?.reference
  if (!reference) return

  isCheckingPendingPayment.value = true

  try {
    const isPaid = await enrollmentService.paymentStatus(reference)
    clearPendingPaymentState()
    submitError.value = ''
    successMessage.value = isPaid
      ? 'Your previous payment has been confirmed.'
      : 'Previous checkout is no longer active. You can start a new payment.'
  } catch (error) {
    console.error('Failed to verify pending payment status:', error)
  } finally {
    isCheckingPendingPayment.value = false
  }
}

const resumePendingPayment = () => {
  if (!pendingPayment.value?.paymentUrl) return
  window.location.assign(pendingPayment.value.paymentUrl)
}

const discardPendingPayment = () => {
  clearPendingPaymentState()
  submitError.value = ''
  successMessage.value = 'Previous checkout cleared. You can start a new payment now.'
}

const handleWindowFocus = () => {
  if (hasPendingPayment.value && !isCheckingPendingPayment.value) {
    checkPendingPaymentStatus()
  }
}

const handleDocumentVisibility = () => {
  if (document.visibilityState === 'visible') {
    handleWindowFocus()
  }
}

// Dynamic meta tags based on course data
usePageMeta(() => ({
  title: courseDetail.value
    ? `${courseDetail.value.course.courseName} - Professional Course | Linkskool`
    : 'Course Details | Linkskool',
  description: courseDetail.value?.course.description || courseDetail.value?.cohort.description || 'Learn from industry experts with our comprehensive course curriculum.',
  keywords: `${courseDetail.value?.course.courseName || 'course'}, online learning, professional development, skill training`,
  url: `https://linkskool.com/courses/${route.params.courseId}`,
  image: courseDetail.value?.course.imageUrl ? resolveAssetUrl(courseDetail.value.course.imageUrl) || 'https://linkskool.com/assets/og-image.png' : 'https://linkskool.com/assets/og-image.png',
  type: 'article',
}))

const decodeRef = (value: string) => {
  try {
    return atob(value)
  } catch {
    return value
  }
}

const detailRef = computed(() => {
  const queryValue = route.query.ref
  if (Array.isArray(queryValue)) {
    return queryValue[0] ? decodeRef(queryValue[0]) : ''
  }
  return queryValue ? decodeRef(queryValue) : ''
})

const splitPlainBenefits = (value: string) =>
  value
    .replace(/\r/g, '\n')
    .split(/\n+|•|;/)
    .map((item) => item.trim())
    .filter(Boolean)

const parseBenefits = (benefits: string | null): string[] => {
  if (!benefits) return []

  const raw = benefits.trim()
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean)
    }
    if (typeof parsed === 'string') {
      return parseBenefits(parsed)
    }
  } catch {
    // Continue with plain/html parsing.
  }

  const containsHtml = /<[^>]+>/.test(raw)
  if (containsHtml) {
    const document = new DOMParser().parseFromString(raw, 'text/html')
    const listItems = Array.from(document.querySelectorAll('li'))
      .map((item) => item.textContent?.trim() ?? '')
      .filter(Boolean)

    if (listItems.length > 0) {
      return listItems
    }

    return splitPlainBenefits(document.body.textContent ?? '')
  }

  return splitPlainBenefits(raw)
}

const parsedBenefits = computed(() => parseBenefits(courseDetail.value?.cohort.benefits ?? null))
const toEmbeddableVideoUrl = (rawUrl: string | null | undefined) => {
  const value = rawUrl?.trim()
  if (!value) return null

  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v')
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const videoId = parsed.pathname.split('/')[2]
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return value
      }
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    return value
  } catch {
    return value
  }
}

const displayVideoUrl = computed(() => toEmbeddableVideoUrl(courseDetail.value?.cohort.videoUrl))
const displayImageUrl = computed(() => resolveAssetUrl(courseDetail.value?.cohort.imageUrl))
const learningTypeLabel = computed(() =>
  courseDetail.value?.cohort.learningType === 'instructor_led' ? 'Instructor-led' : 'Self-paced',
)
const isFreeCourse = computed(() => Boolean(courseDetail.value?.cohort.isFree))
const isEnrollmentClosed = computed(() => {
  const detail = courseDetail.value
  if (!detail) return false
  if (detail.cohort.learningType !== 'instructor_led' || !detail.cohort.enrollmentDeadline) return false
  const deadline = new Date(detail.cohort.enrollmentDeadline)
  if (Number.isNaN(deadline.getTime())) return false
  return deadline.getTime() < Date.now()
})

const handleEnroll = () => {
  if (isEnrollmentClosed.value) return

  if (!isFreeCourse.value && hasPendingPayment.value) {
    submitError.value = 'You already have a checkout in progress. Resume or clear it before starting another one.'
    return
  }

  submitError.value = ''
  successMessage.value = ''
  if (!hasPendingPayment.value) {
    lastPaymentUrl.value = ''
    lastPaymentReference.value = ''
  }
  enrollmentAction.value = isFreeCourse.value ? 'free' : 'pay'
  showEnrollmentForm.value = true
}

const handleReserve = () => {
  if (isEnrollmentClosed.value) return
  submitError.value = ''
  successMessage.value = ''
  enrollmentAction.value = 'reserve'
  showEnrollmentForm.value = true
}

const closeEnrollmentForm = () => {
  showEnrollmentForm.value = false
  submitError.value = ''
}

const handleFormSubmit = async (formData: EnrollmentFormData) => {
  if (isSubmitting.value) return

  submitError.value = ''
  successMessage.value = ''
  if (!hasPendingPayment.value) {
    lastPaymentUrl.value = ''
    lastPaymentReference.value = ''
  }

  if (!courseDetail.value) {
    submitError.value = 'Course details are unavailable right now.'
    return
  }

  const cohortId = courseDetail.value.cohort.cohortId

  if (!cohortId) {
    submitError.value = 'This cohort is unavailable for enrollment right now.'
    return
  }

  const basePayload = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    programId: courseDetail.value.program.id,
    items: [
      {
        courseId: courseDetail.value.course.courseId,
        cohortId,
      },
    ],
  }

  isSubmitting.value = true

  try {
    if (enrollmentAction.value === 'pay') {
      const payload: PaymentPayload = {
        ...basePayload,
        callbackUrl: buildPaymentCallbackUrl(courseDetail.value.program.slug, courseDetail.value.cohort.whatsappGroupLink),
      }

      const paymentResponse = await enrollmentService.makePayment(payload)
      const paymentStatus = paymentResponse.status
      const paymentMessage = typeof paymentResponse.message === 'string'
        ? paymentResponse.message.trim()
        : ''

      if (paymentStatus === 'blocked') {
        clearPendingPaymentState()
        submitError.value = paymentMessage || 'Payment is currently blocked. Please contact support.'
        return
      }

      const paymentUrl = typeof paymentResponse.paymentUrl === 'string'
        ? paymentResponse.paymentUrl.trim()
        : ''

      if (!paymentUrl) {
        submitError.value = paymentMessage || 'Payment link was not returned. Please try again.'
        return
      }

      const pendingCheckout = {
        reference: paymentResponse.reference || '',
        paymentUrl,
        createdAt: Date.now(),
      }

      setPendingPaymentState(pendingCheckout)
      showEnrollmentForm.value = false
      successMessage.value = 'Payment initialized. Opening secure checkout...'
      window.setTimeout(() => {
        window.location.assign(paymentUrl)
      }, 150)
      return
    }

    if (enrollmentAction.value === 'free') {
      const payload: ReservePayload = basePayload
      const isEnrolled = await enrollmentService.freeEnrollment(payload)

      if (!isEnrolled) {
        submitError.value = 'Enrollment could not be completed right now. Please try again.'
        return
      }

      showEnrollmentForm.value = false
      successMessage.value = 'Your enrollment is complete.'
      await router.push({
        name: 'reservation-completion',
        query: {
          program: courseDetail.value.program.slug,
          completion: 'enrollment',
          whatsapp: courseDetail.value.cohort.whatsappGroupLink ?? '',
        },
      })
      return
    }

    const payload: ReservePayload = basePayload
    const isReserved = await enrollmentService.reserve(payload)

    if (!isReserved) {
      submitError.value = 'Reservation was not completed. Please try again.'
      return
    }

    showEnrollmentForm.value = false
    successMessage.value = 'Your seat reservation is complete.'
    await router.push({
      name: 'reservation-completion',
      query: {
        program: courseDetail.value.program.slug,
        completion: 'reservation',
        whatsapp: courseDetail.value.cohort.whatsappGroupLink ?? '',
      },
    })
  } catch (error) {
    console.error('Failed to submit enrollment request:', error)
    submitError.value = enrollmentAction.value === 'pay'
      ? 'Payment could not be completed right now. Please try again.'
      : enrollmentAction.value === 'reserve'
      ? 'Reservation could not be completed right now. Please try again.'
      : 'Enrollment could not be completed right now. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const fetchCourseDetail = async () => {
  isLoading.value = true
  loadError.value = ''
  courseDetail.value = null

  if (!detailRef.value) {
    loadError.value = 'Course details are unavailable.'
    isLoading.value = false
    return
  }

  try {
    const response = await programService.getProgramCourseCohortDetails(detailRef.value)
    courseDetail.value = response
  } catch (error) {
    console.error('Failed to fetch course details:', error)
    loadError.value = 'Unable to load course details right now.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  syncPendingPaymentState(readPendingPayment())
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleDocumentVisibility)
  fetchCourseDetail()
  checkPendingPaymentStatus()
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleDocumentVisibility)
})

watch(detailRef, () => {
  fetchCourseDetail()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <div v-if="isLoading" class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="animate-pulse">
          <div class="h-96 bg-gray-200 rounded-2xl mb-8"></div>
          <div class="grid lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-4">
              <div class="h-8 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
              <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div class="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="courseDetail" class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
          <div v-if="displayVideoUrl" class="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe :src="displayVideoUrl" class="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>
          <div v-else-if="displayImageUrl" class="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <img :src="displayImageUrl" :alt="courseDetail.course.courseName" loading="lazy"
              class="w-full h-full object-cover" />
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-12">
          <div class="lg:col-span-2 space-y-8">
            <div v-if="submitError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ submitError }}
            </div>

            <div v-if="successMessage"
              class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {{ successMessage }}
            </div>

            <div v-if="lastPaymentUrl"
              class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <p class="font-semibold">Checkout link ready</p>
              <p class="mt-1 text-blue-700">If payment did not open automatically, continue with the button below.</p>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <button type="button" @click="resumePendingPayment"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                  <i class="fa-solid fa-up-right-from-square"></i>
                  <span>Resume Payment</span>
                </button>
                <span v-if="lastPaymentReference" class="text-xs text-blue-700">Ref: {{ lastPaymentReference }}</span>
              </div>
            </div>

            <div v-if="hasPendingPayment"
              class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p class="font-semibold">Checkout in progress</p>
              <p class="mt-1 text-amber-800">Finish the existing payment before starting another checkout.</p>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <button type="button" @click="resumePendingPayment"
                  class="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Resume Payment</span>
                </button>
                <button type="button" @click="discardPendingPayment"
                  class="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                  <i class="fa-solid fa-rotate-left"></i>
                  <span>Start New Checkout</span>
                </button>
              </div>
            </div>

            <div>
              <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {{ courseDetail.course.courseName }}
              </h1>
              <p class="text-2xl text-gray-700 font-medium mb-6">
                {{ courseDetail.cohort.title }}
              </p>

              <div class="flex flex-wrap gap-6 text-gray-600">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-chalkboard-user text-blue-600"></i>
                  <span>{{ courseDetail.program.name }}</span>
                </div>
                <div v-if="courseDetail.cohort.deliveryMode" class="flex items-center gap-2">
                  <i class="fa-solid fa-video text-orange-600"></i>
                  <span>{{ courseDetail.cohort.deliveryMode }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-signal text-indigo-600"></i>
                  <span>{{ learningTypeLabel }}</span>
                </div>
              </div>
            </div>

            <div class="prose max-w-none">
              <h2 class="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
              <div class="text-gray-700 leading-relaxed whitespace-pre-line">
                {{ courseDetail.cohort.description || courseDetail.course.description }}
              </div>
            </div>

            <div v-if="parsedBenefits.length > 0">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">What You'll Learn</h2>
              <div class="grid md:grid-cols-2 gap-4">
                <div v-for="(benefit, index) in parsedBenefits" :key="`${benefit}-${index}`"
                  class="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <i class="fa-solid fa-check text-green-600 text-xs"></i>
                  </div>
                  <p class="text-gray-700">{{ benefit }}</p>
                </div>
              </div>
            </div>

            <div v-if="courseDetail.cohort.instructorName"
              class="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Your Instructor</h2>
              <div class="flex items-start gap-6">
                <div
                  class="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {{ courseDetail.cohort.instructorName.charAt(0) }}
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">
                    {{ courseDetail.cohort.instructorName }}
                  </h3>
                  <p class="text-gray-600">Course instructor</p>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1">
            <EnrollmentCard :course-detail="courseDetail" @enroll="handleEnroll" @reserve="handleReserve" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center py-16">
          <i class="fa-solid fa-circle-exclamation text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-600">{{ loadError || 'Course details unavailable.' }}</p>
        </div>
      </div>
    </div>

    <EnrollmentForm v-if="showEnrollmentForm && courseDetail" :course-detail="courseDetail" :mode="enrollmentAction"
      :submit-error="submitError" :is-submitting="isSubmitting" @close="closeEnrollmentForm" @submit="handleFormSubmit" />

    <AppFooter />
  </div>
</template>

<style scoped>
.prose {
  color: inherit;
}
</style>
