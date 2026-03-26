## General Information

This project is a Supabase-powered AI companion app built with Next.js. It lets users sign in with Google, GitHub, or email/password, create companions, chat with them, and manage their account in a single workspace.

The app is now free to use. Pricing and upgrade UI still exist in the codebase for compatibility, but the product flow should treat every authenticated user as fully enabled.

<details> <summary><b>Project flow</b></summary>

1. User lands on the homepage.
2. User signs in with Supabase auth.
3. User browses companions or creates a new one.
4. Chat requests use the companion and message tables on the server.
5. Settings and auth state are managed from Supabase session data.

</details>

<details> <summary><b>Design direction</b></summary>

- Dark, compact, premium UI.
- Organic canvas background in the auth modal.
- White particles on gray and charcoal surfaces.
- Rounded panels, soft borders, and subtle blur.

</details>

<br/>

## Architecture

<details> <summary><b>What lives where</b></summary>

- `components/` contains shared UI and feature-level interface pieces.
- `app/` contains route groups, server actions, and API routes.
- `lib/` contains Supabase, Stripe, memory, and helper integrations.
- `app/interfaces/` contains the generated database types.
- `app/utils/` contains small shared helpers such as auth and URL utilities.

</details>

<details> <summary><b>Backend model</b></summary>

- Supabase handles auth and user session ownership.
- Server routes write to the database using the service role client where needed.
- Companion creation and updates are routed through the server.
- Stripe billing is currently disabled in product flow, so the app behaves like a free product.

</details>

<br/>

## Local Setup

<details> <summary><b>Run locally</b></summary>

1. Install dependencies.
2. Create your `.env.local`.
3. Fill in Supabase credentials and any AI provider keys.
4. Start the dev server.

```bash
pnpm install
pnpm dev
```

</details>

<details> <summary><b>Environment variables</b></summary>

Use the values required by your Supabase project and the providers you have enabled.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_DEVELOPMENT_URL=http://localhost:3029
NEXT_PRODUCTION_URL=
NEXT_PUBLIC_VERCEL_URL=
```

If you use external services in this repo, also set the keys for them, such as OpenAI, Pinecone, Replicate, Stripe, Cloudinary, Upstash, or Resend.

</details>

<br/>

## DB Setup

The app expects a Supabase database with a small set of tables that match the generated types in `app/interfaces/types_db.ts`.

<details> <summary><b>SQL setup</b></summary>

Run this in the Supabase SQL editor. It follows the same style as the example and keeps the app profile table extended from `auth.users`.

```sql
create extension if not exists "pgcrypto";

-- =====================================================
-- 📦 TABLE: users_29_companion (EXTENDS auth.users)
-- =====================================================
CREATE TABLE public.users_29_companion (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT NULL,
    providers TEXT[] NOT NULL DEFAULT '{}'::text[],
    role TEXT[] NOT NULL DEFAULT '{USER}'::text[],
    CONSTRAINT users_29_companion_pkey PRIMARY KEY (id),
    CONSTRAINT users_29_companion_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR users_29_companion
ALTER TABLE public.users_29_companion ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'users_29_companion'
          AND policyname = 'Allow users to select their own row'
    ) THEN
        CREATE POLICY "Allow users to select their own row"
        ON public.users_29_companion FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'users_29_companion'
          AND policyname = 'Allow users to update their own row'
    ) THEN
        CREATE POLICY "Allow users to update their own row"
        ON public.users_29_companion FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- =====================================================
-- 📦 TABLE: category
-- =====================================================
CREATE TABLE public.category (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    CONSTRAINT category_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 📦 TABLE: companion
-- =====================================================
CREATE TABLE public.companion (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.users_29_companion (id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.category (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    username TEXT NOT NULL,
    src TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    seed TEXT NOT NULL,
    CONSTRAINT companion_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE public.companion ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 📦 TABLE: messages
-- =====================================================
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    companion_id UUID NOT NULL REFERENCES public.companion (id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users_29_companion (id) ON UPDATE CASCADE ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'system')),
    content TEXT NOT NULL,
    CONSTRAINT messages_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 📦 TABLE: user_subscription
-- =====================================================
CREATE TABLE public.user_subscription (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users_29_companion (id) ON UPDATE CASCADE ON DELETE CASCADE,
    stripe_customer_id TEXT NULL,
    stripe_subscription_id TEXT NULL,
    stripe_price_id TEXT NULL,
    stripe_current_period_end TIMESTAMPTZ NULL,
    CONSTRAINT user_subscription_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE public.user_subscription ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS companion_user_id_idx ON public.companion(user_id);
CREATE INDEX IF NOT EXISTS companion_category_id_idx ON public.companion(category_id);
CREATE INDEX IF NOT EXISTS messages_companion_id_idx ON public.messages(companion_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS user_subscription_user_id_idx ON public.user_subscription(user_id);
```

</details>

<details> <summary><b>Database notes</b></summary>

- The app reads and writes through Supabase sessions plus server-side helpers.
- `public.users_29_companion` is the app profile table, separate from Supabase Auth users.
- If you prefer the exact spelling `users_29_jompanion`, rename the table consistently in SQL, generated types, and queries.
- `public.companion` stores the companion cards shown on the homepage and in chat.
- `public.messages` stores the chat history for each companion thread.
- `public.user_subscription` is kept for compatibility, even though the product now behaves as free to use.

</details>

<br/>

## SEO And Public Assets

<details> <summary><b>Current setup</b></summary>

- Favicon is served from `public/favicon.png`.
- Metadata lives in `app/layout.tsx`.
- `robots.ts` and `sitemap.ts` are app-router files.
- `app/not-found.tsx` provides the custom 404 page.

</details>

<br/>

## Notes For AI Changes

<details> <summary><b>Style reminders</b></summary>

- Prefer thin routes and small helpers.
- Use early returns when possible.
- Keep auth and billing code readable and server-first.
- Match existing Tailwind patterns instead of introducing a new visual language.

</details>
