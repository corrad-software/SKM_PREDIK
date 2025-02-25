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
            "financial-statement-api": "Financial Statement API"
          };
        },
      },
    ],
  ],
  tailwindcss: {
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: 0 }],
    viewer: false,
  },
  fonts: {
    priority: ["google"],
    provider: "google",
  },
  app: {
    head: {
      script: [
        {
          innerHTML: `(function() {
            try {
              const theme = localStorage.getItem('theme') || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default');
              
              if (theme !== 'default') {
                document.documentElement.classList.add('theme-' + theme);
              }
              document.documentElement.style.colorScheme = theme;
            } catch (e) {}
          })()`,
          type: "text/javascript",
        },
      ],
    },
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
});
