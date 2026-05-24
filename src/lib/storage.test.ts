import { describe, it, expect, beforeEach } from 'vitest'
import { get, set, remove, STORAGE_KEYS } from './storage'

// storage.ts の内部定数に依存しない範囲で振る舞いを検証する。
// 名前空間プレフィックスと保存フォーマットは内部実装だが、
// 破損・バージョン不一致ケースの確認のため実キーを直接組み立てる。
const NAMESPACE = 'khe:'
const SCHEMA_VERSION = 1

describe('storage（jsdom / localStorage）', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('未保存のキーは fallback を返す', () => {
    expect(get(STORAGE_KEYS.settings, 'fallback')).toBe('fallback')
    expect(get(STORAGE_KEYS.diary, 42)).toBe(42)
  })

  it('set → get で値が往復する（プリミティブ）', () => {
    expect(set(STORAGE_KEYS.settings, 'hello')).toBe(true)
    expect(get(STORAGE_KEYS.settings, 'fallback')).toBe('hello')
  })

  it('set → get で値が往復する（オブジェクト）', () => {
    const value = { volume: 0.7, soundscape: 'waves', nested: { on: true } }
    expect(set(STORAGE_KEYS.settings, value)).toBe(true)
    expect(get(STORAGE_KEYS.settings, null)).toEqual(value)
  })

  it('remove 後は fallback に戻る', () => {
    set(STORAGE_KEYS.history, [1, 2, 3])
    expect(get(STORAGE_KEYS.history, [])).toEqual([1, 2, 3])
    remove(STORAGE_KEYS.history)
    expect(get(STORAGE_KEYS.history, [])).toEqual([])
  })

  it('破損 JSON の場合は fallback を返す', () => {
    localStorage.setItem(`${NAMESPACE}${STORAGE_KEYS.settings}`, '{ not json ]')
    expect(get(STORAGE_KEYS.settings, 'fallback')).toBe('fallback')
  })

  it('Envelope 形でない値（生の JSON）は fallback を返す', () => {
    localStorage.setItem(
      `${NAMESPACE}${STORAGE_KEYS.settings}`,
      JSON.stringify({ volume: 0.5 }),
    )
    expect(get(STORAGE_KEYS.settings, 'fallback')).toBe('fallback')
  })

  it('バージョン不一致の場合は fallback を返す', () => {
    localStorage.setItem(
      `${NAMESPACE}${STORAGE_KEYS.settings}`,
      JSON.stringify({ v: SCHEMA_VERSION + 1, data: 'old' }),
    )
    expect(get(STORAGE_KEYS.settings, 'fallback')).toBe('fallback')
  })

  it('正しい Envelope はそのまま読める', () => {
    localStorage.setItem(
      `${NAMESPACE}${STORAGE_KEYS.settings}`,
      JSON.stringify({ v: SCHEMA_VERSION, data: 'ok' }),
    )
    expect(get(STORAGE_KEYS.settings, 'fallback')).toBe('ok')
  })

  it('名前空間プレフィックス付きのキーで保存される', () => {
    set(STORAGE_KEYS.diary, 'memo')
    expect(localStorage.getItem(`${NAMESPACE}${STORAGE_KEYS.diary}`)).not.toBeNull()
    // プレフィックスなしの素のキーには書き込まれない
    expect(localStorage.getItem(STORAGE_KEYS.diary)).toBeNull()
  })
})
