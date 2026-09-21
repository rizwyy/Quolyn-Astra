import { fileURLToPath } from 'node:url'
export default defineNuxtConfig({
  compatibilityDate: '2026-09-20',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  typescript: { strict: true },
  // Bake public build settings into the server bundle; NUXT_PUBLIC_* runtime
  // overrides still work. Netlify build variables are not function variables.
  runtimeConfig: { public: {
    supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
    supabasePublishableKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  } },
  app: { head: { title: 'Quolyn · From enquiry to accurate quote', meta: [{ name: 'description', content: 'A human-reviewed quotation workspace for distributors.' }] } },
  nitro: { serverAssets: [{ baseName: 'fonts', dir: fileURLToPath(new URL('./public/fonts', import.meta.url)) }] }
})
