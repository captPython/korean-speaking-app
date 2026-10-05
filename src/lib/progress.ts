// Practice progress kept on this device: per-phrase stats and practice days.

export const MASTERED_SCORE = 90

export type PhraseStats = { best: number; attempts: number; last: string }

export type Progress = {
  phrases: Record<string, PhraseStats>
  days: string[] // local dates (YYYY-MM-DD) with at least one attempt, ascending
}

const KEY = 'ksa.progress'
const LEGACY_BEST_KEY = 'ksa.best'

export const emptyProgress = (): Progress => ({ phrases: {}, days: [] })

export function localDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptyProgress(), ...JSON.parse(raw) }

    // Carry over best scores saved by the first version of the app.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_BEST_KEY) ?? '{}') as Record<string, number>
    const progress = emptyProgress()
    for (const [id, best] of Object.entries(legacy)) {
      progress.phrases[id] = { best, attempts: 1, last: '' }
    }
    return progress
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Storage can be unavailable (private mode); progress just isn't kept.
  }
}

export function recordAttempt(progress: Progress, id: string, score: number, today: string): Progress {
  const prev = progress.phrases[id]
  const stats: PhraseStats = {
    best: Math.max(prev?.best ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
    last: today,
  }
  const days = progress.days.includes(today) ? progress.days : [...progress.days, today].sort()
  return { phrases: { ...progress.phrases, [id]: stats }, days }
}

function previousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return localDate(new Date(y, m - 1, d - 1))
}

/** Consecutive practice days ending today, or yesterday if today has none yet. */
export function streak(days: string[], today: string): number {
  const set = new Set(days)
  let day = set.has(today) ? today : previousDay(today)
  let count = 0
  while (set.has(day)) {
    count++
    day = previousDay(day)
  }
  return count
}

export function masteredCount(progress: Progress): number {
  return Object.values(progress.phrases).filter((s) => s.best >= MASTERED_SCORE).length
}

/**
 * Focus order: practiced-but-not-mastered phrases, lowest best score first,
 * then phrases not practiced yet. Mastered phrases are left out.
 */
export function focusOrder(ids: string[], progress: Progress): string[] {
  const weak = ids
    .filter((id) => progress.phrases[id] && progress.phrases[id].best < MASTERED_SCORE)
    .sort((a, b) => progress.phrases[a].best - progress.phrases[b].best)
  const fresh = ids.filter((id) => !progress.phrases[id])
  return [...weak, ...fresh]
}
