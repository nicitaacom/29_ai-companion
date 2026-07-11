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
      "unicorn/catch-error-name": "warn",
      "max-len": ["warn", { code: 130, ignoreUrls: true }],
      "import/newline-after-import": ["warn", { count: 1 }],
      "local-rules/no-export-const-classname": "warn",
      "local-rules/no-localstorage-direct": "warn",
      "local-rules/no-banned-words": "error",
      "local-rules/no-function-in-deps": "warn",
      "local-rules/no-vague-names": "warn",
      "local-rules/style-before-classname": "warn",
      "local-rules/sdk-method-naming": "warn",
      "local-rules/no-throwaway-alias": "warn",
      "local-rules/no-zustand-types-in-store-file": "warn",
      "local-rules/input-value-naming": "warn",
      "local-rules/handle-prefix-location": "warn",
      "local-rules/no-process-env-non-null-assertion": "warn",
      "local-rules/arrow-fn-only-for-hooks": "warn",
    },
  },
]
