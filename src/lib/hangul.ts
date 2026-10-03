// Hangul comparison helpers: normalize transcripts, break syllables into
// jamo (letters), and score how close an attempt is to the target phrase.

const SYLLABLE_START = 0xac00
const SYLLABLE_END = 0xd7a3

const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const FINALS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ']

/** Keeps only Hangul syllables, jamo, letters and digits; drops spaces and punctuation. */
export function normalize(text: string): string {
  return text.normalize('NFC').replace(/[^\p{Script=Hangul}\p{L}\p{N}]/gu, '').toLowerCase()
}

/** Splits text into jamo, e.g. "한" -> ["ㅎ", "ㅏ", "ㄴ"]. Non-syllables pass through. */
export function toJamo(text: string): string[] {
  const out: string[] = []
  for (const char of text) {
    const code = char.codePointAt(0)!
    if (code < SYLLABLE_START || code > SYLLABLE_END) {
      out.push(char)
      continue
    }
    const index = code - SYLLABLE_START
    out.push(INITIALS[Math.floor(index / 588)], MEDIALS[Math.floor((index % 588) / 28)])
    const final = FINALS[index % 28]
    if (final) out.push(final)
  }
  return out
}

export function editDistance<T>(a: readonly T[], b: readonly T[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

/** 0-100 similarity between target and attempt, measured letter by letter (jamo). */
export function score(target: string, attempt: string): number {
  const a = toJamo(normalize(target))
  const b = toJamo(normalize(attempt))
  const longest = Math.max(a.length, b.length)
  if (longest === 0) return 0
  return Math.round((1 - editDistance(a, b) / longest) * 100)
}

export type SyllableMark = { char: string; matched: boolean }

/**
 * Marks each character of the target (spaces kept for display) as matched
 * when it lines up with the attempt via the longest common subsequence.
 */
export function markSyllables(target: string, attempt: string): SyllableMark[] {
  const t = [...normalize(target)]
  const h = [...normalize(attempt)]
  const lcs = Array.from({ length: t.length + 1 }, () => new Array<number>(h.length + 1).fill(0))
  for (let i = t.length - 1; i >= 0; i--) {
    for (let j = h.length - 1; j >= 0; j--) {
      lcs[i][j] = t[i] === h[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const matched = new Array<boolean>(t.length).fill(false)
  for (let i = 0, j = 0; i < t.length && j < h.length; ) {
    if (t[i] === h[j]) {
      matched[i] = true
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      i++
    } else {
      j++
    }
  }

  const marks: SyllableMark[] = []
  let k = 0
  for (const char of target.normalize('NFC')) {
    if (normalize(char) === '') {
      marks.push({ char, matched: true })
    } else {
      marks.push({ char, matched: matched[k++] })
    }
  }
  return marks
}

// Romanization (Revised Romanization) for each jamo position.
const INITIAL_SOUNDS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', 'silent', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const MEDIAL_SOUNDS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const FINAL_SOUNDS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']

type Parts = { initial: number; medial: number; final: number }

function parts(syllable: string): Parts | null {
  const code = syllable.codePointAt(0)!
  if (code < SYLLABLE_START || code > SYLLABLE_END) return null
  const index = code - SYLLABLE_START
  return { initial: Math.floor(index / 588), medial: Math.floor((index % 588) / 28), final: index % 28 }
}

// Pairs beginners commonly mix up, keyed by "a|b" in either order.
const TIPS: Record<string, string> = {
  'ㅓ|ㅗ': 'ㅓ (eo) is open, lips relaxed; ㅗ (o) rounds the lips.',
  'ㅓ|ㅕ': 'ㅕ (yeo) starts with a quick "y" glide before ㅓ (eo).',
  'ㅗ|ㅛ': 'ㅛ (yo) starts with a quick "y" glide before ㅗ (o).',
  'ㅐ|ㅔ': 'ㅐ (ae) and ㅔ (e) sound almost the same today; either is usually fine.',
  'ㅡ|ㅜ': 'ㅡ (eu) keeps lips flat and spread; ㅜ (u) rounds them.',
  'ㄱ|ㅋ': 'ㅋ (k) has a strong puff of air; ㄱ (g) is soft.',
  'ㄱ|ㄲ': 'ㄲ (kk) is tense with no puff of air.',
  'ㄷ|ㅌ': 'ㅌ (t) has a strong puff of air; ㄷ (d) is soft.',
  'ㄷ|ㄸ': 'ㄸ (tt) is tense with no puff of air.',
  'ㅂ|ㅍ': 'ㅍ (p) has a strong puff of air; ㅂ (b) is soft.',
  'ㅂ|ㅃ': 'ㅃ (pp) is tense with no puff of air.',
  'ㅈ|ㅊ': 'ㅊ (ch) has a strong puff of air; ㅈ (j) is soft.',
  'ㅈ|ㅉ': 'ㅉ (jj) is tense with no puff of air.',
  'ㅅ|ㅆ': 'ㅆ (ss) is tense and hissy; ㅅ (s) is lighter.',
  'ㄴ|ㅇ': 'Final ㄴ (n) touches the tongue tip up; final ㅇ (ng) is at the back of the mouth.',
}

function tipFor(a: string, b: string): string | undefined {
  return TIPS[`${a}|${b}`] ?? TIPS[`${b}|${a}`]
}

export type SyllableHint = {
  target: string
  heard: string | null
  message: string
  tip?: string
}

type Op = { kind: 'match' | 'sub' | 'del' | 'ins'; target?: string; heard?: string }

/** Syllable-level alignment (edit distance with backtrace). */
export function alignSyllables(target: string, attempt: string): Op[] {
  const t = [...normalize(target)]
  const h = [...normalize(attempt)]
  const d = Array.from({ length: t.length + 1 }, (_, i) =>
    Array.from({ length: h.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= t.length; i++) {
    for (let j = 1; j <= h.length; j++) {
      const cost = t[i - 1] === h[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }

  const ops: Op[] = []
  let i = t.length
  let j = h.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (t[i - 1] === h[j - 1] ? 0 : 1)) {
      ops.push({ kind: t[i - 1] === h[j - 1] ? 'match' : 'sub', target: t[i - 1], heard: h[j - 1] })
      i--
      j--
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ kind: 'del', target: t[i - 1] })
      i--
    } else {
      ops.push({ kind: 'ins', heard: h[j - 1] })
      j--
    }
  }
  return ops.reverse()
}

function describeSubstitution(target: string, heard: string): Omit<SyllableHint, 'target' | 'heard'> {
  const a = parts(target)
  const b = parts(heard)
  if (!a || !b) return { message: `Say ${target} instead of ${heard}.` }

  const diffs: string[] = []
  let tip: string | undefined
  if (a.initial !== b.initial) {
    const x = INITIALS[a.initial]
    const y = INITIALS[b.initial]
    diffs.push(`start with ${x} (${INITIAL_SOUNDS[a.initial]}), not ${y} (${INITIAL_SOUNDS[b.initial]})`)
    tip ??= tipFor(x, y)
  }
  if (a.medial !== b.medial) {
    const x = MEDIALS[a.medial]
    const y = MEDIALS[b.medial]
    diffs.push(`vowel ${x} (${MEDIAL_SOUNDS[a.medial]}), not ${y} (${MEDIAL_SOUNDS[b.medial]})`)
    tip ??= tipFor(x, y)
  }
  if (a.final !== b.final) {
    const x = FINALS[a.final]
    const y = FINALS[b.final]
    if (!x) diffs.push(`no final consonant (you added ${y})`)
    else if (!y) diffs.push(`end with ${x} (${FINAL_SOUNDS[a.final]})`)
    else diffs.push(`end with ${x} (${FINAL_SOUNDS[a.final]}), not ${y} (${FINAL_SOUNDS[b.final]})`)
    if (x && y) tip ??= tipFor(x, y)
  }
  return { message: `${target}: ${diffs.join('; ')}.`, tip }
}

/** One hint per target syllable that was missed or said differently. */
export function syllableHints(target: string, attempt: string): SyllableHint[] {
  const hints: SyllableHint[] = []
  for (const op of alignSyllables(target, attempt)) {
    if (op.kind === 'sub') {
      hints.push({ target: op.target!, heard: op.heard!, ...describeSubstitution(op.target!, op.heard!) })
    } else if (op.kind === 'del') {
      hints.push({ target: op.target!, heard: null, message: `${op.target} was missed. Say every syllable.` })
    }
  }
  return hints
}
