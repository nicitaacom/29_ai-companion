# Cloudflare Deployment — NOT AN OPTION (do not re-attempt without reading this)

## 0. Why this doc exists

Someone will eventually see "Cloudflare" in the stack wishlist and try to deploy this app there via
OpenNext (`@opennextjs/cloudflare`). This was already attempted end-to-end and hit a hard platform
limit, not a config mistake. Read this before trying again, so the same investigation isn't repeated.

## 2. Terminology

- **Worker size limit** — Cloudflare caps the compressed (gzip) size of a single Worker script.
  Free plan: **3 MiB**. Paid Workers plan ($5/mo): **10 MiB**.
- **`default` server function** — the single OpenNext-generated Worker (`handler.mjs`) that bundles
  _every_ Next.js route (pages + API routes + server actions) and every server-side dependency they
  import, into one script. OpenNext supports splitting routes into separate Workers ("multi-worker"),
  but the setup that was tested here used the default single-Worker mode.

## 3. What was tried (numbers, so this isn't re-litigated from scratch)

Full setup was completed and verified working: `wrangler.jsonc`, `open-next.config.ts`,
`initOpenNextCloudflareForDev()` in `next.config.js`, pinned `wrangler`/`@opennextjs/cloudflare`
devDependencies, `pnpm-workspace.yaml` build allowlist for `esbuild`/`workerd`, `.gitignore` entries,
`deploy`/`preview` scripts. `pnpm build` passed clean, `opennextjs-cloudflare build` succeeded,
`wrangler deploy --dry-run` validated bindings correctly (`WORKER_SELF_REFERENCE`, `ASSETS`).

The actual `wrangler deploy` failed with `[code: 10027]`:

```
Your Worker exceeded the size limit of 3 MiB. Please upgrade to a paid plan to deploy Workers up to 10 MiB.
```

Measured sizes (gzip, `wrangler deploy --dry-run` total upload):

| State                                                                       | Total gzip  | Over 3 MiB (3072 KiB) by |
| --------------------------------------------------------------------------- | ----------- | ------------------------ |
| Initial full setup                                                          | 3546.30 KiB | ~474 KiB                 |
| After swapping `@aws-sdk/client-s3` → `aws4fetch` in `app/libs/S3Client.ts` | 3352.55 KiB | ~280 KiB                 |

Root cause via esbuild `--metafile` analysis of `handler.mjs`: this is a real dependency-footprint
problem, not a fixable bug. Notable findings:

- `antd` is **not** in the server bundle at all — Next.js already tree-shakes it to client-only chunks.
  Not a contributor, don't investigate this again.
- `moment-timezone` sits in its own isolated ~1076 KiB (uncompressed) chunk — confirmed by grepping for
  IANA tz strings (`Africa/Abidjan`) with no other library markers in that chunk. Used across 13 files
  (order timing, rate-limiting, delivery windows, CMS). This is the single biggest remaining lever.
- `stripe` server SDK is smeared across a shared ~676 KiB chunk (with `openai`/`pusher-js`) and a
  ~112 KiB chunk — harder to isolate, smaller apparent win, and used across 13 files including live
  payment flows (card/Apple/Google Pay, checkout sessions) plus admin product CRUD.

## 4. Decisions made AGAINST (do not silently redo these)

- **Against upgrading to the Cloudflare Workers paid plan** just to clear the limit. Owner's call —
  not doing this to make the bundle fit.
- **Against refactoring `moment-timezone` → native `Intl.DateTimeFormat`** across its 13 call sites to
  chase the remaining ~280 KiB. Would likely clear the limit but wasn't executed — stopped before
  starting per owner's instruction.
- **Against rewriting the `stripe` Node SDK as raw `fetch()` calls to `api.stripe.com`.** Touches live
  payment processing for a smaller, less certain size win than moment-timezone. Not worth the risk here.
- **Against route-splitting into multiple Workers** (OpenNext "multi-worker" mode) as a structural
  workaround. Never investigated in depth — bigger architectural change than was in scope.
- **All Cloudflare-specific files were reverted** (`wrangler.jsonc`, `open-next.config.ts`, the
  `next.config.js` dev-init call, `package.json` scripts/deps, `pnpm-workspace.yaml` build allowlist,
  `.gitignore` entries, `eslint.config.mjs` ignore for `.open-next/**`). Current deploy target for this
  app is whatever it was before this investigation (not Cloudflare) — check `readme.md` / actual hosting
  config for the real answer, don't assume Cloudflare is even partially wired up.

## Reproduction steps (if this gets revisited later)

1. `pnpm add -D wrangler@latest @opennextjs/cloudflare@latest`
2. Add `esbuild`/`workerd` to `pnpm-workspace.yaml` `onlyBuiltDependencies` + `allowBuilds`, then `pnpm install`
3. Minimal `wrangler.jsonc`: `name`, `main: ".open-next/worker.js"`, `compatibility_date`,
   `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`,
   `assets: { directory: ".open-next/assets", binding: "ASSETS" }`,
   `services: [{ "binding": "WORKER_SELF_REFERENCE", "service": "<name>" }]`
4. `open-next.config.ts`: `export default defineCloudflareConfig()`
5. Add `.open-next/**` and `.wrangler/**` to `eslint.config.mjs` ignores — otherwise the `build` script's
   `eslint .` lints OpenNext's generated output and fails on unrelated rule errors.
6. Build + measure: `pnpm exec opennextjs-cloudflare build && npx wrangler deploy --dry-run` — check the
   `Total Upload: ... / gzip: ...` line against 3072 KiB.
7. To find what's actually bloating the bundle: read
   `.open-next/server-functions/default/handler.mjs.meta.json` (esbuild metafile,
   `bundle-server.js` writes it automatically) and/or `grep` the raw chunk files under
   `.open-next/server-functions/default/.next/server/chunks/` for library-specific string markers
   (e.g. tz names for moment-timezone, `stripe.com` for Stripe) — most heavy deps get pre-bundled by
   Turbopack into opaque hash-named chunks, so the metafile alone under-attributes package names.

## TODO

- [ ] If Cloudflare becomes a real requirement again: either get sign-off on the paid Workers plan, or
      budget real time for the `moment-timezone` refactor (13 files) as the primary size fix.
- [ ] Nothing currently blocks staying off Cloudflare — this file exists purely so the next attempt
      doesn't re-run the same investigation from zero.
