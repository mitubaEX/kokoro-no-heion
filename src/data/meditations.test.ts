import { describe, it, expect } from 'vitest'
import { PATTERNS, DURATION_OPTIONS } from './meditations'

describe('PATTERNS（呼吸パターン）', () => {
  it('パターンが1件以上ある', () => {
    expect(PATTERNS.length).toBeGreaterThan(0)
  })

  it('id がすべてユニーク', () => {
    const ids = PATTERNS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('各 pattern が非空の phases を持ち、各 phase の seconds が正の値', () => {
    for (const p of PATTERNS) {
      // メタ情報は非空文字列
      expect(p.id.trim().length).toBeGreaterThan(0)
      expect(p.name.trim().length).toBeGreaterThan(0)
      expect(p.desc.trim().length).toBeGreaterThan(0)
      // phases: 非空配列
      expect(Array.isArray(p.phases)).toBe(true)
      expect(p.phases.length).toBeGreaterThan(0)
      // 各 phase
      for (const phase of p.phases) {
        expect(typeof phase.seconds).toBe('number')
        expect(phase.seconds).toBeGreaterThan(0)
        expect(Number.isFinite(phase.seconds)).toBe(true)
        expect(phase.label.trim().length).toBeGreaterThan(0)
        expect(['inhale', 'hold', 'exhale', 'rest']).toContain(phase.kind)
      }
    }
  })
})

describe('DURATION_OPTIONS', () => {
  it('選択肢が1件以上ある', () => {
    expect(DURATION_OPTIONS.length).toBeGreaterThan(0)
  })

  it('すべて正の有限な値', () => {
    for (const d of DURATION_OPTIONS) {
      expect(typeof d).toBe('number')
      expect(d).toBeGreaterThan(0)
      expect(Number.isFinite(d)).toBe(true)
    }
  })

  it('重複がない', () => {
    expect(new Set(DURATION_OPTIONS).size).toBe(DURATION_OPTIONS.length)
  })
})
