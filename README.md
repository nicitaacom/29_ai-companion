### 2.8 - supabase setup

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
    user_id character varying(255) not null,
    username character varying(255) not null,
    src character varying(255) not null,
    name text not null,
    description text not null,
    instructions text not null,
    seed text not null,
    createdat timestamp with time zone not null default timezone ('UTC'::text, now()),
    updatedat timestamp with time zone not null default timezone ('UTC'::text, now()),
    categoryid uuid not null,
    constraint companion_pkey primary key (id),
    constraint companion_categoryid_fkey foreign key (categoryid) references category (id) on update cascade on delete cascade
  ) tablespace pg_default;
```

</details>

<details>
<summary>3. message</summary>

```sql
create table
  public.message (
    id uuid not null default uuid_generate_v4 (),
    role public.role not null,
    content text not null,
    createdat timestamp with time zone not null default timezone ('UTC'::text, now()),
    updatedat timestamp with time zone not null default timezone ('UTC'::text, now()),
    "companionId" uuid not null,
    userid character varying(255) not null,
    constraint message_pkey primary key (id)
  ) tablespace pg_default;
```

</details>

<details>
<summary>4. users</summary>

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

</details>

<details>
<summary>5. user_subscription</summary>

```sql
create table
  public.user_subscription (
    id uuid not null default uuid_generate_v4 (),
    user_id character varying(255) not null,
    stripe_customerid character varying(255) null,
    stripe_subscriptionid character varying(255) null,
    stripe_price_id character varying(255) null,
    stripe_current_period_end timestamp with time zone null,
    constraint usersubscription_pkey primary key (id),
    constraint usersubscription_stripecustomerid_key unique (stripe_customerid),
    constraint usersubscription_stripesubscriptionid_key unique (stripe_subscriptionid),
    constraint usersubscription_userid_key unique (user_id)
  ) tablespace pg_default;
```

</details>
