### utm_stats table (SHARED)

This project shares the `utm_stats` table with projects: 14_portfolio, 23_store, and 28_notion-clone.

```sql
-- =================================== 📊 utm_stats table (SHARED across 14, 23, 28, 29) ===================================
-- Unified UTM tracking across all portfolio projects

CREATE TABLE IF NOT EXISTS public.utm_stats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     TEXT NOT NULL,
  source      TEXT,
  medium      TEXT,
  campaign    TEXT,
  url         TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_utm_stats_created_at ON public.utm_stats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_utm_stats_user_id    ON public.utm_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_utm_stats_source     ON public.utm_stats(source);
CREATE INDEX IF NOT EXISTS idx_utm_stats_campaign   ON public.utm_stats(campaign);

-- 🔐 RLS Policies
ALTER TABLE public.utm_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'utm_stats' AND policyname = 'Allow select for everyone') THEN
        CREATE POLICY "Allow select for everyone" ON public.utm_stats FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'utm_stats' AND policyname = 'Allow insert for everyone') THEN
        CREATE POLICY "Allow insert for everyone" ON public.utm_stats FOR INSERT WITH CHECK (true);
    END IF;
END
$$;

ALTER TABLE public.utm_stats FORCE ROW LEVEL SECURITY;

-- ⚠️ SHARED TABLE: Projects 14_portfolio, 23_store, 28_notion-clone, 29_ai-companion use this same utm_stats table
-- All UTM tracking data is aggregated in a single shared Supabase table
```

<br/>

<hr/>

<br/>

## DB Setup

