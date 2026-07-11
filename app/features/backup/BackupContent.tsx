"use client"

import { useRef, useState } from "react"
import { FiDownload, FiUpload, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi"
import { twMerge } from "tailwind-merge"

import { useDbBackup } from "./useDbBackup"
import { Button } from "@/components/shared"

type BackupMode = "tables" | "files"

const actionButtonClassName =
  "w-full border-brand bg-brand/10 text-brand hover:bg-brand/20 transition-colors duration-150"

export function BackupContent() {
  const backup = useDbBackup()
  const [mode, setMode] = useState<BackupMode>("tables")
  const tablesInputRef = useRef<HTMLInputElement>(null)
  const filesInputRef = useRef<HTMLInputElement>(null)

  // Kick off the import, then clear the input so re-selecting the same file fires onChange again.
  function handleTablesFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files?.length) backup.startImportTables(files)
    e.target.value = ""
  }

  function handleFilesFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files?.length) backup.startImportFiles(files)
    e.target.value = ""
  }

  const isExportingTables = backup.tablesExportPhase === "exporting"
  const isImportingTables = backup.tablesImportPhase === "importing"
  const isExportingFiles = backup.filesExportPhase === "exporting"
  const isImportingFiles = backup.filesImportPhase === "importing"
  const isBusy = isExportingTables || isImportingTables || isExportingFiles || isImportingFiles
  const showStallNotice = backup.isStalled

  return (
    <div className="flex min-h-0 flex-col gap-y-4">
      <p className="text-sm text-subTitle">
        Back up your rows and your files separately — each has its own export and import.
      </p>

      <div className="flex gap-x-2 rounded-lg border border-border-color bg-background p-1">
        {(
          [
            { value: "tables", label: "Tables (rows)" },
            { value: "files", label: "Files (storage)" },
          ] as const
        ).map(option => {
          const isActive = mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              disabled={isBusy}
              aria-pressed={isActive}
              className={twMerge(
                "flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors duration-150",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-transparent text-subTitle hover:bg-active-color hover:text-title",
              )}>
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-y-4">
        {mode === "tables" && (
          <section className="flex flex-col gap-y-4 rounded-xl border border-border-color bg-background p-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-title">Tables (rows)</h3>
              <p className="text-xs text-subTitle">Food, jobs, tickets, messages, and utm stats as CSV.</p>
            </div>

            <div className="flex flex-col gap-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subTitle">Export</p>
              <Button onClick={backup.startExportTables} disabled={isBusy} className={actionButtonClassName}>
                <FiDownload size={15} />
                {isExportingTables ? "Exporting tables…" : "Export tables as CSV"}
              </Button>

              {isExportingTables && (
                <div className="flex flex-col gap-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground">
                    <div
                      style={{ width: `${backup.tablesExportProgress}%` }}
                      className="h-full rounded-full bg-brand transition-all duration-200"
                    />
                  </div>
                  <p className="text-right text-xs text-subTitle">
                    {backup.tablesExportDone} / {backup.tablesExportTotal} tables
                  </p>
                </div>
              )}

              {backup.tablesExportPhase === "done" && (
                <div className="flex items-center gap-x-2 text-sm text-success">
                  <FiCheckCircle size={14} />
                  <span>Tables archive downloaded — check your downloads folder.</span>
                </div>
              )}

              {backup.tablesExportPhase === "error" && (
                <div className="flex items-start gap-x-2 text-sm text-danger">
                  <FiAlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="break-words">{backup.tablesExportError ?? "Tables export failed."}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subTitle">Import</p>
              <input
                ref={tablesInputRef}
                type="file"
                accept=".csv,.tar.gz,.gz,.tgz"
                multiple
                className="hidden"
                onChange={handleTablesFileChange}
              />

              <Button
                type="button"
                onClick={() => tablesInputRef.current?.click()}
                disabled={isBusy}
                className={actionButtonClassName}>
                <FiUpload size={15} />
                {isImportingTables ? "Importing tables…" : "Import tables (.csv or .tar.gz)…"}
              </Button>

              {isImportingTables && (
                <div className="flex flex-col gap-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground">
                    <div
                      style={{ width: `${backup.tablesImportProgress}%` }}
                      className="h-full rounded-full bg-brand transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-x-2">
                    <p className="truncate text-xs text-subTitle">{backup.tablesImportLabel}</p>
                    <p className="shrink-0 text-xs text-subTitle">
                      {backup.tablesImportDone} / {backup.tablesImportTotal}
                    </p>
                  </div>
                </div>
              )}

              {backup.tablesImportResult && backup.tablesImportPhase === "done" && (
                <div className="flex flex-col gap-y-1 rounded-md border border-border-color bg-foreground p-3">
                  {backup.tablesImportResult.tables.map(table => (
                    <div key={table.table} className="flex items-center gap-x-2 text-xs text-subTitle">
                      <FiCheckCircle size={12} className="shrink-0 text-success" />
                      <span>
                        <span className="font-mono text-title">{table.table}</span>
                        {" → "}
                        {table.rows} rows
                        {table.skipped > 0 && <span className="text-subTitle"> ({table.skipped} skipped)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {backup.tablesImportPhase === "error" && (
                <div className="flex items-start gap-x-2 text-sm text-danger">
                  <FiAlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="break-words">{backup.tablesImportError ?? "Tables import failed."}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {mode === "files" && (
          <section className="flex flex-col gap-y-4 rounded-xl border border-border-color bg-background p-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-title">Files (storage)</h3>
              <p className="text-xs text-subTitle">
                Every file in food-live, food-test, and ingredients as a .tar.gz archive.
              </p>
            </div>

            <div className="flex flex-col gap-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subTitle">Export</p>
              <Button onClick={backup.startExportFiles} disabled={isBusy} className={actionButtonClassName}>
                <FiDownload size={15} />
                {isExportingFiles ? "Exporting files…" : "Export files as archive"}
              </Button>

              {isExportingFiles && (
                <div className="flex flex-col gap-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground">
                    <div
                      style={{ width: `${backup.filesExportProgress}%` }}
                      className="h-full rounded-full bg-brand transition-all duration-200"
                    />
                  </div>
                  <p className="text-right text-xs text-subTitle">
                    {backup.filesExportDone} / {backup.filesExportTotal} files
                  </p>
                </div>
              )}

              {backup.filesExportPhase === "done" && (
                <div className="flex items-center gap-x-2 text-sm text-success">
                  <FiCheckCircle size={14} />
                  <span>Files archive downloaded — check your downloads folder.</span>
                </div>
              )}

              {backup.filesExportPhase === "error" && (
                <div className="flex items-start gap-x-2 text-sm text-danger">
                  <FiAlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="break-words">{backup.filesExportError ?? "Files export failed."}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subTitle">Import</p>
              <input
                ref={filesInputRef}
                type="file"
                accept=".tar.gz,.gz,.tgz"
                className="hidden"
                onChange={handleFilesFileChange}
              />

              <Button
                type="button"
                onClick={() => filesInputRef.current?.click()}
                disabled={isBusy}
                className={actionButtonClassName}>
                <FiUpload size={15} />
                {isImportingFiles ? "Importing files…" : "Import files archive (.tar.gz)…"}
              </Button>

              {isImportingFiles && (
                <div className="flex flex-col gap-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground">
                    <div
                      style={{ width: `${backup.filesImportProgress}%` }}
                      className="h-full rounded-full bg-brand transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-x-2">
                    <p className="truncate text-xs text-subTitle">{backup.filesImportLabel}</p>
                    <p className="shrink-0 text-xs text-subTitle">
                      {backup.filesImportDone} / {backup.filesImportTotal}
                    </p>
                  </div>
                </div>
              )}

              {backup.filesImportResult && backup.filesImportPhase === "done" && (
                <div className="flex flex-col gap-y-1 rounded-md border border-border-color bg-foreground p-3">
                  {backup.filesImportResult.buckets.map(bucket => (
                    <div key={bucket.bucket} className="flex items-center gap-x-2 text-xs text-subTitle">
                      <FiCheckCircle size={12} className="shrink-0 text-success" />
                      <span>
                        <span className="font-mono text-title">{bucket.bucket}</span>
                        {" → "}
                        {bucket.files} files
                        {bucket.failed > 0 && <span className="text-subTitle"> ({bucket.failed} skipped)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {backup.filesImportPhase === "error" && (
                <div className="flex items-start gap-x-2 text-sm text-danger">
                  <FiAlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="break-words">{backup.filesImportError ?? "Files import failed."}</span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {showStallNotice && (
        <div
          className="flex items-start gap-x-2 rounded-md border border-warning/40 bg-warning/10
          p-2.5 text-xs text-warning">
          <FiClock size={13} className="mt-0.5 shrink-0" />
          <span className="break-words">
            Taking longer than usual{backup.activeLabel ? ` — still ${backup.activeLabel}` : ""}. A large library or a slow
            connection can cause this; leave this open while it finishes.
          </span>
        </div>
      )}

      <p className="text-xs text-subTitle">
        Import merges data — existing rows and files are <span className="text-title">replaced</span>, nothing is deleted.
      </p>
    </div>
  )
}