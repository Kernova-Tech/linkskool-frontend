<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { FormField } from '@/api/models'
import { FILE_KINDS, formatSize } from './fileKinds'

/**
 * One question of a shared form, in its own card, drawn for its type. A
 * section is a card with a heading instead of a question.
 */
const props = defineProps<{ field: FormField; error?: string }>()
const model = defineModel<string | string[]>({ default: '' })
const files = defineModel<File[]>('files', { default: () => [] })

const inputId = computed(() => `field-${props.field.id}`)
const describedBy = computed(
  () => [props.field.help ? `${inputId.value}-help` : '', props.error ? `${inputId.value}-error` : ''].filter(Boolean).join(' ') || undefined,
)

const picked = computed(() => (Array.isArray(model.value) ? model.value : []))
const toggle = (optionId: string, on: boolean) => {
  model.value = on ? [...picked.value, optionId] : picked.value.filter((id) => id !== optionId)
}

const kind = computed(() => FILE_KINDS[props.field.accept ?? 'documents'])
const maxFiles = computed(() => props.field.maxFiles ?? 1)
const fileInput = ref<HTMLInputElement | null>(null)
/** Picked files join the list, up to the question's limit; one file replaces one. */
const onFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  const picked = Array.from(target.files ?? [])
  files.value = maxFiles.value === 1 ? picked.slice(0, 1) : [...files.value, ...picked].slice(0, maxFiles.value)
  target.value = ''
}
const removeFile = (i: number) => {
  files.value = files.value.filter((_, at) => at !== i)
}

// A small preview of each picture, so people can see they chose the right one.
const previews = ref<(string | null)[]>([])
watch(
  files,
  (list) => {
    previews.value.forEach((url) => url && URL.revokeObjectURL(url))
    previews.value = list.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null))
  },
  { immediate: true },
)
onUnmounted(() => previews.value.forEach((url) => url && URL.revokeObjectURL(url)))

// Underlined like a line on paper; thicker in the brand colour while typing.
const line = computed(() => [
  'block w-full border-0 border-b bg-transparent px-0 pb-1.5 pt-2 text-[15px] text-slate-900 placeholder:text-slate-400',
  'focus:border-b-2 focus:pb-[5px] focus:outline-none',
  props.error ? 'border-red-500 focus:border-red-600' : 'border-slate-300 hover:border-slate-400 focus:border-brand',
])
</script>

