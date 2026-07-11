// The ONLY project-specific file in the backup feature. Everything the routes and the SDK need
// that varies from one project to the next lives here: which tables/buckets are backed up, how
// each table's columns round-trip through CSV, who is allowed to run a backup, which rows/files a
// given caller may read or write, and how to build a public URL for a stored file. To port this
// feature into another project, copy the whole backup folder and edit only this file (see
// dev_readme-backup.md for the questions to answer). This file implements the same interface as
// 19_spotify-clone's backupConfig.ts — that's what makes the routes/SDK identical across projects.
//
// This project (26_hot-delivery) backs up admin-curated data. Unlike a per-user app, food/jobs/etc
// have no owner column — access is gated on the caller's role including "ADMIN" (see
// assertBackupAccess), and file ownership is simply bucket membership.

import type { SupabaseClient } from "@supabase/supabase-js"

// ── tables ────────────────────────────────────────────────────────────────────
//
// CSV stores every cell as text. PostgREST coerces most column types (timestamp/uuid/enum/bool)
// from a string on upsert, but three kinds must be handled explicitly so they survive a
// round-trip, so each table declares them:
//   numericColumns — sent as a JS number, never the string "42" (a title of "123" must stay text)
//   arrayColumns   — Postgres text[] written/read as an array literal, e.g. {a,b}
//   jsonColumns    — jsonb and jsonb[] written/read as JSON so structure is preserved
//
// scopeSelect/scopeRows implement per-user row-level scoping. None of this project's tables need
// them (a single ADMIN gate covers everything — see assertBackupAccess), so every table below
// omits both; the routes fall back to an unfiltered select/upsert. Contrast
// 19_spotify-clone's backupConfig.ts, which sets both on every table for per-user scoping.
export interface IBackupTableConfig {
  name: string
  // Column(s) that form the primary key, for upsert conflict resolution. Composite keys are
  // comma-separated, e.g. "prod_id,price_id".
  onConflict: string
  numericColumns: string[]
  arrayColumns: string[]
  jsonColumns: string[]
  scopeSelect?: (
    admin: SupabaseClient,
    userId: string,
  ) => Promise<{
    data: Record<string, unknown>[] | null
    error: { message: string; code?: string; details?: string; hint?: string } | null
  }>
  scopeRows?: (admin: SupabaseClient, userId: string, rows: Record<string, unknown>[]) => Promise<Record<string, unknown>[]>
}

// Ordered FK-safe (parents before children). Hot-delivery has no cross-table FKs among these, so
// order is arbitrary here, but the SDK still imports in this order for consistency.
export const BACKUP_TABLES: IBackupTableConfig[] = [
  {
    name: "food_live",
    onConflict: "prod_id,price_id",
    numericColumns: ["price"],
    arrayColumns: ["images"],
    jsonColumns: ["ingredients"],
  },
  {
    name: "food_test",
    onConflict: "prod_id,price_id",
    numericColumns: ["price"],
    arrayColumns: ["images"],
    jsonColumns: ["ingredients"],
  },
  {
    name: "jobs",
    onConflict: "id_url",
    numericColumns: ["pay"],
    arrayColumns: ["images"],
    jsonColumns: [],
  },
  {
    name: "tickets",
    onConflict: "owner_id",
    numericColumns: ["rate_amount", "rate_avg"],
    arrayColumns: [],
    jsonColumns: [],
  },
  {
    // types_db.ts: messages.image_url is a single nullable string, not an array — no coercion needed.
    name: "messages",
    onConflict: "id",
    numericColumns: [],
    arrayColumns: [],
    jsonColumns: [],
  },
  {
    name: "utm_stats",
    onConflict: "id",
    numericColumns: ["id"],
    arrayColumns: [],
    jsonColumns: [],
  },
]

export type TBackupTableName = string

export function getTableConfig(name: string): IBackupTableConfig | undefined {
  return BACKUP_TABLES.find(table => table.name === name)
}

// ── buckets ───────────────────────────────────────────────────────────────────

export const BACKUP_BUCKETS = ["food-live", "food-test", "ingredients"] as const
export type TBackupBucket = (typeof BACKUP_BUCKETS)[number]

export function isBackupBucket(value: string): value is TBackupBucket {
  return (BACKUP_BUCKETS as readonly string[]).includes(value)
}

export interface IBackupFileRef {
  bucket: string
  path: string
  size: number
  contentType: string
}

// ── files: list + ownership ─────────────────────────────────────────────────
//
// No per-file owner column exists in this project, so listFiles walks the buckets directly and
// isOwnedFile is just bucket membership — every ADMIN may read/write every file in a backup
// bucket. (Contrast 19_spotify-clone's backupConfig.ts, where both derive from a per-user table.)
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
}

function contentTypeFor(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? ""
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream"
}

const LIST_PAGE_SIZE = 100

// Walk one bucket depth-first, collecting every object's full path. Supabase Storage has no
// recursive listing — a `list(prefix)` entry with no `id` is a folder, so we recurse into it.
async function listBucketFiles(admin: SupabaseClient, bucket: string, prefix: string, out: IBackupFileRef[]): Promise<void> {
  let offset = 0
  for (;;) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } })
    if (error) throw error
    if (!data || data.length === 0) break

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      // A folder placeholder has no id/metadata; recurse into it. A real object has an id.
      if (entry.id === null || entry.id === undefined) {
        await listBucketFiles(admin, bucket, path, out)
      } else {
        out.push({ bucket, path, size: entry.metadata?.size ?? 0, contentType: contentTypeFor(path) })
      }
    }

    if (data.length < LIST_PAGE_SIZE) break
    offset += LIST_PAGE_SIZE
  }
}

export async function listFiles(admin: SupabaseClient, _userId: string): Promise<IBackupFileRef[]> {
  const files: IBackupFileRef[] = []
  for (const bucket of BACKUP_BUCKETS) {
    await listBucketFiles(admin, bucket, "", files)
  }
  return files
}

export async function isOwnedFile(_admin: SupabaseClient, _userId: string, bucket: string, _path: string): Promise<boolean> {
  return isBackupBucket(bucket)
}

// ── access boundary ─────────────────────────────────────────────────────────
//
// Replaces a per-user ownership check. The service-role client bypasses RLS, so the route must
// decide in application code who may back up. Here: the caller's users.roles must include "ADMIN"
// (column is "roles", plural — see app/interfaces/types_db.ts's users.Row and
// Navbar.tsx's `.select("roles")`). Returns true if allowed; `admin` is the service-role client
// (bypasses RLS to read the column).
export async function assertBackupAccess(userId: string, admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin.from("users").select("roles").eq("id", userId).single()
  if (error || !data) return false
  const roles = (data as { roles?: string[] | null }).roles ?? []
  return roles.includes("ADMIN")
}

// ── public URL ──────────────────────────────────────────────────────────────
//
// Builds the public CDN URL the browser downloads each stored file from during a files export.
// Same formula every Supabase public bucket uses. path is the object key within the bucket.
export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set — set it to build public file URLs")
  const base = supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}
