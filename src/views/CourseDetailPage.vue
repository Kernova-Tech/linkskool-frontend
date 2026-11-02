<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import EnrollmentCard from '@/components/EnrollmentCard.vue'
import EnrollmentForm from '@/components/EnrollmentForm.vue'
import type { CourseDetail } from '@/api/models'
import { ApiError } from '@/api/client'
import { enrollmentService, programService } from '@/api/services'
import { resolveAssetUrl } from '@/api/util/assetUrl'
import { usePageMeta } from '@/composables/usePageMeta'
import { useWebShare } from '@/composables/useWebShare'

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
const submitError = ref('')
const isSubmitting = ref(false)

/** The page only exists with its cohort reference, so its address keeps it. */
const pageUrl = computed(() => {
  const ref = typeof route.query.ref === 'string' ? route.query.ref : ''
  const base = `https://linkskool.com/courses/${route.params.courseId}`
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base
})

const pageImage = computed(() => {
  const detail = courseDetail.value
  const image = detail?.cohort.imageUrl || detail?.course.imageUrl
  return (image && resolveAssetUrl(image)) || 'https://linkskool.com/og-image.png'
})

const plainDescription = computed(() => {
  const detail = courseDetail.value
  const raw = detail?.cohort.description || detail?.course.description || ''
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
})

const toIsoDate = (value?: string | null) => {
  if (!value) return undefined
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/** schema.org Course, so the course can appear in Google's course results. */
const courseJsonLd = computed(() => {
  const detail = courseDetail.value
  if (!detail) return null
  const { cohort, course, program } = detail
  const free = Boolean(cohort.isFree)
  const cost = cohort.cost ?? 0
  const price = free ? 0 : Math.round((cost - (cost * (cohort.discount ?? 0)) / 100) * 100) / 100
  const mode = (cohort.deliveryMode || '').toLowerCase()

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.courseName,
    description: plainDescription.value || `${course.courseName} on LinkSkool.`,
    url: pageUrl.value,
    image: pageImage.value,
    inLanguage: 'en',
    provider: { '@type': 'Organization', name: 'LinkSkool', sameAs: 'https://linkskool.com' },
    ...(program?.name ? { isPartOf: { '@type': 'EducationalOccupationalProgram', name: program.name } } : {}),
    offers: {
      '@type': 'Offer',
      category: free ? 'Free' : 'Paid',
      price,
      priceCurrency: 'NGN',
      url: pageUrl.value,
      availability: isEnrollmentClosed.value ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      ...(toIsoDate(cohort.enrollmentDeadline) ? { validThrough: toIsoDate(cohort.enrollmentDeadline) } : {}),
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      name: cohort.title,
      courseMode: mode === 'onsite' ? 'Onsite' : mode === 'hybrid' ? 'Blended' : 'Online',
      ...(toIsoDate(cohort.startDate) ? { startDate: toIsoDate(cohort.startDate) } : {}),
      ...(toIsoDate(cohort.endDate) ? { endDate: toIsoDate(cohort.endDate) } : {}),
      ...(cohort.instructorName ? { instructor: { '@type': 'Person', name: cohort.instructorName } } : {}),
    },
  }
})


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

const heroImage = computed(() => {
  const image = courseDetail.value?.cohort.imageUrl || courseDetail.value?.course.imageUrl
  return image ? (resolveAssetUrl(image) ?? '') : ''
})

/** The description as plain text: tags out, entities decoded, paragraphs kept. */
const aboutText = computed(() => {
  const raw = courseDetail.value?.cohort.description || courseDetail.value?.course.description || ''
  if (!raw) return ''
  const doc = new DOMParser().parseFromString(
    raw.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n'),
    'text/html',
  )
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim()
})
const showFullAbout = ref(false)

const startLabel = computed(() => {
  const value = courseDetail.value?.cohort.startDate
  const date = value ? new Date(value.replace(' ', 'T')) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
})

