import { describe, it, expect } from 'vitest'
import { phraseOfTheDay, PHRASES } from './phrases'

describe('phraseOfTheDay', () => {
  it('同一日付では常に同じ一言を返す（安定）', () => {
    const a = phraseOfTheDay(new Date(2026, 4, 24))
    const b = phraseOfTheDay(new Date(2026, 4, 24))
    expect(a).toBe(b)
  })

  it('同じ日付の別時刻でも同じ一言を返す', () => {
    const morning = phraseOfTheDay(new Date(2026, 4, 24, 1, 0, 0))
    const night = phraseOfTheDay(new Date(2026, 4, 24, 23, 59, 59))
    expect(morning).toBe(night)
  })

  it('返り値は必ず PHRASES の中に含まれる（範囲内）', () => {
    // 連続する日付を一巡以上ぶん回して確認する
    for (let i = 0; i < PHRASES.length * 3; i++) {
      const d = new Date(2026, 0, 1 + i)
      expect(PHRASES).toContain(phraseOfTheDay(d))
    }
  })

  it('異なる日ではインデックス（一言）が変わる', () => {
    const day1 = phraseOfTheDay(new Date(2026, 4, 24))
    const day2 = phraseOfTheDay(new Date(2026, 4, 25))
    expect(day1).not.toBe(day2)
  })

  it('PHRASES.length 日後には同じ一言に戻る（周期性）', () => {
    const base = new Date(2026, 4, 24)
    const sameAfterCycle = new Date(2026, 4, 24 + PHRASES.length)
    expect(phraseOfTheDay(base)).toBe(phraseOfTheDay(sameAfterCycle))
  })

  it('引数省略時も例外なく PHRASES 内の値を返す', () => {
    expect(PHRASES).toContain(phraseOfTheDay())
  })
})
