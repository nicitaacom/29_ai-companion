declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PRODUCTION_URL: string
      NEXT_DEVELOPMENT_URL: string

      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string

      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string

      PINECONE_INDEX: string
      PINECONE_ENVIRONMENT: string
      PINECONE_API_KEY: string

      UPSTASH_REDIS_REST_URL: string
      UPSTASH_REDIS_REST_TOKEN: string

      OPENAI_KEY: string

      REPLICATE_API_TOKEN: string
    }
  }
}

export {}
