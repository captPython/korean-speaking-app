import { describe, expect, it } from 'vitest'
import { emptyProgress, focusOrder, masteredCount, recordAttempt, streak } from './progress'

describe('recordAttempt', () => {
  it('keeps the best score, counts attempts and logs the day once', () => {
    let p = recordAttempt(emptyProgress(), 'hello', 70, '2026-10-03')
    p = recordAttempt(p, 'hello', 50, '2026-10-03')
    expect(p.phrases.hello).toEqual({ best: 70, attempts: 2, last: '2026-10-03' })
    expect(p.days).toEqual(['2026-10-03'])
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    expect(streak(['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'], '2026-10-03')).toBe(4)
  })

  it('still counts when today has no practice yet', () => {
    expect(streak(['2026-10-01', '2026-10-02'], '2026-10-03')).toBe(2)
  })

  it('breaks on a gap and crosses month boundaries', () => {
    expect(streak(['2026-09-28', '2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2)
    expect(streak([], '2026-10-01')).toBe(0)
  })
})

describe('focusOrder and masteredCount', () => {
  it('puts weakest practiced phrases first, then new ones, skipping mastered', () => {
    let p = emptyProgress()
    p = recordAttempt(p, 'a', 95, '2026-10-03')
    p = recordAttempt(p, 'b', 60, '2026-10-03')
    p = recordAttempt(p, 'c', 40, '2026-10-03')
    expect(focusOrder(['a', 'b', 'c', 'd'], p)).toEqual(['c', 'b', 'd'])
    expect(masteredCount(p)).toBe(1)
  })
})