```sql
create extension if not exists "pgcrypto";

-- =====================================================
-- 📦 TABLE: 29_users (EXTENDS auth.users)
-- =====================================================

-- Drop old table if it exists with wrong schema (cascades to 29_companion FK)
DROP TABLE IF EXISTS public."29_users" CASCADE;

CREATE TABLE public."29_users" (
    id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT NULL,
    providers TEXT[] NOT NULL DEFAULT '{}'::text[],
    role TEXT[] NOT NULL DEFAULT '{USER}'::text[],
    CONSTRAINT "29_users_pkey" PRIMARY KEY (id),
    CONSTRAINT "29_users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR 29_users
ALTER TABLE public."29_users" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_users'
          AND policyname = 'Allow users to select their own row'
    ) THEN
        CREATE POLICY "Allow users to select their own row"
        ON public."29_users" FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_users'
          AND policyname = 'Allow users to update their own row'
    ) THEN
        CREATE POLICY "Allow users to update their own row"
        ON public."29_users" FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;


-- =====================================================
-- 📦 TABLE: 29_category
-- =====================================================
CREATE TABLE IF NOT EXISTS public."29_category" (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    CONSTRAINT "29_category_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR 29_category
ALTER TABLE public."29_category" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_category'
          AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access"
        ON public."29_category" FOR SELECT USING (true);
    END IF;
END $$;

-- =====================================================
-- 📦 TABLE: 29_companion
-- =====================================================
-- Note: if 29_users was just dropped+recreated above, the FK is gone — recreating the table restores it.
CREATE TABLE IF NOT EXISTS public."29_companion" (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public."29_users" (id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public."29_category" (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    username TEXT NOT NULL,
    src TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    prompt TEXT NOT NULL,
    seed TEXT NOT NULL,
    CONSTRAINT "29_companion_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;


-- 👉 Index for 29_companion
CREATE INDEX IF NOT EXISTS companion_user_id_idx ON public."29_companion"(user_id);
CREATE INDEX IF NOT EXISTS companion_category_id_idx ON public."29_companion"(category_id);


-- 🔐 RLS POLICIES FOR 29_companion
ALTER TABLE public."29_companion" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_companion'
          AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access"
        ON public."29_companion" FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_companion'
          AND policyname = 'Allow users to create companions'
    ) THEN
        CREATE POLICY "Allow users to create companions"
        ON public."29_companion" FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_companion'
          AND policyname = 'Allow users to update their own companions'
    ) THEN
        CREATE POLICY "Allow users to update their own companions"
        ON public."29_companion" FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_companion'
          AND policyname = 'Allow users to delete their own companions'
    ) THEN
        CREATE POLICY "Allow users to delete their own companions"
        ON public."29_companion" FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- 📦 TABLE: 29_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS public."29_messages" (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    companion_id UUID NOT NULL REFERENCES public."29_companion" (id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."29_users" (id) ON UPDATE CASCADE ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'system')),
    content TEXT NOT NULL,
    CONSTRAINT "29_messages_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR 29_messages
ALTER TABLE public."29_messages" ENABLE ROW LEVEL SECURITY;

-- 👉 Index for 29_messages
CREATE INDEX IF NOT EXISTS "29_messages_companion_id_idx" ON public."29_messages"(companion_id);
CREATE INDEX IF NOT EXISTS "29_messages_user_id_idx" ON public."29_messages"(user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_messages'
          AND policyname = 'Allow users to view their own messages'
    ) THEN
        CREATE POLICY "Allow users to view their own messages"
        ON public."29_messages" FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_messages'
          AND policyname = 'Allow users to insert their own messages'
    ) THEN
        CREATE POLICY "Allow users to insert their own messages"
        ON public."29_messages" FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_messages'
          AND policyname = 'Allow users to delete their own messages'
    ) THEN
        CREATE POLICY "Allow users to delete their own messages"
        ON public."29_messages" FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;


-- =====================================================
-- 📦 TABLE: 29_user_balance  (NOT YET CREATED - part of the /generate-image plan,
--                              see dev_readme-generate-image-feature.md section 5)
-- =====================================================
-- Cached running balance per user. The source of truth for how the balance got to this number is
-- 29_balance_transactions below - this table exists so reading a balance doesn't require summing the
-- whole transaction history on every request.
CREATE TABLE IF NOT EXISTS public."29_user_balance" (
    user_id UUID NOT NULL REFERENCES public."29_users" (id) ON UPDATE CASCADE ON DELETE CASCADE,
    balance_usd NUMERIC(12,2) NOT NULL DEFAULT 0,  -- exact decimal cents, not float - confirm 2dp is enough (see open question 5 in the feature doc)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "29_user_balance_pkey" PRIMARY KEY (user_id)
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR 29_user_balance
ALTER TABLE public."29_user_balance" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_user_balance'
          AND policyname = 'Allow users to select their own balance'
    ) THEN
        CREATE POLICY "Allow users to select their own balance"
        ON public."29_user_balance" FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- ⚠️ Deliberately NO insert/update/delete policy for authenticated users. Balance changes must only
-- ever happen server-side (the balance webhook branch on top-up, the generate-media route on
-- deduction) using supabaseAdmin, which uses the service-role key and bypasses RLS entirely. If a
-- client-writable path to this table is ever added, a user could grant themselves free balance.


-- =====================================================
-- 📦 TABLE: 29_balance_transactions  (NOT YET CREATED - see dev_readme-generate-image-feature.md section 5)
-- =====================================================
-- Append-only ledger. amount_usd is a signed delta: positive for a top-up, negative for a
-- generation deduction - SUM(amount_usd) for a user should always equal their
-- 29_user_balance.balance_usd row, so this table can reconcile/audit the cached balance.
CREATE TABLE IF NOT EXISTS public."29_balance_transactions" (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public."29_users" (id) ON UPDATE CASCADE ON DELETE CASCADE,
    amount_usd NUMERIC(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup', 'deduction')),
    reference TEXT NULL,
    CONSTRAINT "29_balance_transactions_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 👉 Index for 29_balance_transactions
CREATE INDEX IF NOT EXISTS "29_balance_transactions_user_id_idx" ON public."29_balance_transactions"(user_id);

-- 🔐 RLS POLICIES FOR 29_balance_transactions
ALTER TABLE public."29_balance_transactions" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = '29_balance_transactions'
          AND policyname = 'Allow users to view their own transactions'
    ) THEN
        CREATE POLICY "Allow users to view their own transactions"
        ON public."29_balance_transactions" FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- ⚠️ Same rule as 29_user_balance above - no client-writable insert/update/delete policy. Only the
-- service role writes rows here.

```

### Deprecated - website is free - so no need in user subscriptions

Note: the Stripe/webhook _infrastructure_ below (`lib/stripe.ts`, `app/api/webhook/route.ts`) is
about to become relevant again for the `/generate-image` balance top-up flow - but as a **new**
checkout product/branch (topping up `29_user_balance`), not by un-deprecating this `user_subscription`
table itself. Recurring subscriptions and one-time balance top-ups are different billing models; don't
repurpose this table for balance.

```sql


-- =====================================================
-- 📦 TABLE: user_subscription
-- =====================================================
CREATE TABLE public.user_subscription (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public."29_users" (id) ON UPDATE CASCADE ON DELETE CASCADE,
    stripe_customer_id TEXT NULL,
    stripe_subscription_id TEXT NULL,
    stripe_price_id TEXT NULL,
    stripe_current_period_end TIMESTAMPTZ NULL,
    CONSTRAINT user_subscription_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR user_subscription
ALTER TABLE public.user_subscription ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'user_subscription'
          AND policyname = 'Allow users to select their own subscription'
    ) THEN
        CREATE POLICY "Allow users to select their own subscription"
        ON public.user_subscription FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'user_subscription'
          AND policyname = 'Allow users to update their own subscription'
    ) THEN
        CREATE POLICY "Allow users to update their own subscription"
        ON public.user_subscription FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


CREATE INDEX IF NOT EXISTS user_subscription_user_id_idx ON public.user_subscription(user_id);
```
