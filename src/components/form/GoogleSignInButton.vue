<script setup lang="ts">
import { onMounted, ref } from 'vue'

/**
 * Google's own sign-in button. It hands back an ID token, which the API
 * checks with Google; nothing about the account is trusted from here.
 */
const emit = defineEmits<{ credential: [idToken: string] }>()

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''
const host = ref<HTMLElement | null>(null)
const failed = ref(!clientId)

type GoogleId = {
  initialize: (options: { client_id: string; callback: (r: { credential: string }) => void }) => void
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void
}

const loadScript = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as { google?: { accounts?: unknown } }).google?.accounts) return resolve()
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google sign-in did not load.'))
    document.head.appendChild(script)
  })

onMounted(async () => {
  if (!clientId) return
  try {
    await loadScript()
    const id = (window as unknown as { google: { accounts: { id: GoogleId } } }).google.accounts.id
    id.initialize({ client_id: clientId, callback: (r) => emit('credential', r.credential) })
    if (host.value) {
      id.renderButton(host.value, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 280 })
    }
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <div>
    <div ref="host" class="flex justify-center"></div>
    <p v-if="failed" class="text-center text-sm text-red-600">Google sign-in is not available right now. Please try again later.</p>
  </div>
</template>
