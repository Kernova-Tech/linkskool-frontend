import DOMPurify from 'dompurify'

type Sanitizer = { sanitize: (source: string, config?: Record<string, unknown>) => string }

/**
 * DOMPurify needs a DOM to run. In the browser it uses the real `window`;
 * during SSR/prerender there is no DOM, so we back it with a jsdom window.
 * This keeps HTML sanitisation identical on the server and the client, which
 * is required now that news/FAQ content is rendered server-side.
 */
let purifier: Sanitizer = DOMPurify as unknown as Sanitizer

if (import.meta.server) {
  const { JSDOM } = await import('jsdom')
  const { window } = new JSDOM('')
  purifier = DOMPurify(window as unknown as Window & typeof globalThis) as unknown as Sanitizer
}

export const sanitizeHtml = (html: string, config?: Record<string, unknown>): string =>
  purifier.sanitize(html, config)
