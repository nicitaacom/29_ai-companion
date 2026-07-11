import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import tsParser from "@typescript-eslint/parser"
import unicorn from "eslint-plugin-unicorn"

import localRules from "./eslint-local-rules/index.js"

export default [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "cypress/**", "*.config.*", "eslint-local-rules/**"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "local-rules": { rules: localRules },
      unicorn,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { args: "all", argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]
