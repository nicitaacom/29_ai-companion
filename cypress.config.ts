import { defineConfig } from "cypress"

export default defineConfig({
  env: { ...process.env },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:3029", // use proccess.env.NEXT_DEVELOPMENT_URL
  },
})
