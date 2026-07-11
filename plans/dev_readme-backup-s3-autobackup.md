# Plan: automatic Redis-throttled DB+storage backup to S3 (`jompanion-backup`)

This is a planning document for a new chat session to implement. Read `dev_readme-eslint.md` first -
this repo's ESLint fully enforces its conventions (T/I type prefixes, `imports-order`,
`api-folder-requires-api-namespace`, etc.) and any new route/type here must pass `pnpm lint`. Also read
`app/features/backup/dev_readme-backup.md` in full before touching anything in that folder - see
section 1 below for why it needs to be read critically, not copied from.

**Interpreting the ask:** "redis with TLS of 6h" is read as **TTL**, not TLS - Redis has no concept of a
per-key "TLS," and a 6-hour freshness window on a Redis key is exactly how you'd throttle a background
job triggered by page visits. If that reading is wrong, stop at section 4 and confirm before building.

<br/>

## 1. `app/features/backup` is a foreign template - it does not describe this app yet

`app/features/backup/backupConfig.ts` and `dev_readme-backup.md` were copied in from a **different**
project (their own comments say so: `backupConfig.ts:6-7` - "This file implements the same interface as
19_spotify-clone's backupConfig.ts... To port this feature into another project, copy the whole backup
folder and edit only this file"). As of today they still describe that other project, not jompanion:

- `BACKUP_TABLES` lists `food_live`, `food_test`, `jobs`, `tickets`, `messages`, `utm_stats` - a
  hot-delivery/admin-role schema. None of `food_live`/`food_test`/`jobs`/`tickets` exist in jompanion.
- `BACKUP_BUCKETS` lists `food-live`, `food-test`, `ingredients` - storage buckets that don't exist here.
- `assertBackupAccess` gates on a `users.roles` array containing `"ADMIN"` - jompanion's real table is
  `29_users` with a `role` column (singular name, `TEXT[]` default `{USER}` - see `dev_readme-supabase-sql.md`
  lines 64-73), not `users.roles`.
- `BackupContent.tsx`'s copy ("Food, jobs, tickets, messages, and utm stats") is the other project's text.

This means the manual browser-driven export/import feature this folder implements is currently
**non-functional for jompanion** - it would 404/error against tables that don't exist. Whether or not
this plan's S3 auto-backup ships, `backupConfig.ts` needs a real rewrite before the existing manual
feature (`DbBackupModal`, if it's even wired into `AccountContent.tsx` here - check) can work at all.
That rewrite is step 2 below and is a prerequisite, not optional scope creep - the automated backup this
plan adds reuses `tarClient.ts`/`csvClient.ts` from this same folder, and having a config file that
lies about the schema next to it is a landmine for whoever touches this folder next.

<br/>

## 2. jompanion's real backup surface

From `dev_readme-supabase-sql.md` and a fresh grep of the tree (no `.storage.from(` call exists
anywhere in this codebase - confirmed):

| Table | Status | Include in auto-backup? |
| --- | --- | --- |
| `29_users` | live | yes |
| `29_category` | live | yes |
| `29_companion` | live | yes |
| `29_messages` | live | yes |
| `user_subscription` | legacy, but still written by `app/api/webhook/route.ts` on real Stripe events | yes - it's small and still real data |
| `29_user_balance` | **not yet created** (planned in `dev_readme-generate-image-feature.md`) | skip until it exists - `select` on a missing table just errors, don't guess at its shape here |
| `29_balance_transactions` | **not yet created**, same plan | skip until it exists |
| `utm_stats` | live, but **SHARED across 4 other projects** (14_portfolio, 23_store, 28_notion-clone, 29_jompanion) | **recommend excluding** - a `jompanion-backup` bucket snapshotting a table that's 80% other projects' rows is misleading and wastes S3 space on data this app doesn't own. Flag this to the user rather than silently deciding either way. |

**Storage files:** jompanion has **zero Supabase Storage buckets in use today** - `29_companion.src` and
`29_users.avatar_url` are plain `TEXT` URLs (Cloudinary via `next-cloudinary`, or external avatar URLs
like GitHub/Google), not Supabase-managed objects. So "backup storage files" has nothing to back up
*yet*. Build the files-backup code path so it's a real, working no-op (`BACKUP_BUCKETS = []`, the loop
over buckets just does nothing) rather than fabricating bucket names - don't invent Storage buckets that
don't exist just to have something to point the S3 upload at. If Storage buckets get added to this app
later, this becomes a one-line config change, not new plumbing.

<br/>

## 3. Two-key Redis design (not one NX-EX lock)

A single `SET key NX EX 21600` lock has a real failure mode: if the backup throws partway through (S3
down, a table select fails), the lock is already set, and the job won't retry for up to 6 hours - a
transient failure turns into a silent multi-hour backup gap with no visibility. Use two keys instead:

- **`backup:auto:lastSuccess`** - plain value (ISO timestamp), written **only after a fully successful
  run**. Checked with a simple `GET` + age comparison against 6h. This is "is a backup due."
- **`backup:auto:workLock`** - `SET NX EX 300` (5 min), acquired right before doing the work, released
  implicitly by its own short TTL. This is "is a backup already running right now," and exists purely to
  stop two near-simultaneous page visits from both starting a run. It is deliberately short-lived and
  independent of the 6h freshness window.

Flow: not due (`lastSuccess` fresh) → skip. Due, but `workLock` can't be acquired (someone else already
started) → skip. Due and lock acquired → run the backup; on success, write `lastSuccess = now`; on
failure, log and **do not** write `lastSuccess`, so the next visitor (once the 5-min work lock expires)
retries automatically instead of waiting out the full 6h window.

