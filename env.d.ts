declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_PRODUCTION_URL: string
      NEXT_PUBLIC_DEVELOPMENT_URL: string
      NEXT_PRODUCTION_URL?: string
      NEXT_DEVELOPMENT_URL?: string
      NEXT_PUBLIC_SITE_URL?: string
      NEXT_PUBLIC_VERCEL_URL?: string

      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string

      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: string

      PINECONE_INDEX: string
      PINECONE_HOST: string
      PINECONE_API_KEY: string

      UPSTASH_REDIS_REST_URL: string
      UPSTASH_REDIS_REST_TOKEN: string

      // For Cloudflare robot protection
      NEXT_PUBLIC_CLOUDFLARE_SITE_KEY: string
      TURNSTILE_SECRET_KEY: string

      OPENAI_KEY: string

      REPLICATE_API_TOKEN: string

      STRIPE_WEBHOOK_SECRET: string
      STRIPE_SECRET_KEY: string
    }
  }
}

export {}
