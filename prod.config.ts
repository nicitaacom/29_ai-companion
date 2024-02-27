import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },

    env: { ...process.env },
    baseUrl: process.env.NEXT_PRODUCTION_URL,
  },
})
