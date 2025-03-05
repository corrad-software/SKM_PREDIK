// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  ssr: false,
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@formkit/nuxt",
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
    [
      "nuxt-openapi-docs-module",
      {
        folder: "./openapi",
        name: "OpenApiDocs",
        files: function () {
          return {
            "financial-statement-api": "Financial Statement API",
          };
        },
      },
    ],
    '@nuxtjs/supabase'
  ],
  tailwindcss: {
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: 0 }],
    viewer: false,
  },
  fonts: {
    priority: ["google"],
    provider: "google",
  },
  runtimeConfig: {
    // Private keys are only available on the server
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
    supabaseDatabasePassword: process.env.SUPABASE_DATABASE_PASSWORD,
    openaiApiKey: process.env.OPENAI_API_KEY,

    // Public keys that are exposed to the client
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  supabase: {
    // Optional: Supabase specific configuration
    // url: process.env.SUPABASE_URL,
    // key: process.env.SUPABASE_KEY,
    // You can also configure redirect URLs, etc.
  }
});
