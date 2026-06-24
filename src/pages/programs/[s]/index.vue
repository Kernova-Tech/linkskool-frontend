<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import CourseCard from '@/components/CourseCard.vue'
import type { Course, Program } from '@/api/models'
import { programService } from '@/api/services'
import { usePageMeta } from '@/composables/usePageMeta'

const route = useRoute()

const program = ref<Program | null>(null)
const courses = ref<Course[]>([])
const isLoading = ref(false)
const loadError = ref('')

const programRef = computed(() => {
  const value = route.params.s
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
})

const enrollProgramPath = computed(() => {
  if (!programRef.value || courses.value.length === 0) {
    return ''
  }
  return `/programs/${programRef.value}/enroll`
})

// Dynamic meta tags based on program data
usePageMeta(() => ({
  title: program.value
    ? `${program.value.name} | Learn with Linkskool`
    : 'Program | Linkskool',
  description: program.value?.description || 'Explore our comprehensive learning program with expert-curated courses.',
  keywords: `${program.value?.name || 'program'}, online courses, skill development, professional training`,
  url: `https://linkskool.com/programs/${programRef.value}`,
  image: 'https://linkskool.com/assets/og-image.png',
  type: 'website',
}))

const fetchProgramCourses = async () => {
  isLoading.value = true
  loadError.value = ''
  program.value = null
  courses.value = []

  if (!programRef.value) {
    loadError.value = 'Program reference is missing in the URL.'
    isLoading.value = false
    return
  }

  try {
    const response = await programService.getProgramCourses(programRef.value)
    program.value = response.program
    courses.value = response.courses
  } catch (error) {
    console.error('Failed to fetch program courses:', error)
    loadError.value = 'Unable to load this program right now.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProgramCourses()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <section class="pt-24 pb-12 bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="isLoading" class="animate-pulse">
          <div class="h-12 bg-white/20 rounded-lg w-2/3 mb-4"></div>
          <div class="h-6 bg-white/20 rounded-lg w-1/2"></div>
        </div>

        <div v-else-if="program" class="max-w-4xl">
          <nav class="flex items-center gap-2 text-blue-100 mb-6">
            <RouterLink to="/" class="hover:text-white transition-colors">Home</RouterLink>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <RouterLink to="/#programs" class="hover:text-white transition-colors">Programs</RouterLink>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white">{{ program.name }}</span>
          </nav>

          <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">
            {{ program.name }}
          </h1>
          <p class="text-xl text-blue-100 mb-8 leading-relaxed">
            {{ program.description }}
          </p>

          <div class="flex flex-wrap gap-6 text-white">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-book"></i>
              <span>{{ courses.length }} Courses</span>
            </div>
            <RouterLink v-if="enrollProgramPath" :to="enrollProgramPath"
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-bold text-lg shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-200">
              <span>Enroll</span>
              <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
            <button v-else type="button" disabled
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/60 text-blue-300 font-bold text-lg cursor-not-allowed">
              <span>Enroll</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div v-else class="max-w-4xl">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-4">Program not found</h1>
          <p class="text-blue-100">{{ loadError || 'Please check the program link and try again.' }}</p>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            Courses in this Program
          </h2>
          <p class="text-gray-600">
            Complete all courses to master this skill path
          </p>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="i in 6" :key="i" class="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
        </div>

        <div v-else-if="courses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CourseCard v-for="course in courses" :key="course.courseId" :course="course" />
        </div>

        <div v-else class="text-center py-16">
          <i class="fa-solid fa-book-open text-6xl text-gray-300 mb-4"></i>
          <p class="text-xl text-gray-500">{{ loadError || 'No courses available yet' }}</p>
        </div>
      </div>
    </section>

    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">
            You Might Also Like
          </h2>
          <p class="text-gray-600">
            Explore other programs to expand your skills
          </p>
        </div>

        <div class="flex justify-center">
          <RouterLink to="/#programs"
            class="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 group">
            <span>View All Programs</span>
            <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </RouterLink>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
