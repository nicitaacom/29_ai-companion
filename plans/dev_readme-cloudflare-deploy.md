# Plan: actually ship the Cloudflare Pages/Workers deploy

This is a planning document for a new chat session to implement. **Read `dev_readme-cloudflare-pages.md`
first, in full** - it documents a prior end-to-end attempt that hit the Workers free-tier 3 MiB gzip
size limit (`[code: 10027]`) and was reverted. This plan does not contradict that doc; it executes the
TODO it left open, under new instructions: get the bundle under the limit by rewriting SDKs as raw
`fetch()` calls, not by asking for the paid Workers plan. One of that doc's "decisions made AGAINST" -
rewriting the Stripe SDK as raw fetch - is explicitly **reversed** here. That reversal is intentional,
not an oversight; don't re-read the old doc's section 4 as still-binding on that specific point.

Also skim `dev_readme-eslint.md` before writing new files - this repo's ESLint fully enforces its
conventions (T/I type prefixes, `imports-order`, etc.) and any new module (raw API clients, webhook
verification helper) needs to pass `pnpm lint`.

<br/>

## 1. The old doc's numbers are stale - verify, don't trust them

The prior investigation measured 3546.30 KiB (later 3352.55 KiB after an `aws4fetch` swap) and named
`moment-timezone` as the single biggest lever (~280 KiB gzip) and `stripe` as smeared across a shared
~676 KiB chunk "used across 13 files including live payment flows."

Both of those are now wrong, confirmed by grep against the current tree:

- **`moment-timezone` is already gone.** Not in `package.json`, not in `pnpm-lock.yaml`, zero imports
  anywhere. Timezone handling already runs on `Intl.DateTimeFormat`
  (`widgets/TimezonePicker/useUserTimeZone.ts:8`, `lib/rate-limit-core.ts:38,51`). The doc's biggest
  lever has already been pulled by some other, unrelated change - don't go looking for a
  `moment-timezone` refactor to do, there's nothing left to refactor.
- **Stripe's footprint shrank to almost nothing.** `app/api/stripe/route.ts` is now a stub that returns
  `{ message: "This app is free to use." }` - `checkSubscription()` in `lib/subscription.ts` always
  returns `true`. There is no live checkout/payment-intent flow anywhere in the codebase (verified: no
  `checkout.sessions.create`, no `PaymentIntent` usage). The *only* remaining Stripe SDK usage is
  `lib/stripe.ts` (client construction) and `app/api/webhook/route.ts` (`stripe.webhooks.constructEvent`
  + `stripe.subscriptions.retrieve`, both inside the webhook handler for `checkout.session.completed`
  and `invoice.payment_succeeded`). Two files, one narrow purpose - not "13 files."
- The `aws4fetch`/`S3Client.ts` swap from the old doc's measurements isn't present either - there's no
  S3 client in this codebase at all currently. Ignore that line item, it doesn't apply.
- No `wrangler.jsonc`, `open-next.config.ts`, or OpenNext deploy/preview scripts exist right now - the
  old doc's "all Cloudflare-specific files were reverted" is accurate as of today.

**Implication:** re-run the doc's Reproduction steps and get a fresh `wrangler deploy --dry-run` gzip
number *before* deciding what else needs cutting. It is plausible the bundle is already under 3072 KiB
purely from the `moment-timezone` removal that happened for unrelated reasons. Don't assume - measure.

<br/>

## 2. Target

Owner's instruction: get under the 3072 KiB (3 MiB) free-tier hard limit, and push further to **under
2560 KiB (2.5 MiB)** as a stretch goal, by replacing SDKs with raw API calls wherever reasonable - not
by upgrading to the paid Workers plan.

<br/>

## 3. Step-by-step

### Step 0 - re-scaffold the Cloudflare setup

Follow `dev_readme-cloudflare-pages.md`'s "Reproduction steps" section exactly:

1. `pnpm add -D wrangler@latest @opennextjs/cloudflare@latest`
2. Add `esbuild`/`workerd` to `pnpm-workspace.yaml` `onlyBuiltDependencies` + `allowBuilds`, `pnpm install`
3. Minimal `wrangler.jsonc` (`name`, `main: ".open-next/worker.js"`, `compatibility_date`,
   `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`,
   `assets: { directory: ".open-next/assets", binding: "ASSETS" }`,
   `services: [{ "binding": "WORKER_SELF_REFERENCE", "service": "<name>" }]`)
4. `open-next.config.ts` - `export default defineCloudflareConfig()`
5. This repo's Next config file is `next.config.mjs` (ESM, not `next.config.js`) - add
   `initOpenNextCloudflareForDev()` there, keeping the existing `images.remotePatterns` block intact.
6. Add `.open-next/**` and `.wrangler/**` to `eslint.config.mjs` ignores.
7. Note the existing `build` script is `eslint . --max-warnings=-1 && next build --webpack` - it forces
   webpack explicitly. Don't change that flag; add the OpenNext build/deploy/preview scripts alongside
   it, don't replace it.

### Step 1 - fresh baseline

`pnpm build && pnpm exec opennextjs-cloudflare build && npx wrangler deploy --dry-run` - record the
actual `Total Upload: ... / gzip: ...` line. This is the real number to work from, not the old doc's.

### Step 2 - cut remaining heavy server-side SDKs to raw `fetch()`

Confirmed still present in the current codebase, in descending order of expected impact (verify actual
impact per-package with the metafile/chunk-grep technique from the old doc's repro step 7 - read
`.open-next/server-functions/default/handler.mjs.meta.json` and/or grep the raw chunk files under
`.open-next/server-functions/default/.next/server/chunks/` - don't just assume this ordering holds):

**a. `lib/memory.ts` - drop `@langchain/openai`, `@langchain/pinecone`, `@pinecone-database/pinecone`.**
This is one file, and only ever calls two things on these SDKs: `OpenAIEmbeddings` (to embed a string)
and `PineconeStore.fromExistingIndex(...).similaritySearch(...)` (to query top-3 vectors filtered by
`fileName`). It never uses `PineconeStore`'s write path - there's no upsert call anywhere in the app
(`scripts/seed.ts` only touches Supabase, not Pinecone - no conflict, leave it alone). Replace with:
  - `POST https://api.openai.com/v1/embeddings` (raw fetch, `Authorization: Bearer ${OPENAI_KEY}`,
    `model: "text-embedding-3-small"` or whatever the existing `OpenAIEmbeddings` default resolves to -
    check before assuming) to replace the embedding step.
  - Pinecone's REST query API directly (`POST https://<index-host>/query` with the embedding vector,
    `topK: 3`, `filter: { fileName: companionFileName }`) to replace `similaritySearch`. The host
    resolution logic already exists in `getPineconeIndex()` (`lib/memory.ts:62-72`) - reuse the same
    `PINECONE_HOST`/`PINECONE_INDEX` env vars, just point raw fetch at that host instead of handing it
    to the `Pinecone` client.
  - This is the biggest known lever: three LangChain/Pinecone packages pull large transitive dependency
    trees for what is functionally two REST calls.

**b. `app/api/chat/[chatId]/route.ts:234-264` - drop the `openai` SDK.** Single non-streaming
`openai.chat.completions.create(...)` call, no other SDK usage anywhere else in the codebase (confirmed
by grep - this is the only file importing from `"openai"`). 1:1 swap to
`fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization:
\`Bearer ${OPENAI_KEY}\`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages })
})`, then read `.choices[0].message.content` off the parsed JSON same as today.

