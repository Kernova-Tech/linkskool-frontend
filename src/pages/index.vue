<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import HeroSection from '@/components/HeroSection.vue'
import ProgramCard from '@/components/ProgramCard.vue'
import type { Program } from '@/api/models'
import { programService } from '@/api/services'
import { usePageMeta } from '@/composables/usePageMeta'

// Set page meta tags for SEO and social sharing
usePageMeta({
  title: 'Linkskool — Education Technology for Learning, Assessment & School Data',
  description: 'One connected platform for learning, assessments, school management, and education data across Africa. Built for schools, institutions, and learners.',
  keywords: 'education technology, learning management system, CBT, school management software, education data, Africa edtech, online courses',
  url: 'https://linkskool.com',
  image: 'https://linkskool.com/assets/og-image.png',
  type: 'website',
})

const programs = ref<Program[]>([])

const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const response = await programService.getAllPrograms()
    programs.value = response
  } catch (error) {
    console.error('Failed to fetch programs:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <!-- Hero Section -->
    <HeroSection />

    <!-- Programs Section -->
    <section id="programs" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-6">
            <i class="fa-solid fa-graduation-cap text-blue-600"></i>
            <span class="text-sm font-semibold text-blue-700">Learning Programs</span>
          </div>

          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Our Programs
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our carefully curated programs designed by industry experts
          </p>
        </div>

        <!-- Programs Grid -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="i in 6" :key="i" class="bg-gray-200 rounded-2xl h-96 animate-pulse"></div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProgramCard v-for="program in programs" :key="program.id" :program="program" />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose LinkSkool?
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to succeed in your learning journey
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Feature 1 -->
          <div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <i class="fa-solid fa-chalkboard-user text-blue-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Expert Instructors</h3>
            <p class="text-gray-600">Learn from industry professionals with years of real-world experience
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <i class="fa-solid fa-clock text-orange-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Flexible Learning</h3>
            <p class="text-gray-600">Study at your own pace with lifetime access to course materials</p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <i class="fa-solid fa-certificate text-green-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Certificates</h3>
            <p class="text-gray-600">Earn recognized certificates to showcase your achievements</p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <i class="fa-solid fa-users text-purple-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Community</h3>
            <p class="text-gray-600">Join a thriving community of learners and mentors worldwide</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-orange-600">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Start Learning?
        </h2>
        <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of students already learning on LinkSkool. Start your journey today.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            class="px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer">
            Browse All Courses
          </button>
          <button
            class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-blue-700 transition-all duration-200 cursor-pointer">
            Contact Sales
          </button>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
