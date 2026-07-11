type SlidingWindowEntry = {
  timestamps: number[]
}

type FixedWindowEntry = {
  count: number
  reset: number
}

const rateLimitStore = new Map<string, SlidingWindowEntry>()
const fixedWindowStore = new Map<string, FixedWindowEntry>()
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

export function memoryFixedWindowGetRemaining({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}) {
  const now = Date.now()
  const current = fixedWindowStore.get(key)

  if (!current || current.reset <= now) {
    const reset = now + windowMs
    fixedWindowStore.set(key, { count: 0, reset })
    return {
      remaining: limit,
      reset,
    }
  }

  return {
    remaining: Math.max(0, limit - current.count),
    reset: current.reset,
  }
}

export function memoryFixedWindowLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}) {
  const now = Date.now()
  const current = fixedWindowStore.get(key)

  if (!current || current.reset <= now) {
    const reset = now + windowMs
    fixedWindowStore.set(key, { count: 1, reset })
    return {
      remaining: Math.max(0, limit - 1),
      reset,
      success: true,
    }
  }

  if (current.count >= limit) {
    return {
      remaining: 0,
      reset: current.reset,
      success: false,
    }
  }

  const next = {
    count: current.count + 1,
    reset: current.reset,
  }
  fixedWindowStore.set(key, next)

  return {
    remaining: Math.max(0, limit - next.count),
    reset: next.reset,
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
  current.sort((first, second) => first.score - second.score)
  sortedSetStore.set(key, current)
}

export function memorySortedSetExists(key: string) {
  return (sortedSetStore.get(key)?.length ?? 0) > 0
}

export function memorySortedSetRangeByScore(key: string, maxScore: number) {
  return (sortedSetStore.get(key) ?? []).filter(item => item.score <= maxScore).map(item => item.member)
}