Use `Redis.fromEnv()` from `@upstash/redis`, the same client construction already used in
`classes/RateLimit/RateLimitSDK.ts:30` and `lib/memory.ts:24` - don't add a second Redis client
configuration.

<br/>

## 4. Trigger: middleware does the cheap gate, a Node route does the heavy work

`middleware.ts` already runs on every request (no `matcher` exported, so it's effectively global) and
already receives a `NextFetchEvent` implicitly available for `waitUntil` - Next's middleware signature
supports `(req: NextRequest, event: NextFetchEvent)`, and Vercel Edge Middleware supports
`event.waitUntil(promise)` for fire-and-forget background work that doesn't delay the response.

1. In `middleware.ts`, after the existing session/guest-cookie logic, check `req.nextUrl.pathname` isn't
   an API/static/asset request (middleware currently runs on *every* request including `/api/*`, `/_next/*`,
   images, fonts - gate this to actual page navigations, e.g. skip if pathname starts with `/api`,
   `/_next`, or matches a static-file extension, so the Redis check doesn't fire on every JS chunk).
2. `@upstash/redis`'s REST client is fetch-based and Edge-safe (this is presumably why Upstash was
   chosen over a TCP Redis client in this repo already) - so middleware can do the cheap `GET
   backup:auto:lastSuccess` freshness check directly, inline, without adding latency worth worrying
   about (one REST round-trip, same cost as the existing `supabase.auth.getSession()` call already in
   this file).
3. Only when a backup is actually due: `event.waitUntil(fetch(new URL("/api/backup/auto", req.url), {
   method: "POST", headers: { "x-internal-backup-trigger": <shared secret> } }))` - fire-and-forget,
   never awaited, never blocks the page response. The shared-secret header is a cheap guard so
   `/api/backup/auto` isn't a fully public POST endpoint anyone can hit directly to force early runs
   (low severity either way, since the work-lock still caps frequency to once per 5 min worst case, but
   free to add).
4. `app/api/backup/auto/route.ts` - `export const runtime = "nodejs"` (matches
   `app/api/chat/[chatId]/route.ts:17`'s existing convention; needed because this route uses `Buffer`
   for tar building via the reused `tarClient.ts`, and Node's `crypto`/`Buffer` are guaranteed there in a
   way Edge doesn't guarantee). This route re-checks the work lock itself (defense in depth - never
   trust that middleware is the only caller) and does the actual work: select rows, build the archive,
   upload to S3, write `lastSuccess` on success.

**Why not just do everything in middleware?** Because Edge Runtime's `Buffer`/crypto support is
inconsistent enough that reusing `tarClient.ts` (which the manual backup feature already leans on
`Buffer.alloc`/`Buffer.concat` for, per its own header comment) is safer in a real Node route. Keep
middleware to what it's already good at here: fast, cheap, REST-based checks.

<br/>

## 5. The backup job itself (`app/api/backup/auto/route.ts`)

Reuse, don't reinvent - this folder already has zero-dependency tar/gzip/csv code:

- `addTarEntry` / `finalizeTar` from `tarClient.ts` to build the tables archive (same as
  `BackupSDK.ts`'s `exportTables`, just run server-side instead of browser-side).
- `toCsv` from `csvClient.ts` per table.
- Node's own `zlib.gzip` (promisified) instead of `gzipBufferClient`'s browser `CompressionStream` -
  this route runs in Node, so use the native module directly rather than the browser-safe shim; the
  output format is the same gzip stream either way (`dev_readme-backup.md`'s own note: "a standard gzip
  stream, so the server's Node `gunzipBuffer` decompresses it identically").

**Full dump, not per-user scoped.** This is the critical difference from the existing manual feature:
`BackupContent.tsx`'s export is a *user* exporting *their own* rows (`scopeSelect`/`scopeRows` in
`backupConfig.ts`'s design). The automated S3 backup is an admin-level snapshot of the *entire* table
across all users - it must call `supabaseAdmin.from(table).select("*")` unscoped for every table in
section 2's "yes" list, and must **not** try to reuse `scopeSelect` (there's no per-request `userId` to
scope by in a background job, and even if there were, a partial per-user dump isn't what "backup the
database" means). Keep this as its own small table-name list, not entangled with whatever `scopeSelect`
config the corrected `backupConfig.ts` ends up with for the manual feature.

**Archive layout in S3**, one object per successful run (not one growing object):

```
s3://jompanion-backup/tables/29_backup-tables-<ISO-date>T<ISO-time>.tar.gz
s3://jompanion-backup/files/29_backup-files-<ISO-date>T<ISO-time>.tar.gz   (empty archive today - see section 2)
```

Include the time, not just the date, in the key - this job can run more than once a day in principle
(every 6h), and a date-only key would silently overwrite the same day's earlier backup.

**S3 client: `aws4fetch`, not `@aws-sdk/client-s3`.** `dev_readme-cloudflare-pages.md` and
`plans/dev_readme-cloudflare-deploy.md` (sibling plan, same repo) already established that
`@aws-sdk/client-s3` is heavy enough to matter for a future Cloudflare Workers deploy, and that
`aws4fetch` (a tiny fetch-based S3-compatible client, AWS SigV4 signing via Web Crypto) is the chosen
replacement. Building a brand-new S3 integration on the AWS SDK today would just recreate the exact
bundle-size problem that other plan is trying to undo - use `aws4fetch` from the start here so there's
nothing to migrate later. It works fine in a Node route too, it isn't Workers-specific.

<br/>

## 6. S3 setup

### Scoped IAM policy

The policy you pasted grants access to several *other* projects' buckets (`emails-*`, `scraper-files`,
`scraper-files-eu-central-1`, `supabase-backup-*`) - unrelated to this app. Below is the same shape,
scoped to only `jompanion-backup`. Two things had to change beyond just the `Resource` list:

- `s3:ListAllMyBuckets` **cannot** be scoped to a single bucket ARN - AWS only accepts `Resource: "*"`
  for that action (it lists every bucket in the account by definition). Kept as its own statement.
- Everything else (`GetBucketLocation`, `CreateBucket`, `PutBucketPolicy`,
  `PutBucketPublicAccessBlock`, object CRUD, `ListBucket`, versioning actions) scopes cleanly to the
  bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:CreateBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucketVersions",
        "s3:DeleteObjectVersion",
        "s3:PutObjectAcl",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::jompanion-backup",
        "arn:aws:s3:::jompanion-backup/*"
      ]
    }
  ]
}
```

Apply this yourself in the AWS IAM console (or hand it to whichever tool manages that policy) - this
plan doesn't assume write access to AWS. Once the bucket exists, `PutBucketPublicAccessBlock` should be
called once to block all public access (a backup bucket holding user rows should never be public) -
worth doing as a one-time manual step or a tiny setup script, not on every backup run.

### Env vars (new, to add to `.env.example` and `lib/env-validation.ts`)

Following this repo's existing flat-uppercase convention (`UPSTASH_REDIS_REST_URL`, `PINECONE_API_KEY`,
`STRIPE_SECRET_KEY`, etc. - see `lib/env-validation.ts:81-95`):

| Var | Purpose |
| --- | --- |
| `BACKUP_S3_ACCESS_KEY_ID` | IAM access key |
| `BACKUP_S3_SECRET_ACCESS_KEY` | IAM secret |
| `BACKUP_S3_REGION` | e.g. `eu-central-1` (match wherever `jompanion-backup` actually gets created) |
| `BACKUP_S3_BUCKET` | `jompanion-backup` - kept as an env var rather than hardcoded so staging/prod can differ |
| `BACKUP_INTERNAL_SECRET` | shared secret for the middleware→route header from section 4 step 3 |

Don't wire real values in code - you said credentials come later. Land the env var *names* and the
client construction that reads them (`lib/backupS3Client.ts` or similar, `aws4fetch`'s `AwsClient`
constructed from these four vars), so plugging in real credentials is a one-time `.env` edit with
nothing else to change. Add the four S3 vars to `getProductionEnvIssues()` in `lib/env-validation.ts`
(`validateNonEmpty` is fine for all of them) so a misconfigured deploy fails loudly in middleware instead
of failing silently inside a `waitUntil` background job where nobody's watching the logs.

### Retention

Not specified in the ask - flagging rather than deciding. Every 6h run adds one ~small object forever;
at 4/day that's manageable for years given how small these tables are, but it's still unbounded growth
with no code-side cleanup in this plan. The standard fix is an **S3 Lifecycle rule** (e.g. expire objects
under `tables/` and `files/` after 90 days) configured on the bucket itself, not app code - it needs no
extra IAM permissions beyond what's already in the policy above and doesn't add a delete path the app
has to get right. Set this in the S3 console when the bucket is created, or decide "keep everything" and
skip it - either is reasonable, just shouldn't be silently decided by whoever implements this.

<br/>

## 7. Step-by-step implementation order

1. Rewrite `app/features/backup/backupConfig.ts` for jompanion's real schema (section 2's table list,
   `29_users.role` not `roles`, `BACKUP_BUCKETS = []`) and fix `dev_readme-backup.md`'s copy
   (`BackupContent.tsx`'s "Food, jobs, tickets..." text too) - this unblocks the existing manual feature
   regardless of whether it was ever actually wired up in `AccountContent.tsx` (check).
2. Add the four `BACKUP_S3_*` + `BACKUP_INTERNAL_SECRET` env vars to `.env.example` and
   `lib/env-validation.ts`.
3. Add `aws4fetch` as a dependency; build a small S3 upload helper (bucket, key, body, content-type →
   `PutObject` via `AwsClient`) - a few lines, no need for a full SDK wrapper.
4. Build `app/api/backup/auto/route.ts` (Node runtime): work-lock re-check, full-table `select("*")` per
   section 5's list, tar+gzip via the reused helpers, upload to S3, write `lastSuccess` on success only.
5. Wire the middleware trigger (section 4): pathname gate, `lastSuccess` freshness check, `waitUntil` +
   internal-secret header.
6. Manually verify: hit a page, confirm (via logs or an S3 console check) exactly one backup object
   appears; hit more pages within 6h and confirm no new object; force a failure (bad S3 creds) and
   confirm `lastSuccess` is *not* written so the next visit retries.
7. Update `app/features/backup/dev_readme-backup.md` to document the new automated path alongside the
   existing manual one, following its own "Verified working in production on <date>" convention once
   confirmed - don't leave the doc describing only the manual half of the feature.

<br/>

## 8. Open questions to resolve during implementation, not before

- Is `DbBackupModal`/`BackupContent` actually rendered anywhere in jompanion today (`AccountContent.tsx`
  or equivalent), or did only the `app/features/backup/` folder get copied without wiring the UI in?
  Changes whether step 1 is "fix a live feature" or "fix dead code that happens to share a folder with
  new code."
- Whether `utm_stats` should be included after all - section 2 recommends excluding it, but it's the
  owner's call given it's shared infra across 4 projects.
- Exact `BACKUP_S3_REGION` / bucket region - pick whatever the real AWS bucket ends up created in.
- Whether 6h is measured from the *start* or *end* of the previous successful run - this plan uses
  "time since `lastSuccess` was written," i.e. from completion, which is simpler and avoids double-counting
  a slow run's own duration against the next window.