const { share, status: shareStatus } = useWebShare()
const shareCourse = () =>
  share({
    url: pageUrl.value,
    title: courseDetail.value?.course.courseName ?? 'LinkSkool course',
    text: `${courseDetail.value?.course.courseName ?? 'A course'} on LinkSkool`,
  })
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

usePageMeta(() => ({
  title: courseDetail.value
    ? `${courseDetail.value.course.courseName} - Professional Course | LinkSkool`
    : 'Course Details | LinkSkool',
  description: (plainDescription.value || 'Explore this LinkSkool course, what it covers and how to register.').slice(0, 160),
  keywords: `${courseDetail.value?.course.courseName || 'course'}, online learning, professional development, skill training`,
  url: pageUrl.value,
  image: pageImage.value,
  type: 'article',
  jsonLd: courseJsonLd.value,
}))

/** Register now: one form for every course. A paid course is paid for after, now or later. */
const handleRegister = () => {
  if (isEnrollmentClosed.value) return
  submitError.value = ''
  showEnrollmentForm.value = true
}

const closeEnrollmentForm = () => {
  showEnrollmentForm.value = false
  submitError.value = ''
}

const handleFormSubmit = async (formData: EnrollmentFormData) => {
  if (isSubmitting.value || !courseDetail.value) return

  const detail = courseDetail.value
  if (!detail.cohort.cohortId) {
    submitError.value = 'This cohort is unavailable for registration right now.'
    return
  }

  submitError.value = ''
  isSubmitting.value = true

  try {
    const result = await enrollmentService.register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      programId: detail.program.id,
      courseId: detail.course.courseId,
      cohortId: detail.cohort.cohortId,
    })

    showEnrollmentForm.value = false
    // Nothing to pay: straight to getting set up.
    await router.push(
      result.status === 'unpaid'
        ? { name: 'registration', params: { token: result.token } }
        : { name: 'registration-next-steps', params: { token: result.token } },
    )
  } catch (error) {
    console.error('Failed to register:', error)
    submitError.value =
      error instanceof ApiError && error.status < 500 && error.message
        ? error.message
        : 'Registration could not be completed right now. Please try again.'
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
  fetchCourseDetail()
})

