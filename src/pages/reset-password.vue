<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import { authService } from '@/api/services/auth.service'

const route = useRoute()

const token = computed(() => {
  const raw = route.query.token
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
})

const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const appLoginUrl =
  (import.meta.env.VITE_LINKSKOOL_APP_LOGIN_URL as string | undefined)?.trim() ||
  'https://linkskool.com/login?source=reset-password&status=success'

const submit = async () => {
  error.value = ''
  if (!newPassword.value) {
    error.value = 'Please enter a new password.'
    return
  }
  if (newPassword.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await authService.resetPassword({
      token: token.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })
    success.value = true
  } catch {
    error.value = 'Failed to reset password. The link may have expired.'
  } finally {
    loading.value = false
  }
}

const goToAppLogin = () => {
  window.location.assign(appLoginUrl)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <!-- Hero banner -->
    <section class="pt-24 pb-12 bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-3">Reset Your Password</h1>
        <p class="text-lg text-blue-100 max-w-xl mx-auto">
          Choose a strong new password to secure your account.
        </p>
      </div>
    </section>

    <!-- Card -->
    <section class="py-16 px-4">
      <div class="max-w-md mx-auto">

        <!-- Success -->
        <div v-if="success" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i class="fa-solid fa-shield-halved text-green-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
          <p class="text-gray-600 mb-8">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <button
            class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            @click="goToAppLogin">
            Open App to Login
          </button>
        </div>

        <!-- Form -->
        <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div class="text-center mb-8">
            <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-lock-open text-blue-600 text-xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Set a new password</h2>
            <p class="text-gray-500 mt-1 text-sm">Enter and confirm your new password below.</p>
          </div>

          <form @submit.prevent="submit" novalidate>
            <!-- New password -->
            <div class="mb-5">
              <label class="block text-sm font-medium text-gray-700 mb-1.5" for="new-password">
                New password
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <i class="fa-solid fa-lock text-sm"></i>
                </span>
                <input id="new-password" v-model="newPassword" :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password" placeholder="Min. 8 characters"
                  class="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition" />
                <button type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  @click="showNewPassword = !showNewPassword">
                  <i :class="showNewPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-sm"></i>
                </button>
              </div>
            </div>

            <!-- Confirm password -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1.5" for="confirm-password">
                Confirm password
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <i class="fa-solid fa-lock text-sm"></i>
                </span>
                <input id="confirm-password" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password" placeholder="Repeat your password"
                  class="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition" />
                <button type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword">
                  <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-sm"></i>
                </button>
              </div>
            </div>

            <!-- Error -->
            <p v-if="error" class="text-sm text-red-600 mb-4 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-exclamation"></i>
              {{ error }}
            </p>

            <button type="submit" :disabled="loading"
              class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <i class="fa-solid fa-circle-notch animate-spin"></i>
                Resetting…
              </span>
              <span v-else>Reset Password</span>
            </button>
          </form>
        </div>

      </div>
    </section>

    <AppFooter />
  </div>
</template>
