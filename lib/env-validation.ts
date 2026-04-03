type EnvValidationIssue = {
  name: string
  reason: string
}

type EnvRule = {
  name: string
  validate: (value: string | undefined) => string | null
}

let cachedProductionEnvError: Error | null | undefined

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function validateNonEmpty(value: string | undefined) {
  return value?.trim() ? null : "is missing"
}

function validateUrl(value: string | undefined) {
  if (!value?.trim()) {
    return "is missing"
  }

  return isValidUrl(value) ? null : "must be a valid URL"
}

function validatePrefixed(prefix: string) {
  return (value: string | undefined) => {
    if (!value?.trim()) {
      return "is missing"
    }

    return value.startsWith(prefix) ? null : `must start with ${prefix}`
  }
}

function validateJwtLike(value: string | undefined) {
  if (!value?.trim()) {
    return "is missing"
  }

  return value.split(".").length === 3 ? null : "must look like a JWT"
}

function getBaseUrlValidationError() {
  const value =
    process.env.NEXT_PUBLIC_PRODUCTION_URL?.trim() ||
    process.env.NEXT_PRODUCTION_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim()

  if (!value) {
    return {
      name: "NEXT_PUBLIC_PRODUCTION_URL",
      reason: "or NEXT_PRODUCTION_URL / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_VERCEL_URL must be set",
    } satisfies EnvValidationIssue
  }

  const normalizedValue = value.includes("http") ? value : `https://${value}`

  if (!isValidUrl(normalizedValue)) {
    return {
      name: "NEXT_PUBLIC_PRODUCTION_URL",
      reason: "must be a valid production URL",
    } satisfies EnvValidationIssue
  }

  return null
}

function getProductionEnvIssues() {
  // use satisfies
  const rules: EnvRule[] = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", validate: validateUrl },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", validate: validateJwtLike },
    { name: "SUPABASE_SERVICE_ROLE_KEY", validate: validateJwtLike },
    { name: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", validate: validateNonEmpty },
    { name: "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET", validate: validateNonEmpty },
    { name: "PINECONE_INDEX", validate: validateNonEmpty },
    { name: "PINECONE_HOST", validate: validateUrl },
    { name: "PINECONE_API_KEY", validate: validateNonEmpty },
    { name: "UPSTASH_REDIS_REST_URL", validate: validateUrl },
    { name: "UPSTASH_REDIS_REST_TOKEN", validate: validateNonEmpty },
    { name: "NEXT_PUBLIC_CLOUDFLARE_SITE_KEY", validate: validatePrefixed("0x4") },
    { name: "TURNSTILE_SECRET_KEY", validate: validatePrefixed("0x4") },
    { name: "OPENAI_KEY", validate: validatePrefixed("sk-") },
    { name: "STRIPE_WEBHOOK_SECRET", validate: validatePrefixed("whsec_") },
    { name: "STRIPE_SECRET_KEY", validate: validatePrefixed("sk_") },
  ]

  const issues = rules
    .map(rule => {
      const reason = rule.validate(process.env[rule.name])
      return reason ? ({ name: rule.name, reason } satisfies EnvValidationIssue) : null
    })
    .filter((issue): issue is EnvValidationIssue => Boolean(issue))

  const baseUrlIssue = getBaseUrlValidationError()
  if (baseUrlIssue) {
    issues.unshift(baseUrlIssue)
  }

  return issues
}

export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return
  }

  if (cachedProductionEnvError !== undefined) {
    if (cachedProductionEnvError) {
      throw cachedProductionEnvError
    }

    return
  }

  const issues = getProductionEnvIssues()

  if (issues.length === 0) {
    cachedProductionEnvError = null
    return
  }

  cachedProductionEnvError = new Error(
    `Invalid production environment configuration: ${issues.map(issue => `${issue.name} ${issue.reason}`).join("; ")}`,
  )

  throw cachedProductionEnvError
}
