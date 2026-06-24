<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { usePageMeta } from '@/composables/usePageMeta'

const router = useRouter()

// Set meta tags for 404 page
usePageMeta({
    title: '404 - Page Not Found | Linkskool',
    description: 'The page you are looking for could not be found. Return to our homepage to explore our learning programs.',
    keywords: 'page not found, 404 error',
    url: 'https://linkskool.com/404',
    image: 'https://linkskool.com/assets/og-image.png',
    type: 'website',
})

const goHome = () => {
    router.push('/')
}

const goBack = () => {
    router.back()
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />

        <main class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
            <div class="max-w-2xl w-full text-center">
                <!-- 404 Illustration -->
                <div class="mb-8">
                    <div class="inline-flex items-center justify-center">
                        <div class="relative">
                            <!-- Animated 404 -->
                            <h1
                                class="text-[150px] sm:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-600 leading-none animate-pulse">
                                404
                            </h1>

                            <!-- Floating icons -->
                            <div class="absolute -top-8 -left-8 animate-float">
                                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fa-solid fa-book-open text-2xl text-blue-600"></i>
                                </div>
                            </div>

                            <div class="absolute -bottom-4 -right-8 animate-float" style="animation-delay: 0.5s">
                                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <i class="fa-solid fa-graduation-cap text-xl text-orange-600"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error Message -->
                <div class="mb-8">
                    <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Oops! Page Not Found
                    </h2>
                    <p class="text-lg text-gray-600 mb-2">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    <p class="text-gray-500">
                        Don't worry, even the best explorers get lost sometimes!
                    </p>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button @click="goHome"
                        class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer">
                        <i class="fa-solid fa-home"></i>
                        <span>Back to Home</span>
                    </button>

                    <button @click="goBack"
                        class="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>Go Back</span>
                    </button>
                </div>

                <!-- Quick Links -->
                <div class="mt-16 pt-8 border-t border-gray-200">
                    <p class="text-sm text-gray-600 mb-4">Or explore these popular sections:</p>
                    <div class="flex flex-wrap gap-3 justify-center">
                        <RouterLink to="/#programs"
                            class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all">
                            <i class="fa-solid fa-graduation-cap mr-2"></i>
                            View Programs
                        </RouterLink>

                        <RouterLink to="/"
                            class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all">
                            <i class="fa-solid fa-book mr-2"></i>
                            Browse Courses
                        </RouterLink>

                        <a href="mailto:info@linkskool.com"
                            class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all">
                            <i class="fa-solid fa-envelope mr-2"></i>
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </main>

        <AppFooter />
    </div>
</template>

<style scoped>
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-20px);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}
</style>
