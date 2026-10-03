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
