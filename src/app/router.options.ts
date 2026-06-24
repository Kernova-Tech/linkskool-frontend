import type { RouterConfig } from '@nuxt/schema'

// Preserves the scroll behaviour that the previous vue-router config used.
export default <RouterConfig>{
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
      return { top: 0 }
    }
    return undefined
  },
}
