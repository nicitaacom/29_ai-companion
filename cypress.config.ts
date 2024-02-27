import { defineConfig } from "cypress"
import env from "cypress.env.json"

export default defineConfig({
  env: env,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:3029", // use proccess.env.NEXT_DEVELOPMENT_URL
  },
})
