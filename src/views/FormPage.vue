<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import DOMPurify from 'dompurify'
import { useRoute } from 'vue-router'
import { ApiError } from '@/api/client'
import type { FormAnswers, FormField, PublicForm } from '@/api/models'
import { formService } from '@/api/services'
import FormFieldInput from '@/components/form/FormFieldInput.vue'
import { siteLinks } from '@/config/site'
import { FILE_KINDS } from '@/components/form/fileKinds'

/**
 * A form the Linkskool team shared: linkskool.com/f/{token}. Laid out like a
 * Google Form, one narrow column of cards. Anyone with the link may fill it in;
 * it is never listed, and search engines are told to leave it out.
 */
const route = useRoute()
const token = String(route.params.token ?? '')

const form = ref<PublicForm | null>(null)
const state = ref<'loading' | 'missing' | 'error' | 'ready' | 'sent'>('loading')
const answers = reactive<FormAnswers>({})
const files = reactive<Record<string, File | null>>({})
const email = ref('')
const website = ref('')
const errors = reactive<Record<string, string>>({})
const submitError = ref('')
const sentMessage = ref('')
const sending = ref(false)
const confirmingClear = ref(false)

/**
 * The description is rich text from the team's editor. The API cleans it on
 * save; it is cleaned again here, and links open in a new tab. Plain text from
 * before keeps its line breaks.
 */
const descriptionHtml = computed(() => {
  const raw = form.value?.description?.trim()
  if (!raw) return ''
  const html = /<[a-z][\s\S]*>/i.test(raw)
    ? raw
    : raw
        .split(/\n{2,}/)
        .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
        .join('')
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  doc.querySelectorAll('a').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer nofollow')
  })
  return doc.body.innerHTML
})

const questions = computed(() => form.value?.fields.filter((f) => f.type !== 'section') ?? [])
const hasRequired = computed(() => form.value?.collectEmail || questions.value.some((q) => q.required))

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[0-9 ()-]{7,20}$/

/** The same checks the server makes, so mistakes show beside the question before sending. */
const check = (field: FormField): string => {
  if (field.type === 'file') {
    const file = files[field.id]
    if (!file) return field.required ? 'This question needs a file.' : ''
    const kind = FILE_KINDS[field.accept ?? 'documents']
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!kind.extensions.includes(ext)) return `Choose a ${kind.label} file.`
    if (file.size > (field.maxMb ?? 5) * 1048576) return `This file is too large. The limit is ${field.maxMb ?? 5} MB.`
    return ''
  }

  const value = answers[field.id]
  const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
  if (empty) return field.required ? 'This is a required question.' : ''
  const text = Array.isArray(value) ? '' : value.trim()
  if (field.type === 'email' && !EMAIL.test(text)) return 'Enter a valid email address.'
  if (field.type === 'phone' && !PHONE.test(text)) return 'Enter a valid phone number.'
  if (field.type === 'number' && Number.isNaN(Number(text))) return 'Enter a number.'
  return ''
}