<template>
  <!-- Section: a heading card, collecting nothing. -->
  <section v-if="field.type === 'section'" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <h2 class="bg-brand px-6 py-3 font-display text-lg font-semibold text-white">{{ field.label }}</h2>
    <p v-if="field.help" class="whitespace-pre-line px-6 py-4 text-[15px] leading-relaxed text-slate-700">{{ field.help }}</p>
  </section>

  <div
    v-else
    :id="`q-${field.id}`"
    class="group relative rounded-lg border bg-white px-6 py-6 transition-colors"
    :class="error ? 'border-red-300' : 'border-slate-200'"
  >
    <!-- The edge that shows which question is being answered, or which needs fixing. -->
    <span
      aria-hidden="true"
      class="absolute inset-y-0 left-0 w-1.5 rounded-l-lg transition-opacity"
      :class="error ? 'bg-red-500 opacity-100' : 'bg-brand-light opacity-0 group-focus-within:opacity-100'"
    ></span>

    <fieldset v-if="field.type === 'radio' || field.type === 'checkboxes'" :aria-describedby="describedBy" :aria-invalid="!!error">
      <legend class="text-base font-medium leading-snug text-slate-900">
        {{ field.label }}<span v-if="field.required" class="ml-1 text-red-600" aria-hidden="true">*</span>
        <span v-if="field.required" class="sr-only">(required)</span>
      </legend>
      <p v-if="field.help" :id="`${inputId}-help`" class="mt-1 text-sm text-slate-500">{{ field.help }}</p>
      <div class="mt-4 space-y-1">
        <label
          v-for="option in field.options ?? []"
          :key="option.id"
          class="-mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
        >
          <input
            v-if="field.type === 'radio'"
            v-model="model"
            type="radio"
            :name="inputId"
            :value="option.id"
            class="h-5 w-5 flex-none cursor-pointer accent-brand"
          />
          <input
            v-else
            type="checkbox"
            :value="option.id"
            :checked="picked.includes(option.id)"
            class="h-[18px] w-[18px] flex-none cursor-pointer rounded accent-brand"
            @change="toggle(option.id, ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-[15px] text-slate-800">{{ option.label }}</span>
        </label>
      </div>
      <button
        v-if="field.type === 'radio' && model && !field.required"
        type="button"
        class="mt-2 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-800"
        @click="model = ''"
      >
        Clear selection
      </button>
    </fieldset>

    <template v-else>
      <label :for="inputId" class="block text-base font-medium leading-snug text-slate-900">
        {{ field.label }}<span v-if="field.required" class="ml-1 text-red-600" aria-hidden="true">*</span>
        <span v-if="field.required" class="sr-only">(required)</span>
      </label>
      <p v-if="field.help" :id="`${inputId}-help`" class="mt-1 text-sm text-slate-500">{{ field.help }}</p>

      <div class="mt-4">
        <select
          v-if="field.type === 'dropdown'"
          :id="inputId"
          v-model="model"
          class="w-full cursor-pointer rounded-md border bg-white px-3 py-2.5 text-[15px] text-slate-900 focus:outline-none focus:ring-2 sm:w-72"
          :class="error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:border-brand focus:ring-brand-light/40'"
          :aria-describedby="describedBy"
          :aria-invalid="!!error"
        >
          <option value="">Choose</option>
          <option v-for="option in field.options ?? []" :key="option.id" :value="option.id">{{ option.label }}</option>
        </select>

        <textarea
          v-else-if="field.type === 'paragraph'"
          :id="inputId"
          v-model="model"
          rows="3"
          maxlength="5000"
          placeholder="Your answer"
          class="resize-y"
          :class="line"
          :aria-describedby="describedBy"
          :aria-invalid="!!error"
        ></textarea>

        <input
          v-else-if="field.type === 'date'"
          :id="inputId"
          v-model="model"
          type="date"
          class="w-full rounded-md border bg-white px-3 py-2.5 text-[15px] text-slate-900 focus:outline-none focus:ring-2 sm:w-56"
          :class="error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:border-brand focus:ring-brand-light/40'"
          :aria-describedby="describedBy"
          :aria-invalid="!!error"
        />

        <div v-else-if="field.type === 'file'">
          <input
            :id="inputId"
            ref="fileInput"
            type="file"
            class="sr-only"
            :accept="kind.accept"
            :multiple="maxFiles > 1"
            :aria-describedby="describedBy"
            :aria-invalid="!!error"
            @change="onFile"
          />
          <ul v-if="files.length" class="mb-3 space-y-2">
            <li
              v-for="(f, i) in files"
              :key="`${f.name}-${f.size}-${i}`"
              class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <img v-if="previews[i]" :src="previews[i]!" alt="" class="h-10 w-10 shrink-0 rounded object-cover" />
              <i v-else class="fa-solid fa-file-lines w-10 text-center text-lg text-brand" aria-hidden="true"></i>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-slate-900">{{ f.name }}</span>
                <span class="block text-xs text-slate-500">{{ formatSize(f.size) }}</span>
              </span>
              <button
                type="button"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                :aria-label="`Remove ${f.name}`"
                @click="removeFile(i)"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </li>
          </ul>
          <button
            v-if="files.length < maxFiles"
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition"
            :class="error ? 'border-red-400 text-red-700 hover:bg-red-50' : 'border-slate-300 text-brand hover:border-brand hover:bg-brand-soft'"
            @click="fileInput?.click()"
          >
            <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>
            {{ files.length ? 'Add another' : maxFiles > 1 ? 'Add files' : 'Add file' }}
          </button>
          <p class="mt-2 text-xs text-slate-500">
            {{ kind.label }} · up to {{ field.maxMb ?? 5 }} MB each<template v-if="maxFiles > 1"> · up to {{ maxFiles }} files ({{ files.length }} added)</template>
          </p>
        </div>

        <input
          v-else
          :id="inputId"
          v-model="model"
          :type="{ email: 'email', phone: 'tel', number: 'number' }[field.type as 'email'] ?? 'text'"
          :inputmode="field.type === 'phone' ? 'tel' : field.type === 'number' ? 'decimal' : undefined"
          :autocomplete="field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'off'"
          maxlength="500"
          placeholder="Your answer"
          class="sm:max-w-md"
          :class="line"
          :aria-describedby="describedBy"
          :aria-invalid="!!error"
        />
      </div>
    </template>

    <p v-if="error" :id="`${inputId}-error`" class="mt-4 flex items-center gap-2 text-sm text-red-600">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
    </p>
  </div>
</template>
