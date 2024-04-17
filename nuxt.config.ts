// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "nuxt-security"],
  runtimeConfig: {
    apiKey: process.env.DELPHI_API_KEY,
  },
  colorMode: {
    preference: "dark",
  },
  security: {
    headers: { contentSecurityPolicy: false, crossOriginEmbedderPolicy: "require-corp" },
  }
});
