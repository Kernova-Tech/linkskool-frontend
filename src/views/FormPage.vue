<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '@/api/client'
import type { FormAnswers, FormField, PublicForm } from '@/api/models'
import { formService } from '@/api/services'
import FormFieldInput from '@/components/form/FormFieldInput.vue'

/**
 * A form the Linkskool team shared: linkskool.com/f/{token}. Anyone with the
 * link may fill it in; it is never listed, and search engines are told to
 * leave it out.
 */
const route = useRoute()
const token = String(route.params.token ?? '')

const form = ref<PublicForm | null>(null)
const state = ref<'loading' | 'missing' | 'error' | 'ready' | 'sent'>('loading')
const answers = reactive<FormAnswers>({})
const email = ref('')
const website = ref('')
const errors = reactive<Record<string, string>>({})
const submitError = ref('')
const sentMessage = ref('')
const sending = ref(false)

const questions = computed(() => form.value?.fields.filter((f) => f.type !== 'section') ?? [])

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[0-9 ()-]{7,20}$/

/** The same checks the server makes, so mistakes show beside the question before sending. */
const check = (field: FormField): string => {
  const value = answers[field.id]
  const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
  if (empty) return field.required ? 'This question needs an answer.' : ''
  const text = Array.isArray(value) ? '' : value.trim()
  if (field.type === 'email' && !EMAIL.test(text)) return 'Enter a valid email address.'
  if (field.type === 'phone' && !PHONE.test(text)) return 'Enter a valid phone number.'
  if (field.type === 'number' && Number.isNaN(Number(text))) return 'Enter a number.'
  return ''
}

const validate = () => {
  for (const key of Object.keys(errors)) delete errors[key]
  if (form.value?.collectEmail && !EMAIL.test(email.value.trim())) errors.email = 'Enter your email address.'
  for (const field of questions.value) {
    const message = check(field)
    if (message) errors[field.id] = message
  }
  const first = Object.keys(errors)[0]
  if (first) document.getElementById(first === 'email' ? 'respondent-email' : `field-${first}`)?.focus()
  return !first
}

const submit = async () => {
  submitError.value = ''
  if (!validate() || !form.value) return

  sending.value = true
  try {
    const result = await formService.submit(token, { ...answers }, email.value.trim(), website.value)
    sentMessage.value = result.message
    state.value = 'sent'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    submitError.value =
      e instanceof ApiError && e.status === 429
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : e instanceof Error && e.message
          ? e.message
          : 'Your response could not be sent. Please try again.'
  } finally {
    sending.value = false
  }
}

const startAgain = () => {
  for (const key of Object.keys(answers)) delete answers[key]
  email.value = ''
  state.value = 'ready'
}

// Shared links are private: keep this page out of search results.
let robots: HTMLMetaElement | null = null
const previousTitle = document.title
onMounted(async () => {
  robots = document.createElement('meta')
  robots.name = 'robots'
  robots.content = 'noindex, nofollow'
  document.head.appendChild(robots)

  try {
    form.value = await formService.get(token)
    document.title = `${form.value.title} · Linkskool`
    state.value = 'ready'
  } catch (e) {
    state.value = e instanceof ApiError && e.status === 404 ? 'missing' : 'error'
  }
})
onUnmounted(() => {
  robots?.remove()
  document.title = previousTitle
})
</script>

