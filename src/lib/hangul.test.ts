import { describe, expect, it } from 'vitest'
import { markSyllables, normalize, score, syllableHints, toJamo } from './hangul'

describe('normalize', () => {
  it('drops spaces and punctuation', () => {
    expect(normalize('이거 얼마예요?')).toBe('이거얼마예요')
  })
})

describe('toJamo', () => {
  it('splits syllables with and without a final consonant', () => {
    expect(toJamo('한국')).toEqual(['ㅎ', 'ㅏ', 'ㄴ', 'ㄱ', 'ㅜ', 'ㄱ'])
    expect(toJamo('가')).toEqual(['ㄱ', 'ㅏ'])
  })

  it('handles the last syllable in the block', () => {
    expect(toJamo('힣')).toEqual(['ㅎ', 'ㅣ', 'ㅎ'])
  })
})

describe('score', () => {
  it('is 100 for an exact match, ignoring spacing and punctuation', () => {
    expect(score('물 주세요', '물주세요.')).toBe(100)
  })

  it('gives partial credit for a near miss', () => {
    // 계세요 vs 가세요 differs by one vowel
    const s = score('안녕히 계세요', '안녕히 가세요')
    expect(s).toBeGreaterThan(85)
    expect(s).toBeLessThan(100)
  })

  it('is 0 for an empty attempt', () => {
    expect(score('안녕하세요', '')).toBe(0)
  })
})

describe('markSyllables', () => {
  it('flags the syllable that was missed and keeps spaces', () => {
    const marks = markSyllables('안녕히 계세요', '안녕히 가세요')
    expect(marks.map((m) => m.char).join('')).toBe('안녕히 계세요')
    expect(marks.filter((m) => !m.matched).map((m) => m.char)).toEqual(['계'])
  })
})

describe('syllableHints', () => {
  it('names the vowel difference and gives a tip', () => {
    const [hint] = syllableHints('안녕히 계세요', '안녕히 가세요')
    expect(hint.target).toBe('계')
    expect(hint.heard).toBe('가')
    expect(hint.message).toBe('계: vowel ㅖ (ye), not ㅏ (a).')
  })

  it('gives the aspiration tip for ㄱ vs ㅋ', () => {
    const [hint] = syllableHints('감사합니다', '캄사합니다')
    expect(hint.message).toContain('start with ㄱ (g), not ㅋ (k)')
    expect(hint.tip).toContain('puff of air')
  })

  it('reports a missed syllable', () => {
    const hints = syllableHints('감사합니다', '감사합니')
    expect(hints).toEqual([{ target: '다', heard: null, message: '다 was missed. Say every syllable.' }])
  })

  it('returns nothing for a perfect attempt', () => {
    expect(syllableHints('물 주세요', '물주세요')).toEqual([])
  })
})