**c. `lib/stripe.ts` + `app/api/webhook/route.ts` - drop the `stripe` SDK.** Two calls to replace:
  - `stripe.subscriptions.retrieve(id)` → `GET https://api.stripe.com/v1/subscriptions/{id}` with
    `Authorization: Bearer ${STRIPE_SECRET_KEY}`.
  - `stripe.webhooks.constructEvent(body, signature, secret)` → manual signature verification using the
    Web Crypto API: parse the `Stripe-Signature` header (`t=<timestamp>,v1=<hex signature>`), compute
    `HMAC-SHA256` over `${timestamp}.${rawBody}` via `crypto.subtle.importKey` +
    `crypto.subtle.sign(...)`, compare the hex digest to `v1` (constant-time compare), and reject if the
    timestamp is outside a 5-minute tolerance. This is exactly what Stripe's own SDK does internally -
    no external library needed, and `nodejs_compat` gives Workers a working `crypto` global either way,
    but Web Crypto is the more portable choice here.
  - **This one needs real testing before shipping**, not just a read-through. Even though checkout is
    currently disabled app-wide, the webhook still writes real `user_subscription` rows from real Stripe
    events (any subscription created before the free-tier pivot may still renew and fire
    `invoice.payment_succeeded`). Use `stripe listen --forward-to <deployed-url>/api/webhook` and
    `stripe trigger checkout.session.completed` / `stripe trigger invoice.payment_succeeded` against the
    deployed Worker before treating this as done - a signature-verification bug here either silently
    drops real billing events or accepts spoofed ones.

### Step 3 - explicitly out of scope, do not touch

- `@supabase/supabase-js` / `@supabase/auth-helpers-nextjs` - core auth/DB, touches every route in the
  app, was never identified as a major chunk contributor in the original analysis. Rewriting this is a
  much bigger, riskier project than this plan's size-budget problem justifies.
- `@upstash/redis` / `@upstash/ratelimit` - these are already thin REST wrappers over `fetch` under the
  hood, minimal bundle cost, not worth touching.
- `ai` / `@ai-sdk/react` - only imported in `app/(chat)/(routes)/chat/[chatId]/components/client.tsx`, a
  `"use client"` component. Client component code goes into client JS bundles, not the server Worker -
  same reason the old doc found `antd` wasn't in the server bundle despite being a dependency. Don't
  "fix" something that isn't actually contributing to the Worker size.
- `next-cloudinary` - client-side widget, same reasoning as above.

### Step 4 - remeasure after each SDK removal

After each of 2a/2b/2c: remove the now-unused package(s) from `package.json`, `pnpm install`, rebuild,
`wrangler deploy --dry-run` again, and re-check the metafile to confirm the expected chunk actually
shrank or disappeared. Don't batch all three changes before measuring once - if the target is hit after
2a alone, 2b/2c (especially the Stripe webhook rewrite, the riskiest one) may not be worth doing.

### Step 5 - ship it

Once under 3072 KiB (2560 KiB stretch goal): real `wrangler deploy` (not dry-run) to a preview/staging
environment if one is set up, then smoke-test the actual deployed app - companion chat end-to-end
(exercises the OpenAI + Pinecone + Redis rewrite together) and the Stripe webhook via the CLI forwarding
described in step 2c. Don't call this done off a passing build/dry-run alone.

### Step 6 - close the loop on the old doc

Once deployment actually succeeds, update `dev_readme-cloudflare-pages.md` - its title currently says
"NOT AN OPTION," which will no longer be true. Record the final gzip size and what got rewritten, so it
doesn't mislead the next person who opens it expecting a standing block. Follow `commit-naming.md`
(`docs: ...`, 30-40 char hard limit) for that commit, kept separate from the deploy code commit(s).

<br/>

## 4. Open questions to resolve during implementation, not before

- Exact embedding model string `OpenAIEmbeddings` defaults to when constructed as
  `new OpenAIEmbeddings({ openAIApiKey })` with no `modelName` - check the installed
  `@langchain/openai` version's default before hardcoding it in the raw-fetch replacement, so retrieval
  quality doesn't silently change.
- Whether Pinecone's REST query response shape needs any field mapping to match what
  `similarDocs.map(doc => doc.pageContent)` currently expects (`app/api/chat/[chatId]/route.ts:231`) -
  confirm the raw response's metadata field name before wiring it in.
- Whether a Cloudflare preview/staging environment exists to test against before a real production
  `wrangler deploy` - if not, that's a separate, smaller setup step before step 5.
