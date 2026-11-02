<script setup lang="ts">
import { reactive } from 'vue'
import { RouterLink } from 'vue-router'
import type { CourseDetail } from '@/api/models'

const props = defineProps<{
    courseDetail: CourseDetail
    /** register: a paid course, paid for after registering. free: nothing to pay. */
    mode: 'register' | 'free'
    submitError?: string
    isSubmitting?: boolean
}>()

const emit = defineEmits<{
    close: []
    submit: [formData: EnrollmentFormData]
}>()

interface EnrollmentFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
}

const formData = reactive<EnrollmentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
})

const errors = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
})

const validateForm = (): boolean => {
    let isValid = true

    // Reset errors
    errors.firstName = ''
    errors.lastName = ''
    errors.email = ''
    errors.phone = ''

    // First Name
    if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required'
        isValid = false
    }

    // Last Name
    if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required'
        isValid = false
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
        errors.email = 'Email is required'
        isValid = false
    } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email'
        isValid = false
    }

    // Phone
    const phoneRegex = /^[\d\s\-+()]+$/
    if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required'
        isValid = false
    } else if (!phoneRegex.test(formData.phone) || formData.phone.replace(/\D/g, '').length < 10) {
        errors.phone = 'Please enter a valid phone number'
        isValid = false
    }

    return isValid
}

const handleSubmit = async () => {
    if (!validateForm()) return
    emit('submit', { ...formData })
}
</script>

<template>
    <div class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
        <div
            class="relative max-h-[92dvh] w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-scale-in sm:rounded-2xl">
            <!-- Header -->
            <div class="relative bg-slate-950 px-5 py-5 text-white sm:px-8 sm:py-6">
                <button @click="emit('close')"
                    class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                    aria-label="Close">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>

                <h2 class="text-2xl font-bold mb-2">Register for this course</h2>
                <p class="text-blue-100">{{ courseDetail.course.courseName }}</p>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8">
                <div class="space-y-6">
                    <div v-if="props.submitError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {{ props.submitError }}
                    </div>

                    <!-- Name Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- First Name -->
                        <div>
                            <label for="firstName" class="block text-sm font-semibold text-slate-700 mb-2">
                                First Name <span class="text-red-500">*</span>
                            </label>
                            <input id="firstName" v-model="formData.firstName" type="text" :class="[
                                'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all',
                                errors.firstName
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-slate-300 focus:ring-brand-light focus:border-brand-light'
                            ]" placeholder="John" />
                            <p v-if="errors.firstName" class="mt-1.5 text-sm text-red-600">{{ errors.firstName }}</p>
                        </div>

                        <!-- Last Name -->
                        <div>
                            <label for="lastName" class="block text-sm font-semibold text-slate-700 mb-2">
                                Last Name <span class="text-red-500">*</span>
                            </label>
                            <input id="lastName" v-model="formData.lastName" type="text" :class="[
                                'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all',
                                errors.lastName
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-slate-300 focus:ring-brand-light focus:border-brand-light'
                            ]" placeholder="Doe" />
                            <p v-if="errors.lastName" class="mt-1.5 text-sm text-red-600">{{ errors.lastName }}</p>
                        </div>
                    </div>

                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-sm font-semibold text-slate-700 mb-2">
                            Email Address <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i class="fa-solid fa-envelope text-slate-400"></i>
                            </div>
                            <input id="email" v-model="formData.email" type="email" :class="[
                                'w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all',
                                errors.email
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-slate-300 focus:ring-brand-light focus:border-brand-light'
                            ]" placeholder="john.doe@example.com" />
                        </div>
                        <p v-if="errors.email" class="mt-1.5 text-sm text-red-600">{{ errors.email }}</p>
                    </div>

                    <!-- Phone -->
                    <div>
                        <label for="phone" class="block text-sm font-semibold text-slate-700 mb-2">
                            Phone Number <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i class="fa-solid fa-phone text-slate-400"></i>
                            </div>
                            <input id="phone" v-model="formData.phone" type="tel" :class="[
                                'w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all',
                                errors.phone
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-slate-300 focus:ring-brand-light focus:border-brand-light'
                            ]" placeholder="+234 801 234 5678" />
                        </div>
                        <p v-if="errors.phone" class="mt-1.5 text-sm text-red-600">{{ errors.phone }}</p>
                    </div>

                    <p class="text-xs text-slate-500">
                        By registering, you agree to our
                        <RouterLink to="/terms-of-use" class="underline hover:text-brand" target="_blank">Terms</RouterLink>
                        and
                        <RouterLink to="/privacy-policy" class="underline hover:text-brand" target="_blank">Privacy Policy</RouterLink>.
                    </p>
                </div>

                <!-- Actions -->
                <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
                    <button type="button" @click="emit('close')"
                        class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" :disabled="props.isSubmitting" :class="[
                        'flex-1 px-6 py-3 bg-brand text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer',
                        props.isSubmitting
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-brand-ink'
                    ]">
                        <i v-if="props.isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
                        <span v-else>{{ mode === 'free' ? 'Register for free' : 'Register' }}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes scale-in {
    from {
        opacity: 0;
        transform: scale(0.9);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fade-in {
    animation: fade-in 0.2s ease-out;
}

.animate-scale-in {
    animation: scale-in 0.3s ease-out;
}
</style>
