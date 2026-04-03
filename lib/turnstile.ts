type TurnstileVerificationResult = {
  "error-codes"?: string[]
  success?: boolean
}

export async function verifyTurnstileToken({
  ip,
  token,
}: {
  ip?: string | null
  token: string
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()

  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY is not set")
  }

  const formData = new FormData()
  formData.append("secret", secret)
  formData.append("response", token)

  if (ip) {
    formData.append("remoteip", ip)
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    body: formData,
    cache: "no-store",
    method: "POST",
  })

  if (!response.ok) {
    return {
      errors: [`http_${response.status}`],
      success: false,
    }
  }

  const result = (await response.json()) as TurnstileVerificationResult

  return {
    errors: result["error-codes"] ?? [],
    success: Boolean(result.success),
  }
}