<template>
  <div class="min-h-dvh bg-slate-100 px-4 py-6 sm:py-10">
    <main class="mx-auto max-w-2xl space-y-4">
      <p v-if="state === 'loading'" class="rounded-2xl bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading the form…
      </p>

      <section v-else-if="state === 'missing' || state === 'error'" class="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
        <i class="fa-solid fa-link-slash text-3xl text-slate-300"></i>
        <h1 class="mt-4 text-xl font-bold text-slate-900">
          {{ state === 'missing' ? 'We could not find this form' : 'The form did not load' }}
        </h1>
        <p class="mt-2 text-slate-600">
          {{ state === 'missing' ? 'Check the link you were given, or ask the person who shared it.' : 'Check your connection and try again.' }}
        </p>
        <button
          v-if="state === 'error'"
          type="button"
          class="mt-6 cursor-pointer rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-ink"
          @click="$router.go(0)"
        >
          Try again
        </button>
      </section>

      <template v-else-if="form">
        <header class="overflow-hidden rounded-2xl bg-white shadow-sm">
          <img v-if="form.bannerUrl" :src="form.bannerUrl" alt="" class="h-40 w-full object-cover sm:h-52" />
          <div v-else class="h-2 bg-brand"></div>
          <div class="px-6 py-6 sm:px-8">
            <img v-if="form.logoUrl" :src="form.logoUrl" alt="" class="mb-4 h-14 w-auto max-w-[10rem] object-contain" />
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">{{ form.title }}</h1>
            <p v-if="form.description && state !== 'sent'" class="mt-3 whitespace-pre-line text-slate-600">{{ form.description }}</p>
            <p v-if="form.accepting && state === 'ready' && questions.some((q) => q.required)" class="mt-4 text-sm text-red-600">
              * Required
            </p>
          </div>
        </header>

        <section v-if="state === 'sent'" class="rounded-2xl bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <i class="fa-solid fa-check text-2xl"></i>
          </span>
          <p class="mt-4 whitespace-pre-line text-lg text-slate-800" role="status">{{ sentMessage }}</p>
          <button
            v-if="!form.onePerEmail"
            type="button"
            class="mt-6 cursor-pointer font-semibold text-brand hover:underline"
            @click="startAgain"
          >
            Send another response
          </button>
        </section>

        <section v-else-if="!form.accepting" class="rounded-2xl bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <i class="fa-solid fa-lock text-2xl text-slate-300"></i>
          <p class="mt-3 whitespace-pre-line text-slate-700">{{ form.closedMessage }}</p>
        </section>

        <form v-else novalidate class="space-y-4" @submit.prevent="submit">
          <div v-if="form.collectEmail" class="rounded-2xl bg-white px-6 py-6 shadow-sm sm:px-8">
            <label for="respondent-email" class="block text-base font-semibold text-slate-900">
              Your email <span class="text-red-500" aria-label="required">*</span>
            </label>
            <p v-if="form.onePerEmail" class="mt-1 text-sm text-slate-500">Each email can send one response.</p>
            <input
              id="respondent-email"
              v-model="email"
              type="email"
              autocomplete="email"
              maxlength="191"
              :aria-invalid="!!errors.email"
              :class="[
                'mt-2 w-full rounded-xl border bg-white px-4 py-3 text-slate-900 transition focus:outline-none focus:ring-2',
                errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-brand-light focus:ring-brand-light',
              ]"
            />
            <p v-if="errors.email" class="mt-1.5 text-sm text-red-600">{{ errors.email }}</p>
          </div>

          <div
            v-for="field in form.fields"
            :key="field.id"
            :class="field.type === 'section' ? 'px-2' : 'rounded-2xl bg-white px-6 py-6 shadow-sm sm:px-8'"
          >
            <FormFieldInput
              :model-value="answers[field.id] ?? (field.type === 'checkboxes' ? [] : '')"
              :field="field"
              :error="errors[field.id]"
              @update:model-value="(v) => (answers[field.id] = v)"
            />
          </div>

          <!-- People never see this; bots fill it in and are quietly turned away. -->
          <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label for="website">Website</label>
            <input id="website" v-model="website" type="text" name="website" tabindex="-1" autocomplete="off" />
          </div>

          <p v-if="submitError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {{ submitError }}
          </p>

          <div class="flex items-center justify-between gap-4 px-2">
            <button
              type="submit"
              :disabled="sending"
              class="cursor-pointer rounded-xl bg-brand px-8 py-3 font-semibold text-white transition hover:bg-brand-ink disabled:cursor-wait disabled:opacity-70"
            >
              {{ sending ? 'Sending…' : 'Send' }}
            </button>
            <p class="text-right text-xs text-slate-500">Never share passwords through a form.</p>
          </div>
        </form>
      </template>

      <p class="pt-4 text-center text-xs text-slate-400">
        Form shared through
        <RouterLink to="/" class="font-semibold text-slate-500 hover:text-brand">Linkskool</RouterLink>
      </p>
    </main>
  </div>
</template>
