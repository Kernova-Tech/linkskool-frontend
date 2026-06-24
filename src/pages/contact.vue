<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import { useContactForm } from '@/composables/useContactForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { contactChannels, contactReasons, officeDetails } from '@/data/contact'

usePageMeta({
  title: 'Contact LinkSkool',
  description:
    'Contact LinkSkool for enrollment support, payment questions, partnerships, program enquiries, and technical help.',
  keywords: 'contact LinkSkool, LinkSkool support, enrollment help, program support',
  url: 'https://linkskool.com/contact',
  image: 'https://linkskool.com/assets/og-image.png',
  type: 'website',
})

const { errors, form, submit } = useContactForm()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="pt-28">
      <section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <p class="text-sm font-bold uppercase tracking-wide text-blue-700">Contact</p>
          <h1 class="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
            Get the right help faster.
          </h1>
          <p class="mt-5 text-lg leading-8 text-slate-600">
            Choose a direct contact path or send a short message. We route support requests by topic
            so the right team can respond.
          </p>
        </div>

        <div class="mt-12 grid gap-4 md:grid-cols-3">
          <a
            v-for="channel in contactChannels"
            :key="channel.title"
            :href="channel.href"
            class="group rounded-md border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-md" :class="channel.accent">
              <i :class="channel.icon"></i>
            </span>
            <h2 class="mt-5 text-lg font-black text-slate-950">{{ channel.title }}</h2>
            <p class="mt-2 min-h-12 text-sm leading-6 text-slate-600">{{ channel.description }}</p>
            <p class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
              {{ channel.action }}
              <i class="fa-solid fa-arrow-right text-xs transition group-hover:translate-x-0.5"></i>
            </p>
          </a>
        </div>

        <div class="mt-12 grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <aside class="space-y-4">
            <div class="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h2 class="text-xl font-black text-slate-950">Office</h2>
              <dl class="mt-5 space-y-4 text-sm">
                <div>
                  <dt class="font-bold text-slate-500">Location</dt>
                  <dd class="mt-1 text-slate-900">{{ officeDetails.location }}</dd>
                </div>
                <div>
                  <dt class="font-bold text-slate-500">Email</dt>
                  <dd class="mt-1">
                    <a :href="`mailto:${officeDetails.email}`" class="font-semibold text-blue-700 hover:text-blue-900">
                      {{ officeDetails.email }}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt class="font-bold text-slate-500">Response</dt>
                  <dd class="mt-1 text-slate-900">{{ officeDetails.responseTime }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-md border border-blue-100 bg-blue-50 p-6">
              <h2 class="text-base font-black text-slate-950">Before you write</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Include your program name, payment reference, or cohort details when relevant.
              </p>
            </div>
          </aside>

          <form class="rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:p-8" @submit.prevent="submit">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="contact-name" class="text-sm font-bold text-slate-700">Name</label>
                <input
                  id="contact-name"
                  v-model="form.name"
                  type="text"
                  autocomplete="name"
                  class="mt-2 w-full rounded-md border px-4 py-3 text-sm outline-none transition focus:ring-2"
                  :class="errors.name ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'"
                />
                <p v-if="errors.name" class="mt-1 text-xs font-semibold text-red-600">{{ errors.name }}</p>
              </div>

              <div>
                <label for="contact-email" class="text-sm font-bold text-slate-700">Email</label>
                <input
                  id="contact-email"
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  class="mt-2 w-full rounded-md border px-4 py-3 text-sm outline-none transition focus:ring-2"
                  :class="errors.email ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'"
                />
                <p v-if="errors.email" class="mt-1 text-xs font-semibold text-red-600">{{ errors.email }}</p>
              </div>
            </div>

            <div class="mt-5">
              <label for="contact-reason" class="text-sm font-bold text-slate-700">Reason</label>
              <select
                id="contact-reason"
                v-model="form.reason"
                class="mt-2 w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option v-for="reason in contactReasons" :key="reason" :value="reason">
                  {{ reason }}
                </option>
              </select>
            </div>

            <div class="mt-5">
              <label for="contact-message" class="text-sm font-bold text-slate-700">Message</label>
              <textarea
                id="contact-message"
                v-model="form.message"
                rows="7"
                class="mt-2 w-full resize-y rounded-md border px-4 py-3 text-sm leading-6 outline-none transition focus:ring-2"
                :class="errors.message ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'"
              ></textarea>
              <p v-if="errors.message" class="mt-1 text-xs font-semibold text-red-600">{{ errors.message }}</p>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs leading-5 text-slate-500">
                This opens your email app with the message prepared.
              </p>
              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 cursor-pointer"
              >
                Send message
                <i class="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>
