# What inside? <br/> <sub> https://production-url/</sub>

[![23-store-overview](https://i.imgur.com/F9FiGHK.jpg)](video here)

## Project info

### Stack - Next 14 + TypeScript + Tailwind + Supabase + Stripe + MYSQL

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
create table
  public.category (
    id uuid not null default uuid_generate_v4 (),
    name character varying(255) not null,
    constraint category_pkey primary key (id)
  ) tablespace pg_default;
```

</details>

<details>
<summary>2. companion</summary>

```sql
create table
  public.companion (
    id uuid not null default uuid_generate_v4 (),
    user_id uuid not null default gen_random_uuid (),
    username character varying(255) not null,
    src character varying(255) not null,
    name text not null,
    description text not null,
    instructions text not null,
    seed text not null,
    created_at timestamp with time zone not null default timezone ('UTC'::text, now()),
    updated_at timestamp with time zone not null default timezone ('UTC'::text, now()),
    category_id uuid not null,
    constraint companion_pkey primary key (id),
    constraint companion_category_id_fkey foreign key (category_id) references category (id) on update cascade on delete cascade,
    constraint public_companion_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;
```

**allow select for authenticated user**

Target role - authenticated

```sql
true
```

**allow to delete their own companions**

```sql
(user_id = auth.uid())
```

</details>

<details>
<summary>3. messages</summary>

```sql
create table
  public.messages (
    id uuid not null default uuid_generate_v4 (),
    role public.role not null,
    content text not null,
    created_at timestamp with time zone not null default timezone ('UTC'::text, now()),
    updated_at timestamp with time zone not null default timezone ('UTC'::text, now()),
    companion_id uuid not null,
    user_id character varying(255) not null,
    constraint message_pkey primary key (id)
  ) tablespace pg_default;
```

**allow insert for authenticated users**

Target role - authenticated

```sql
true
```

**allow select for authenticated users**

Target role - authenticated

```sql
true
```

</details>

<details>
<summary>4. user_subscription</summary>

```sql
create table
  public.user_subscription (
    id uuid not null default uuid_generate_v4 (),
    user_id character varying(255) not null,
    stripe_customer_id character varying(255) null,
    stripe_subscription_id character varying(255) null,
    stripe_price_id character varying(255) null,
    stripe_current_period_end timestamp with time zone null,
    constraint usersubscription_pkey primary key (id),
    constraint usersubscription_stripecustomerid_key unique (stripe_customer_id),
    constraint usersubscription_stripesubscriptionid_key unique (stripe_subscription_id),
    constraint usersubscription_userid_key unique (user_id)
  ) tablespace pg_default;
```

</details>

<details>
<summary>4. user_subscription</summary>

```sql
create table
  public.users (
    id uuid not null,
    created_at timestamp with time zone not null default now(),
    email text not null,
    avatar_url text null,
    providers text[] not null default '{}'::text[],
    role text[] not null default '{USER}'::text[],
    constraint users_duplicate_pkey primary key (id),
    constraint users_id_fkey foreign key (id) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;
```

**allow select user based on user id**

```sql
(id = auth.uid())
```

**allow updated user based on user id**

```sql
(id = auth.uid())
```

</details>

### 2.7 - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

https://youtu.be/PGPGcKBpAk8?t=17601

### 2.8 - PINECONE + UPSTASH + OPENAI

https://youtu.be/PjYWpd7xkaM?t=15618

Note that `PINECONE_ENVIRONMENT='gcp-starter'` for 02.2024 for free plan on GCP

### 2.9 - REPLICATE_API_TOKEN

https://youtu.be/PjYWpd7xkaM?t=17350

### 2.11 - STRIPE_API_KEY

https://youtu.be/PjYWpd7xkaM?t=18978

### 2.11 - STRIPE_WEBHOOK_SECRET

https://youtu.be/PjYWpd7xkaM?t=20218
