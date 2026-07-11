import { useState, useRef, useEffect } from "react"

import {
  exportTables,
  exportFiles,
  importTables,
  importFiles,
  downloadBlob,
  type ITablesImportResult,
  type IFilesImportResult,
} from "./BackupSDK"
import useToast from "@/store/shared/useToast"

type TablesExportPhase = "idle" | "exporting" | "done" | "error"
type TablesImportPhase = "idle" | "importing" | "done" | "error"
type FilesExportPhase = "idle" | "exporting" | "done" | "error"
type FilesImportPhase = "idle" | "importing" | "done" | "error"

// How long with no progress update before the UI shows "taking longer than usual".
const STALL_THRESHOLD_MS = 10_000

export function useDbBackup() {
  const toast = useToast()

  // Tables export state
  const [tablesExportPhase, setTablesExportPhase] = useState<TablesExportPhase>("idle")
  const [tablesExportDone, setTablesExportDone] = useState(0)
  const [tablesExportTotal, setTablesExportTotal] = useState(0)
  const [tablesExportError, setTablesExportError] = useState<string | null>(null)

  // Tables import state
  const [tablesImportPhase, setTablesImportPhase] = useState<TablesImportPhase>("idle")
  const [tablesImportDone, setTablesImportDone] = useState(0)
  const [tablesImportTotal, setTablesImportTotal] = useState(0)
  const [tablesImportLabel, setTablesImportLabel] = useState("")
  const [tablesImportResult, setTablesImportResult] = useState<ITablesImportResult | null>(null)
  const [tablesImportError, setTablesImportError] = useState<string | null>(null)

  // Files export state
  const [filesExportPhase, setFilesExportPhase] = useState<FilesExportPhase>("idle")
  const [filesExportDone, setFilesExportDone] = useState(0)
  const [filesExportTotal, setFilesExportTotal] = useState(0)
  const [filesExportError, setFilesExportError] = useState<string | null>(null)

  // Files import state
  const [filesImportPhase, setFilesImportPhase] = useState<FilesImportPhase>("idle")
  const [filesImportDone, setFilesImportDone] = useState(0)
  const [filesImportTotal, setFilesImportTotal] = useState(0)
  const [filesImportLabel, setFilesImportLabel] = useState("")
  const [filesImportResult, setFilesImportResult] = useState<IFilesImportResult | null>(null)
  const [filesImportError, setFilesImportError] = useState<string | null>(null)

  // "Taking longer than usual" watchdog: bump lastProgressRef on every progress event; a 1s ticker
  // flips isStalled on once nothing has advanced for STALL_THRESHOLD_MS, and back off on the next
  // progress event. Marks stall detection so a genuinely stuck operation is distinguishable from a
  // slow-but-alive one.
  const [isStalled, setIsStalled] = useState(false)
  const lastProgressRef = useRef(0)
  function bumpProgress() {
    lastProgressRef.current = Date.now()
    setIsStalled(false)
  }

  useEffect(() => {
    lastProgressRef.current = Date.now()
  }, [])

  const isBusy =
    tablesExportPhase === "exporting" ||
    tablesImportPhase === "importing" ||
    filesExportPhase === "exporting" ||
    filesImportPhase === "importing"

  useEffect(() => {
    if (!isBusy) return
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isBusy])

  useEffect(() => {
    if (!isBusy) {
      let cancelled = false
      queueMicrotask(() => {
        if (!cancelled) setIsStalled(false)
      })
      return () => {
        cancelled = true
      }
    }
    const timer = setInterval(() => {
      setIsStalled(Date.now() - lastProgressRef.current > STALL_THRESHOLD_MS)
    }, 1000)
    return () => clearInterval(timer)
  }, [isBusy])

  async function startExportTables() {
    setTablesExportPhase("exporting")
    setTablesExportDone(0)
    setTablesExportTotal(0)
    setTablesExportError(null)
    bumpProgress()

    try {
      const { fileName, archive } = await exportTables((done, total) => {
        bumpProgress()
        setTablesExportDone(done)
        setTablesExportTotal(total)
      })
      downloadBlob(archive, fileName)
      toast.show("success", "Tables backup downloaded!")
      setTablesExportPhase("done")
    } catch (error) {
      setTablesExportPhase("error")
      const message = error instanceof Error ? error.message : "Tables export failed"
      setTablesExportError(message)
      toast.show("error", message)
    }
  }

  async function startExportFiles() {
    setFilesExportPhase("exporting")
    setFilesExportDone(0)
    setFilesExportTotal(0)
    setFilesExportError(null)
    bumpProgress()

    try {
      const { fileName, archive } = await exportFiles((done, total) => {
        bumpProgress()
        setFilesExportDone(done)
        setFilesExportTotal(total)
      })
      downloadBlob(archive, fileName)
      toast.show("success", "Files backup downloaded!")
      setFilesExportPhase("done")
    } catch (error) {
      setFilesExportPhase("error")
      const message = error instanceof Error ? error.message : "Files export failed"
      setFilesExportError(message)
      toast.show("error", message)
    }
  }

  async function startImportFiles(files: FileList) {
    if (!files.length) return
    setFilesImportPhase("importing")
    setFilesImportDone(0)
    setFilesImportTotal(0)
    setFilesImportLabel("Reading archive…")
    setFilesImportResult(null)
    setFilesImportError(null)
    bumpProgress()

    try {
      const importFilesResp = await importFiles(files[0], (done, total, label) => {
        bumpProgress()
        setFilesImportDone(done)
        setFilesImportTotal(total)
        setFilesImportLabel(label)
      })
      setFilesImportResult(importFilesResp)
      setFilesImportPhase("done")

      const totalFiles = importFilesResp.buckets.reduce((sum, bucket) => sum + bucket.files, 0)
      toast.show("success", `Restored ${totalFiles} files.`)
    } catch (error) {
      setFilesImportPhase("error")
      const message = error instanceof Error ? error.message : "Files import failed"
      setFilesImportError(message)
      toast.show("error", message)
    }
  }

  async function startImportTables(files: FileList) {
    if (!files.length) return
    setTablesImportPhase("importing")
    setTablesImportDone(0)
    setTablesImportTotal(0)
    setTablesImportLabel("Reading files…")
    setTablesImportResult(null)
    setTablesImportError(null)
    bumpProgress()

    try {
      const importTablesResp = await importTables(Array.from(files), (done, total, label) => {
        bumpProgress()
        setTablesImportDone(done)
        setTablesImportTotal(total)
        setTablesImportLabel(label)
      })
      setTablesImportResult(importTablesResp)
      setTablesImportPhase("done")

      const totalRows = importTablesResp.tables.reduce((sum, table) => sum + table.rows, 0)
      toast.show("success", `Restored ${totalRows} rows across ${importTablesResp.tables.length} tables.`)
    } catch (error) {
      setTablesImportPhase("error")
      const message = error instanceof Error ? error.message : "Tables import failed"
      setTablesImportError(message)
      toast.show("error", message)
    }
  }

  function reset() {
    setTablesExportPhase("idle")
    setTablesExportDone(0)
    setTablesExportTotal(0)
    setTablesExportError(null)
    setTablesImportPhase("idle")
    setTablesImportDone(0)
    setTablesImportTotal(0)
    setTablesImportLabel("")
    setTablesImportResult(null)
    setTablesImportError(null)
    setFilesExportPhase("idle")
    setFilesExportDone(0)
    setFilesExportTotal(0)
    setFilesExportError(null)
    setFilesImportPhase("idle")
    setFilesImportDone(0)
    setFilesImportTotal(0)
    setFilesImportLabel("")
    setFilesImportResult(null)
    setFilesImportError(null)
  }

  const tablesExportProgress = tablesExportTotal > 0 ? Math.round((tablesExportDone / tablesExportTotal) * 100) : 0
  const tablesImportProgress = tablesImportTotal > 0 ? Math.round((tablesImportDone / tablesImportTotal) * 100) : 0
  const filesExportProgress = filesExportTotal > 0 ? Math.round((filesExportDone / filesExportTotal) * 100) : 0
  const filesImportProgress = filesImportTotal > 0 ? Math.round((filesImportDone / filesImportTotal) * 100) : 0

  // The label of whichever operation is currently running — used by the stall notice so it can say
  // what is still in flight.
  const activeLabel =
    tablesExportPhase === "exporting" ? "exporting tables" :
    filesExportPhase === "exporting" ? "exporting files" :
    tablesImportPhase === "importing" ? (tablesImportLabel || "importing tables") :
    filesImportPhase === "importing" ? (filesImportLabel || "importing files") :
    ""

  return {
    isBusy, isStalled, activeLabel,
    tablesExportPhase, tablesExportProgress, tablesExportDone, tablesExportTotal, tablesExportError, startExportTables,
    tablesImportPhase, tablesImportProgress, tablesImportDone, tablesImportTotal, tablesImportLabel,
    tablesImportResult, tablesImportError, startImportTables,
    filesExportPhase, filesExportProgress, filesExportDone, filesExportTotal, filesExportError,
    startExportFiles,
    filesImportPhase, filesImportProgress, filesImportDone, filesImportTotal, filesImportLabel,
    filesImportResult, filesImportError, startImportFiles,
    reset,
  }
}
