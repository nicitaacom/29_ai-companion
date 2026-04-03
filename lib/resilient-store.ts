type SlidingWindowEntry = {
  timestamps: number[]
}

const rateLimitStore = new Map<string, SlidingWindowEntry>()
const listStore = new Map<string, string[]>()
const sortedSetStore = new Map<string, Array<{ member: string; score: number }>>()

function pruneTimestamps(timestamps: number[], windowMs: number, now: number) {
  return timestamps.filter(timestamp => now - timestamp < windowMs)
}

export function memorySlidingWindowLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}) {
  const now = Date.now()
  const current = rateLimitStore.get(key) ?? { timestamps: [] }
  const active = pruneTimestamps(current.timestamps, windowMs, now)

  if (active.length >= limit) {
    return {
      reset: active[0] + windowMs,
      success: false,
    }
  }

  active.push(now)
  rateLimitStore.set(key, { timestamps: active })

  return {
    reset: active[0] + windowMs,
    success: true,
  }
}

export function memoryListRange(key: string, start: number, end: number) {
  const current = listStore.get(key) ?? []
  const normalizedEnd = end < 0 ? current.length : end + 1
  return current.slice(start, normalizedEnd)
}

export function memoryListPush(key: string, value: string) {
  const current = listStore.get(key) ?? []
  current.push(value)
  listStore.set(key, current)
}

export function memorySortedSetAdd(key: string, value: { member: string; score: number }) {
  const current = sortedSetStore.get(key) ?? []
  current.push(value)
  current.sort((a, b) => a.score - b.score)
  sortedSetStore.set(key, current)
}

export function memorySortedSetExists(key: string) {
  return (sortedSetStore.get(key)?.length ?? 0) > 0
}

export function memorySortedSetRangeByScore(key: string, maxScore: number) {
  return (sortedSetStore.get(key) ?? []).filter(item => item.score <= maxScore).map(item => item.member)
}
