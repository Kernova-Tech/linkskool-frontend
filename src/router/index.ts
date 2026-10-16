import { createRouter, createWebHistory } from 'vue-router'

import CourseDetailPage from '@/views/CourseDetailPage.vue'
import FaqsPage from '@/views/FaqsPage.vue'
import ProgramEnrollmentPage from '@/views/ProgramEnrollmentPage.vue'
import ProgramPage from '@/views/ProgramPage.vue'
import LandingPage from '@/views/LandingPage.vue'
import NotFoundPage from '@/views/NotFoundPage.vue'
import PaymentCompletionPage from '@/views/PaymentCompletionPage.vue'
import PrivacyPolicyPage from '@/views/PrivacyPolicyPage.vue'
import ReservationCompletionPage from '@/views/ReservationCompletionPage.vue'
import ResetPasswordPage from '@/views/ResetPasswordPage.vue'
import TermsOfUsePage from '@/views/TermsOfUsePage.vue'
import NewsPage from '@/views/NewsPage.vue'
import NewsDetailPage from '@/views/NewsDetailPage.vue'
import ContactPage from '@/views/ContactPage.vue'
import AboutPage from '@/views/AboutPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '/programs/:s',
      name: 'program',
      component: ProgramPage,
    },
    {
      path: '/programs/:s/enroll',
      name: 'program-enrollment',
      component: ProgramEnrollmentPage,
    },
    {
      path: '/courses/:courseId',
      name: 'course-details',
      component: CourseDetailPage,
      props: (route) => {
        const raw = route.params.courseId
        const paramValue = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
        const courseId = Number.parseInt(paramValue, 10)
        return {
          courseId: Number.isFinite(courseId) ? courseId : 0,
        }
      },
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: PrivacyPolicyPage,
    },
    {
      path: '/terms-of-use',
      name: 'terms-of-use',
      component: TermsOfUsePage,
    },
    {
      path: '/faqs',
      name: 'faqs',
      component: FaqsPage,
    },
    {
      path: '/news',
      name: 'news',
      component: NewsPage,
    },
    {
      path: '/news/:slug',
      name: 'news-detail',
      component: NewsDetailPage,
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactPage,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage,
    },
    {
      path: '/updates',
      redirect: '/news',
    },
    {
      path: '/payment/completion',
      name: 'payment-completion',
      component: PaymentCompletionPage,
    },
    {
      path: '/reservation/completion',
      name: 'reservation-completion',
      component: ReservationCompletionPage,
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordPage,
    },
    {
      // Shared forms. Loaded on demand: most visitors never open one.
      path: '/f/:token([A-Za-z0-9]{10})',
      name: 'form',
      component: () => import('@/views/FormPage.vue'),
    },
    {
      // An organization's public leaderboard and its reward badges (leaderboard.linkskool.com).
      path: '/l/:token([A-Za-z0-9]{10})',
      name: 'leaderboard',
      component: () => import('@/views/leaderboard/LeaderboardPage.vue'),
    },
    {
      path: '/b/:code([A-Za-z0-9]{12})',
      name: 'badge',
      component: () => import('@/views/leaderboard/BadgePage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        top: 72,
        behavior: 'smooth',
      }
    }
    if (to.path !== from.path) {
      return {
        top: 0,
      }
    }
    return undefined
  },
})

export default router