watch(detailRef, () => {
  fetchCourseDetail()
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-white">
    <AppHeader />

    <div v-if="isLoading" class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="animate-pulse">
          <div class="h-96 bg-slate-200 rounded-2xl mb-8"></div>
          <div class="grid lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-4">
              <div class="h-8 bg-slate-200 rounded w-3/4"></div>
              <div class="h-4 bg-slate-200 rounded w-full"></div>
              <div class="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
            <div class="h-96 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="courseDetail" class="pb-28 pt-20 lg:pb-20 lg:pt-24">
      <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Hero, as on the app: the course over its picture, with the action and Share. -->
        <section
          class="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-brand to-[#4338ca] text-white shadow-lg"
        >
          <img
            v-if="heroImage"
            :src="heroImage"
            alt=""
            aria-hidden="true"
            class="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
          />
          <div class="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-transparent"></div>

          <button
            type="button"
            class="absolute right-3 top-3 z-10 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white/95 px-3.5 text-xs font-semibold text-brand shadow-sm transition hover:bg-white sm:right-4 sm:top-4"
            :aria-label="shareStatus === 'copied' ? 'Link copied' : 'Share this course'"
            @click="shareCourse"
          >
            <i :class="shareStatus === 'copied' ? 'fa-solid fa-check' : 'fa-solid fa-share-nodes'" aria-hidden="true"></i>
            {{ shareStatus === 'copied' ? 'Link copied' : 'Share' }}
          </button>

          <div class="max-w-2xl px-5 pb-7 pt-14 sm:px-8 sm:py-10">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{{ courseDetail.program.name }}</p>
            <h1 class="mt-2 break-words text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl lg:text-4xl">
              {{ courseDetail.course.courseName }}
            </h1>
            <p v-if="aboutText" class="mt-3 line-clamp-3 text-sm leading-relaxed text-blue-50/90 sm:text-base">
              {{ aboutText }}
            </p>

            <div class="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              <span v-if="startLabel" class="rounded-full bg-white/15 px-3 py-1 backdrop-blur">Starts {{ startLabel }}</span>
              <span class="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{{ learningTypeLabel }}</span>
              <span v-if="courseDetail.cohort.deliveryMode" class="rounded-full bg-white/15 px-3 py-1 capitalize backdrop-blur">
                {{ courseDetail.cohort.deliveryMode }}
              </span>
              <span v-if="courseDetail.cohort.instructorName" class="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                With {{ courseDetail.cohort.instructorName }}
              </span>
            </div>

            <div class="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-brand shadow transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="isEnrollmentClosed"
                @click="handleRegister"
              >
                {{ isEnrollmentClosed ? 'Enrollment closed' : isFreeCourse ? 'Register for free' : 'Register now' }}
                <i v-if="!isEnrollmentClosed" class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </div>
          </div>
        </section>

        <div class="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div class="min-w-0 space-y-10">
            <!-- The cohort's video when it has one, else its picture. -->
            <div
              v-if="displayVideoUrl || heroImage"
              class="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:rounded-2xl"
            >
              <iframe
                v-if="displayVideoUrl"
                :src="displayVideoUrl"
                class="h-full w-full"
                :title="`${courseDetail.course.courseName} course video`"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <img v-else :src="heroImage" :alt="courseDetail.course.courseName" class="h-full w-full object-cover" />
            </div>

            <section v-if="aboutText" class="min-w-0">
              <h2 class="text-2xl font-semibold tracking-tight text-slate-950">About this course</h2>
              <p
                class="mt-4 whitespace-pre-line break-words leading-8 text-slate-600"
                :class="{ 'line-clamp-6': !showFullAbout }"
              >{{ aboutText }}</p>
              <button
                v-if="aboutText.length > 360"
                type="button"
                class="mt-2 cursor-pointer text-sm font-semibold text-brand hover:underline"
                @click="showFullAbout = !showFullAbout"
              >
                {{ showFullAbout ? 'Show less' : 'Show more' }}
              </button>
            </section>

            <section v-if="parsedBenefits.length > 0">
              <h2 class="mb-6 text-2xl font-semibold tracking-tight text-slate-950">What you'll learn</h2>
              <div class="grid gap-3 sm:grid-cols-2">
                <div v-for="(benefit, index) in parsedBenefits" :key="`${benefit}-${index}`"
                  class="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft">
                    <i class="fa-solid fa-check text-xs text-brand"></i>
                  </div>
                  <p class="min-w-0 break-words text-slate-700">{{ benefit }}</p>
                </div>
              </div>
            </section>

            <section v-if="courseDetail.cohort.instructorName" class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 class="mb-5 text-2xl font-semibold tracking-tight text-slate-950">Your instructor</h2>
              <div class="flex min-w-0 items-center gap-4">
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-700">
                  {{ courseDetail.cohort.instructorName.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <h3 class="break-words text-lg font-semibold text-slate-950">
                    {{ courseDetail.cohort.instructorName }}
                  </h3>
                  <p class="mt-1 text-sm text-slate-500">Course instructor</p>
                </div>
              </div>
            </section>
          </div>

          <aside class="order-first min-w-0 lg:order-none">
            <EnrollmentCard :course-detail="courseDetail" @register="handleRegister" />
          </aside>
        </div>
      </div>
    </div>

    <div v-else class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center py-16">
          <i class="fa-solid fa-circle-exclamation text-6xl text-slate-300 mb-4"></i>
          <p class="text-xl text-slate-600">{{ loadError || 'Course details unavailable.' }}</p>
        </div>
      </div>
    </div>

    <EnrollmentForm v-if="showEnrollmentForm && courseDetail" :course-detail="courseDetail" :mode="isFreeCourse ? 'free' : 'register'"
      :submit-error="submitError" :is-submitting="isSubmitting" @close="closeEnrollmentForm" @submit="handleFormSubmit" />

    <AppFooter />
  </div>
</template>

<style scoped>
.prose {
  color: inherit;
}
</style>
