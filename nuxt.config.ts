export default defineNuxtConfig({
  compatibilityDate: '2026-09-20',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  typescript: { strict: true },
  runtimeConfig: { public: { supabaseUrl: '', supabasePublishableKey: '' } },
  app: { head: { title: 'Quolyn · From enquiry to accurate quote', meta: [{ name: 'description', content: 'A human-reviewed quotation workspace for distributors.' }] } },
  nitro: { serverAssets: [{ baseName: 'fonts', dir: './public/fonts' }] }
})
