# SEO, Meta Tags & Deployment Guide

> **Updated 2026-06-24.** The app moved from a client-only Vue SPA to **Nuxt 4**.
> Previously, meta tags were set with JavaScript at runtime — but social scrapers
> (WhatsApp, Facebook, X, LinkedIn) and many crawlers don't run JavaScript, so
> every shared link previewed as the homepage. Now pages are **rendered to HTML
> on the server / at build time**, so the correct title, description, and image
> are in the raw HTML that scrapers read.

## How meta tags work now

- `usePageMeta()` (unchanged call signature) wraps Nuxt's `useHead` / `useSeoMeta`,
  so titles, description, canonical, Open Graph, and Twitter tags are rendered
  into the server HTML. Static pages get static meta; news pages get per-article
  meta driven by `useAsyncData` (which runs on the server).
- News article pages also emit **`NewsArticle` JSON-LD** for rich results.
- Each page sets its own `<link rel="canonical">`.

## Build & deploy (Vercel — current setup)

News is published continuously, so it must render **on request, not at build time**.
The app deploys to Vercel with **ISR** (incremental static regeneration):

- Marketing/legal pages: prerendered at deploy.
- `/news` and `/news/<slug>`: rendered on first request, cached at the edge, and
  revalidated automatically (`routeRules` in `nuxt.config.ts`: 5 min for the index,
  1 hour per article). **New articles appear with no rebuild.**
- `/sitemap.xml`: ISR, regenerated hourly from the live article list.
- `/programs/*`, `/courses/*`, enrolment, payment: client-rendered (no scraping needed).

### Steps

1. Push the repo to GitHub and import it in Vercel (framework auto-detected as Nuxt).
   Build command `npm run build`, output handled automatically.
2. In **Vercel → Settings → Environment Variables**, add the `VITE_*` values from
   `.env.production` (`VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_ASSET_BASE_URL`,
   AdSense / WhatsApp / app-store vars, etc.). `.env.production` is gitignored, so
   Vercel reads these from the dashboard, not the file.
3. Point `linkskool.com` DNS to Vercel.

### The API (important — it currently lives at linkskool.com/api)

Once `linkskool.com` points to Vercel, the cPanel-hosted API must be reachable on a
host that is **not** behind Vercel. Recommended:

- Create subdomain **`api.linkskool.com`** in cPanel (serves the existing API).
- Enable CORS on the API: `Access-Control-Allow-Origin: https://linkskool.com`
  (and answer `OPTIONS` preflight).
- Set `VITE_API_BASE_URL=https://api.linkskool.com/v4/public/` in Vercel.

Alternative (no CORS): proxy `/api/*` from Vercel to the cPanel origin via
`vercel.json` rewrites — but that still needs a non-Vercel origin hostname.

## Build & deploy (plain shared hosting — fallback, news needs rebuilds)

If you ever go back to static hosting: `npm run generate:local` prerenders every
page (including all news articles) into `.output/public/` for upload to `public_html`
(includes `200.html` SPA fallback + `.htaccess`). Downside: news only updates on
rebuild, so this isn't suitable for a live news feed.

## Environment

Nuxt only auto-loads `.env` (dev backend). For local production builds use
`npm run build:local` / `npm run generate:local` (they pass `--dotenv .env.production`).
On Vercel the `VITE_*` vars come from the dashboard. The app reads config through
`import.meta.env.VITE_*` (`src/api/config.ts`).

## Sitemap

`/sitemap.xml` is produced by `server/routes/sitemap.xml.ts`, which pulls every
news slug from the API (`server/utils/fetchNewsSlugs.ts`) plus the static routes.
It is prerendered at build, so the deployed `sitemap.xml` is a plain file.

## Verify after deploy

Test real URLs (not localhost) in:

- Facebook Sharing Debugger — https://developers.facebook.com/tools/debug/
- X/Twitter Card Validator
- LinkedIn Post Inspector — https://www.linkedin.com/post-inspector/
- Google Search Console (submit `https://linkskool.com/sitemap.xml`)

Or check the raw HTML directly (this is what scrapers see):

```bash
curl -s https://linkskool.com/news/<slug> | grep -i 'og:title\|og:image\|<title>'
```
