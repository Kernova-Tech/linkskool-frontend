/** Single source of truth for outbound LinkSkool destinations. */
export const siteLinks = {
  /** The main site, for pages served from another host such as forms.linkskool.com. */
  site: 'https://linkskool.com',
  app: 'https://app.linkskool.com',
  teachflow: 'https://app.linkskool.com/#/teachflow',
  androidApp: import.meta.env.VITE_LINKSKOOL_ANDROID_APP_URL as string | undefined,
  iosApp: import.meta.env.VITE_LINKSKOOL_IOS_APP_URL as string | undefined,
  desktopApp: import.meta.env.VITE_LINKSKOOL_DESKTOP_APP_URL as string | undefined,
} as const
