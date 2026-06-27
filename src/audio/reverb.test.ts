import { describe, it, expect } from 'vitest'
import { generateImpulseResponseSamples } from './reverb'

describe('reverb の IR 生成', () => {
  it('指定秒数 × サンプルレートぶんのステレオ波形を返す', () => {
    const [left, right] = generateImpulseResponseSamples(48000, 1.5, 2.2)
    const expectedLen = Math.floor(48000 * 1.5)
    expect(left.length).toBe(expectedLen)
    expect(right.length).toBe(expectedLen)
  })

  it('左右チャンネルが完全に同一ではない（ステレオ感がある）', () => {
    const [left, right] = generateImpulseResponseSamples(8000, 0.5, 2.0)
    let diff = 0
    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i]) diff++
    }
    // 乱数で独立生成しているのでほぼ全サンプル異なるはず
    expect(diff).toBeGreaterThan(left.length * 0.95)
  })

  it('包絡が時間とともに減衰する（末尾は冒頭より絶対値が小さい）', () => {
    const [left] = generateImpulseResponseSamples(8000, 1.0, 3.0)
    // 冒頭 5% と 末尾 5% のエネルギーを比較
    const window = Math.floor(left.length * 0.05)
    let head = 0
    let tail = 0
    for (let i = 0; i < window; i++) head += left[i] * left[i]
    for (let i = left.length - window; i < left.length; i++) tail += left[i] * left[i]
    expect(head).toBeGreaterThan(tail * 10) // 冒頭が末尾より圧倒的に大きい
  })

  it('全サンプル -1〜+1 の範囲に収まる', () => {
    const [left, right] = generateImpulseResponseSamples(8000, 0.3, 2.0)
    for (let i = 0; i < left.length; i++) {
      expect(Math.abs(left[i])).toBeLessThanOrEqual(1)
      expect(Math.abs(right[i])).toBeLessThanOrEqual(1)
    }
  })

  it('seconds が極端に小さくても 1 サンプル以上を返す（落ちない）', () => {
    const [left, right] = generateImpulseResponseSamples(48000, 0, 2.0)
    expect(left.length).toBeGreaterThanOrEqual(1)
    expect(right.length).toBeGreaterThanOrEqual(1)
  })
})
