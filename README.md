# What inside? <br/> <sub> https://29-ai-companion.vercel.app/</sub>


<hr/>

<br/>

<br/>

<br/>

## Project info

### Stack - Next 14 + TypeScript + Tailwind + Supabase + Stripe + MYSQL

<hr/>

<br/>

<br/>

<br/>



# Clone repository

## Step 1.1 - clone repository (variant 1)

![alt text](https://i.imgur.com/9KSgjaN.png)

## or Step 1.1 - clone repository (variant 2)

```
git clone https://github.com/nicitaacom/29_ai-companion/
```

## Step 1.2 - install deps

```
pnpm i
```

<hr/>

<br/>

<br/>

<br/>

## Step 2 - setup .env

### 2.1 - supabase

Login in supabase - https://app.supabase.com/sign-in
![Login in supabase](https://i.imgur.com/zxJFahy.png)

### 2.2 - supabase

![Click new project](https://i.imgur.com/9YZGJ8j.png)

### 2.3 - supabase

![Set up supabase project](https://i.imgur.com/0xIb866.png)

### 2.4 - supabase

![Copy .env](https://i.imgur.com/Rh6rHtg.png)

### 2.5 - supabase

![Paste .env](https://i.imgur.com/KI7jpAR.png)

### 2.6 - supabase setup

<details>
<summary>1. category</summary>

```sql
-- =====================================================
-- 🔧 ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";



-- =====================================================
-- 🎯 CREATE CUSTOM ENUM TYPES
-- =====================================================
DO $$ 
BEGIN
    CREATE TYPE public.role AS ENUM ('user', 'assistant', 'system');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



-- =====================================================
-- 📦 TABLE: category
-- =====================================================
CREATE TABLE public.category (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name CHARACTER VARYING(255) NOT NULL,
    CONSTRAINT category_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 🔐 RLS ENABLED (NO POLICIES DEFINED – RESTRICTED ACCESS)
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;





-- =====================================================
-- 📦 TABLE: companion (DEPENDS ON category AND auth.users)
-- =====================================================
CREATE TABLE public.companion (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT gen_random_uuid(),  -- ⚠️ DEFAULT IS RANDOM, SHOULD BE auth.uid() IN PRACTICE
    username CHARACTER VARYING(255) NOT NULL,
    src CHARACTER VARYING(255) NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    seed TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC'::text, now()),
    category_id UUID NOT NULL,
    CONSTRAINT companion_pkey PRIMARY KEY (id),
    CONSTRAINT companion_category_id_fkey FOREIGN KEY (category_id) REFERENCES category (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT public_companion_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR companion
ALTER TABLE public.companion ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- ALLOW SELECT FOR ALL AUTHENTICATED USERS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companion' AND policyname = 'Allow authenticated users to select companions') THEN
        CREATE POLICY "Allow authenticated users to select companions" 
        ON public.companion FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- ALLOW DELETE ONLY FOR OWNER
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companion' AND policyname = 'Allow users to delete their own companions') THEN
        CREATE POLICY "Allow users to delete their own companions" 
        ON public.companion FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;





-- =====================================================
-- 📦 TABLE: messages (DEPENDS ON companion AND role ENUM)
-- =====================================================
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    role public.role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('UTC'::text, now()),
    companion_id UUID NOT NULL,
    user_id CHARACTER VARYING(255) NOT NULL,  -- ⚠️ TEXT TYPE, NOT UUID
    CONSTRAINT message_pkey PRIMARY KEY (id)
    -- FOREIGN KEY for companion_id could be added but not in original DDL; we'll add it for integrity
    -- CONSTRAINT messages_companion_id_fkey FOREIGN KEY (companion_id) REFERENCES companion (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add foreign key (optional but recommended)
ALTER TABLE public.messages ADD CONSTRAINT messages_companion_id_fkey FOREIGN KEY (companion_id) REFERENCES companion (id) ON DELETE CASCADE;

-- 🔐 RLS POLICIES FOR messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- ALLOW INSERT FOR ALL AUTHENTICATED USERS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow authenticated users to insert messages') THEN
        CREATE POLICY "Allow authenticated users to insert messages" 
        ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- ALLOW SELECT FOR ALL AUTHENTICATED USERS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow authenticated users to select messages') THEN
        CREATE POLICY "Allow authenticated users to select messages" 
        ON public.messages FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;





-- =====================================================
-- 📦 TABLE: user_subscription
-- =====================================================
CREATE TABLE public.user_subscription (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id CHARACTER VARYING(255) NOT NULL,
    stripe_customer_id CHARACTER VARYING(255) NULL,
    stripe_subscription_id CHARACTER VARYING(255) NULL,
    stripe_price_id CHARACTER VARYING(255) NULL,
    stripe_current_period_end TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT usersubscription_pkey PRIMARY KEY (id),
    CONSTRAINT usersubscription_stripecustomerid_key UNIQUE (stripe_customer_id),
    CONSTRAINT usersubscription_stripesubscriptionid_key UNIQUE (stripe_subscription_id),
    CONSTRAINT usersubscription_userid_key UNIQUE (user_id)
) TABLESPACE pg_default;

-- 🔐 RLS ENABLED (NO POLICIES DEFINED – RESTRICTED ACCESS)
ALTER TABLE public.user_subscription ENABLE ROW LEVEL SECURITY;





-- =====================================================
-- 📦 TABLE: users (EXTENDS auth.users)
-- =====================================================
CREATE TABLE public.users (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    email TEXT NOT NULL,
    avatar_url TEXT NULL,
    providers TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    role TEXT[] NOT NULL DEFAULT '{USER}'::TEXT[],
    CONSTRAINT users_duplicate_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
) TABLESPACE pg_default;

-- 🔐 RLS POLICIES FOR users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- ALLOW SELECT OWN ROW
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow users to select their own row') THEN
        CREATE POLICY "Allow users to select their own row" 
        ON public.users FOR SELECT USING (id = auth.uid());
    END IF;

    -- ALLOW UPDATE OWN ROW
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow users to update their own row') THEN
        CREATE POLICY "Allow users to update their own row" 
        ON public.users FOR UPDATE USING (id = auth.uid());
    END IF;
END $$;



```
</details>

### 2.7 - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

https://youtu.be/PGPGcKBpAk8?t=17601

### 2.8 - PINECONE + UPSTASH + OPENAI

https://youtu.be/PjYWpd7xkaM?t=15618

### 2.9 - REPLICATE_API_TOKEN

https://youtu.be/PjYWpd7xkaM?t=17350

### 2.11 - STRIPE_API_KEY

https://youtu.be/PjYWpd7xkaM?t=18978

### 2.11 - STRIPE_WEBHOOK_SECRET

https://youtu.be/PjYWpd7xkaM?t=20218
