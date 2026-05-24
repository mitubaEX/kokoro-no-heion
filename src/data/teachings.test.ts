import { describe, it, expect } from 'vitest'
import { TEACHINGS, THEMES, teachingsByTheme } from './teachings'

describe('TEACHINGS', () => {
  it('教えが1件以上ある', () => {
    expect(TEACHINGS.length).toBeGreaterThan(0)
  })

  it('全 teaching が必須フィールドを正しく持つ', () => {
    for (const t of TEACHINGS) {
      // text: 非空文字列
      expect(typeof t.text).toBe('string')
      expect(t.text.trim().length).toBeGreaterThan(0)
      // source: 非空文字列
      expect(typeof t.source).toBe('string')
      expect(t.source.trim().length).toBeGreaterThan(0)
      // note: 非空文字列
      expect(typeof t.note).toBe('string')
      expect(t.note.trim().length).toBeGreaterThan(0)
      // theme: 非空配列
      expect(Array.isArray(t.theme)).toBe(true)
      expect(t.theme.length).toBeGreaterThan(0)
    }
  })

  it('id がすべてユニーク', () => {
    const ids = TEACHINGS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('id が非空文字列', () => {
    for (const t of TEACHINGS) {
      expect(typeof t.id).toBe('string')
      expect(t.id.trim().length).toBeGreaterThan(0)
    }
  })

  it('各 theme は THEMES に含まれるラベルである', () => {
    const allowed = new Set<string>(THEMES)
    for (const t of TEACHINGS) {
      for (const theme of t.theme) {
        expect(allowed.has(theme)).toBe(true)
      }
    }
  })
})

describe('teachingsByTheme', () => {
  it('指定テーマを含む教えだけを返す', () => {
    for (const theme of THEMES) {
      const result = teachingsByTheme(theme)
      for (const t of result) {
        expect(t.theme).toContain(theme)
      }
    }
  })

  it('全テーマの結果を合わせると全教えを網羅する', () => {
    const covered = new Set<string>()
    for (const theme of THEMES) {
      for (const t of teachingsByTheme(theme)) {
        covered.add(t.id)
      }
    }
    expect(covered.size).toBe(TEACHINGS.length)
  })
})