const validate = () => {
  for (const key of Object.keys(errors)) delete errors[key]
  if (form.value?.collectEmail && !EMAIL.test(email.value.trim())) errors.email = 'Enter a valid email address.'
  for (const field of questions.value) {
    const message = check(field)
    if (message) errors[field.id] = message
  }

  // Take the person to the first thing that needs fixing.
  const first = Object.keys(errors)[0]
  if (first) {
    const card = document.getElementById(first === 'email' ? 'q-email' : `q-${first}`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.getElementById(first === 'email' ? 'respondent-email' : `field-${first}`)?.focus({ preventScroll: true })
  }
  return !first
}

const submit = async () => {
  submitError.value = ''
  if (!validate() || !form.value) return

  const attached = Object.fromEntries(Object.entries(files).filter((e): e is [string, File] => e[1] instanceof File))
  sending.value = true
  try {
    const result = await formService.submit(token, { ...answers }, email.value.trim(), website.value, attached)
    sentMessage.value = result.message
    state.value = 'sent'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    submitError.value =
      e instanceof ApiError && e.status === 429
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : e instanceof ApiError && e.status === 413
          ? 'Your files are too large to send together. Try smaller files.'
          : e instanceof Error && e.message
            ? e.message
            : 'Your response could not be sent. Please try again.'
  } finally {
    sending.value = false
  }
}

const clearForm = () => {
  for (const key of Object.keys(answers)) delete answers[key]
  for (const key of Object.keys(files)) delete files[key]
  for (const key of Object.keys(errors)) delete errors[key]
  email.value = ''
  submitError.value = ''
  confirmingClear.value = false
}

const startAgain = () => {
  clearForm()
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
  <div class="min-h-dvh bg-brand-soft px-3 py-4 font-sans sm:py-8">
    <main class="mx-auto w-full max-w-[680px] space-y-3">
      <!-- Loading: the shape of a form, so nothing jumps when it arrives. -->
      <div v-if="state === 'loading'" class="space-y-3" aria-busy="true" aria-label="Loading the form">
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="h-2.5 bg-brand/30"></div>
          <div class="space-y-3 px-6 py-6">
            <div class="h-7 w-2/3 animate-pulse rounded bg-slate-200"></div>
            <div class="h-4 w-full animate-pulse rounded bg-slate-100"></div>
            <div class="h-4 w-4/5 animate-pulse rounded bg-slate-100"></div>
          </div>
        </div>
        <div v-for="n in 2" :key="n" class="space-y-4 rounded-lg border border-slate-200 bg-white px-6 py-6">
          <div class="h-5 w-1/2 animate-pulse rounded bg-slate-200"></div>
          <div class="h-px w-1/2 bg-slate-200"></div>
        </div>
      </div>

      <section v-else-if="state === 'missing' || state === 'error'" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="h-2.5 bg-brand"></div>
        <div class="px-6 py-12 text-center">
          <i class="fa-solid fa-link-slash text-3xl text-slate-300" aria-hidden="true"></i>
          <h1 class="mt-4 font-display text-xl font-semibold text-slate-900">
            {{ state === 'missing' ? 'This form could not be found' : 'The form did not load' }}
          </h1>
          <p class="mx-auto mt-2 max-w-sm text-slate-600">
            {{ state === 'missing' ? 'Check the link you were given, or ask the person who shared it.' : 'Check your connection and try again.' }}
          </p>
          <button
            v-if="state === 'error'"
            type="button"
            class="mt-6 cursor-pointer rounded-md bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-ink"
            @click="$router.go(0)"
          >
            Try again
          </button>
        </div>
      </section>

      <template v-else-if="form">
        <img
          v-if="form.bannerUrl"
          :src="form.bannerUrl"
          alt=""
          class="aspect-[4/1] w-full rounded-lg border border-slate-200 bg-white object-cover"
        />

        <!-- Title card -->
        <header class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="h-2.5 bg-brand"></div>
          <div class="px-6 pb-5 pt-6">
            <div v-if="form.logos.length" class="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <img
                v-for="(logo, i) in form.logos"
                :key="logo"
                :src="logo"
                :alt="`Partner logo ${i + 1}`"
                class="h-10 w-auto max-w-[140px] object-contain sm:h-12"
              />
            </div>
            <h1 class="font-display text-[26px] font-semibold leading-tight text-slate-900 sm:text-[30px]">{{ form.title }}</h1>
            <!-- eslint-disable-next-line vue/no-v-html -- cleaned twice: by the API, and by DOMPurify here -->
            <div
              v-if="descriptionHtml && state !== 'sent'"
              class="mt-3 text-[15px] leading-relaxed text-slate-700 [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-brand-ink [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:mt-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_p:empty]:hidden [&_strong]:font-semibold [&_strong]:text-slate-900 [&_ul]:mb-3 [&_ul]:ml-5 [&_ul]:list-disc"
              v-html="descriptionHtml"
            ></div>
          </div>

          <div v-if="state === 'sent'" class="border-t border-slate-200 px-6 py-6" role="status">
            <p class="flex items-start gap-3 text-[15px] text-slate-800">
              <i class="fa-solid fa-circle-check mt-0.5 text-xl text-emerald-600" aria-hidden="true"></i>
              <span class="whitespace-pre-line">{{ sentMessage }}</span>
            </p>
            <button
              v-if="!form.onePerEmail"
              type="button"
              class="mt-5 cursor-pointer text-sm font-medium text-brand underline-offset-4 hover:underline"
              @click="startAgain"
            >
              Send another response
            </button>
          </div>

          <div v-else-if="!form.accepting" class="border-t border-slate-200 px-6 py-6">
            <p class="flex items-start gap-3 text-[15px] text-slate-800">
              <i class="fa-solid fa-lock mt-0.5 text-lg text-slate-400" aria-hidden="true"></i>
              <span class="whitespace-pre-line">{{ form.closedMessage }}</span>
            </p>
          </div>

          <p v-else-if="hasRequired" class="border-t border-slate-200 px-6 py-3 text-sm text-red-600">* Indicates required question</p>
        </header>

        <form v-if="state === 'ready' && form.accepting" novalidate class="space-y-3" @submit.prevent="submit">
          <div
            v-if="form.collectEmail"
            id="q-email"
            class="group relative rounded-lg border bg-white px-6 py-6"
            :class="errors.email ? 'border-red-300' : 'border-slate-200'"
          >
            <span
              aria-hidden="true"
              class="absolute inset-y-0 left-0 w-1.5 rounded-l-lg transition-opacity"
              :class="errors.email ? 'bg-red-500 opacity-100' : 'bg-brand-light opacity-0 group-focus-within:opacity-100'"
            ></span>
            <label for="respondent-email" class="block text-base font-medium text-slate-900">
              Email<span class="ml-1 text-red-600" aria-hidden="true">*</span><span class="sr-only">(required)</span>
            </label>
            <p v-if="form.onePerEmail" class="mt-1 text-sm text-slate-500">Each email can send one response.</p>
            <input
              id="respondent-email"
              v-model="email"
              type="email"
              autocomplete="email"
              maxlength="191"
              placeholder="Your email"
              :aria-invalid="!!errors.email"
              :aria-describedby="errors.email ? 'respondent-email-error' : undefined"
              class="mt-4 block w-full border-0 border-b bg-transparent px-0 pb-1.5 pt-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-b-2 focus:pb-[5px] focus:outline-none sm:max-w-md"
              :class="errors.email ? 'border-red-500' : 'border-slate-300 hover:border-slate-400 focus:border-brand'"
            />
            <p v-if="errors.email" id="respondent-email-error" class="mt-4 flex items-center gap-2 text-sm text-red-600">
              <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ errors.email }}
            </p>
          </div>

          <FormFieldInput
            v-for="field in form.fields"
            :key="field.id"
            :model-value="answers[field.id] ?? (field.type === 'checkboxes' ? [] : '')"
            :file="files[field.id] ?? null"
            :field="field"
            :error="errors[field.id]"
            @update:model-value="(v) => (answers[field.id] = v)"
            @update:file="(f) => (files[field.id] = f)"
          />

          <!-- People never see this; bots fill it in and are quietly turned away. -->
          <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label for="website">Website</label>
            <input id="website" v-model="website" type="text" name="website" tabindex="-1" autocomplete="off" />
          </div>

          <p v-if="submitError" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            <i class="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>{{ submitError }}
          </p>

          <div class="flex items-center justify-between gap-4 pt-1">
            <button
              type="submit"
              :disabled="sending"
              class="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-ink disabled:cursor-wait disabled:opacity-70"
            >
              <i v-if="sending" class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              {{ sending ? 'Sending…' : 'Submit' }}
            </button>
            <span v-if="confirmingClear" class="flex items-center gap-3 text-sm">
              <span class="text-slate-600">Clear all answers?</span>
              <button type="button" class="cursor-pointer font-medium text-red-600 hover:underline" @click="clearForm">Clear</button>
              <button type="button" class="cursor-pointer font-medium text-slate-600 hover:underline" @click="confirmingClear = false">Keep</button>
            </span>
            <button
              v-else
              type="button"
              class="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-brand hover:bg-white/70"
              @click="confirmingClear = true"
            >
              Clear form
            </button>
          </div>
        </form>
      </template>

      <footer v-if="state !== 'loading'" class="space-y-2 pb-6 pt-6 text-center text-xs text-slate-500">
        <p>Never share passwords or bank details through a form.</p>
        <p>
          This form was shared through
          <a :href="siteLinks.site" class="font-display text-sm font-semibold text-slate-600 hover:text-brand">Linkskool</a>
        </p>
      </footer>
    </main>
  </div>
</template>
