import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  srcDir: 'src/',

  modules: ['@nuxtjs/sitemap', '@pinia/nuxt'],

  css: [
    '@fortawesome/fontawesome-free/css/all.css',
    '@/assets/styles/index.css',
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  // Public site URL used by @nuxtjs/sitemap and canonical defaults
  site: {
    url: 'https://linkskool.com',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      bodyAttrs: {
        class: 'font-inter min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300',
      },
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'alternate icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'mask-icon', href: '/favicon.ico', color: '#0f172a' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Poppins:wght@400;600&family=Playfair+Display:wght@600;800&display=swap',
        },
      ],
      meta: [
        { name: 'theme-color', content: '#0f172a' },
        { name: 'author', content: 'Linkskool' },
        {
          name: 'robots',
          content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
        },
        { property: 'og:site_name', content: 'Linkskool' },
        { property: 'og:locale', content: 'en_NG' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:creator', content: '@linkskool' },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: 'Linkskool Online Ventures Limited',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Enugu',
              addressCountry: 'NG',
            },
            telephone: '+234907694303',
            email: 'info@linkskool.com',
            url: 'https://linkskool.com',
            image: 'https://linkskool.com/assets/og-image.png',
          }),
        },
      ],
    },
  },

  // Hybrid rendering: prerender static marketing/legal pages at build time,
  // stale-while-revalidate cache the dynamic news routes so crawlers always
  // receive fully-rendered HTML with correct per-page meta tags.
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/contact': { prerender: true },
    '/faqs': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/terms-of-use': { prerender: true },
    '/news': { swr: 3600 },
    '/news/**': { swr: 3600 },
    '/updates': { redirect: '/news' },
  },
})
