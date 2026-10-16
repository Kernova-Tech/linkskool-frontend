/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google's web client ID, for Sign in with Google on forms. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_ADSENSE_CLIENT_ID?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_TOP_SLOT?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_INLINE_SLOT?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_BOTTOM_SLOT?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_DETAIL_HERO_SLOT?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_DETAIL_TOP_SLOT?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_DETAIL_SLOT?: string
  readonly VITE_GOOGLE_ADSENSE_NEWS_DETAIL_BOTTOM_SLOT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
