<script setup lang="ts">
import { computed } from 'vue'
import type { FormField } from '@/api/models'

/** One question of a shared form, drawn for its type. A section only titles what follows. */
const props = defineProps<{ field: FormField; error?: string }>()
const model = defineModel<string | string[]>({ default: '' })

const inputId = computed(() => `field-${props.field.id}`)
const describedBy = computed(
  () => [props.field.help ? `${inputId.value}-help` : '', props.error ? `${inputId.value}-error` : ''].filter(Boolean).join(' ') || undefined,
)

const box = computed(() => [
  'w-full rounded-xl border bg-white px-4 py-3 text-slate-900 transition focus:outline-none focus:ring-2',
  props.error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-brand-light focus:ring-brand-light',
])

const htmlType = computed(
  () => ({ email: 'email', phone: 'tel', number: 'number', date: 'date' })[props.field.type as 'email'] ?? 'text',
)

const picked = computed(() => (Array.isArray(model.value) ? model.value : []))
const toggle = (optionId: string, on: boolean) => {
  model.value = on ? [...picked.value, optionId] : picked.value.filter((id) => id !== optionId)
}
</script>

<template>
  <div v-if="field.type === 'section'" class="pt-4">
    <h2 class="text-xl font-bold text-slate-900">{{ field.label }}</h2>
    <p v-if="field.help" class="mt-1 whitespace-pre-line text-slate-600">{{ field.help }}</p>
  </div>

  <fieldset v-else-if="field.type === 'radio' || field.type === 'checkboxes'" :aria-describedby="describedBy">
    <legend class="text-base font-semibold text-slate-900">
      {{ field.label }} <span v-if="field.required" class="text-red-500" aria-label="required">*</span>
    </legend>
    <p v-if="field.help" :id="`${inputId}-help`" class="mt-1 text-sm text-slate-500">{{ field.help }}</p>
    <div class="mt-3 space-y-2">
      <label
        v-for="option in field.options ?? []"
        :key="option.id"
        class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-brand-light has-[:checked]:border-brand-light has-[:checked]:bg-brand-soft"
      >
        <input
          v-if="field.type === 'radio'"
          v-model="model"
          type="radio"
          :name="inputId"
          :value="option.id"
          class="h-4 w-4 accent-brand"
        />
        <input
          v-else
          type="checkbox"
          :value="option.id"
          :checked="picked.includes(option.id)"
          class="h-4 w-4 rounded accent-brand"
          @change="toggle(option.id, ($event.target as HTMLInputElement).checked)"
        />
        <span class="text-slate-800">{{ option.label }}</span>
      </label>
    </div>
    <p v-if="error" :id="`${inputId}-error`" class="mt-1.5 text-sm text-red-600">{{ error }}</p>
  </fieldset>

  <div v-else>
    <label :for="inputId" class="block text-base font-semibold text-slate-900">
      {{ field.label }} <span v-if="field.required" class="text-red-500" aria-label="required">*</span>
    </label>
    <p v-if="field.help" :id="`${inputId}-help`" class="mt-1 text-sm text-slate-500">{{ field.help }}</p>
    <div class="mt-2">
      <select v-if="field.type === 'dropdown'" :id="inputId" v-model="model" :class="box" :aria-describedby="describedBy" :aria-invalid="!!error">
        <option value="">Choose</option>
        <option v-for="option in field.options ?? []" :key="option.id" :value="option.id">{{ option.label }}</option>
      </select>
      <textarea
        v-else-if="field.type === 'paragraph'"
        :id="inputId"
        v-model="model"
        rows="4"
        maxlength="5000"
        :class="box"
        :aria-describedby="describedBy"
        :aria-invalid="!!error"
      ></textarea>
      <input
        v-else
        :id="inputId"
        v-model="model"
        :type="htmlType"
        :inputmode="field.type === 'phone' ? 'tel' : field.type === 'number' ? 'decimal' : undefined"
        :autocomplete="field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : undefined"
        maxlength="500"
        :class="box"
        :aria-describedby="describedBy"
        :aria-invalid="!!error"
      />
    </div>
    <p v-if="error" :id="`${inputId}-error`" class="mt-1.5 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
