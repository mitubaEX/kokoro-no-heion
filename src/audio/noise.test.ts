import { describe, it, expect } from 'vitest'
import { generateNoiseSamples } from './noise'

describe('ノイズサンプル生成', () => {
  it('指定長の Float32Array を返す', () => {
    const out = generateNoiseSamples('white', 1024)
    expect(out).toBeInstanceOf(Float32Array)
    expect(out.length).toBe(1024)
  })

  it('ホワイトノイズは -1〜+1 の範囲に収まる', () => {
    const out = generateNoiseSamples('white', 2048)
    for (let i = 0; i < out.length; i++) {
      expect(out[i]).toBeGreaterThanOrEqual(-1)
      expect(out[i]).toBeLessThanOrEqual(1)
    }
  })

  it('ブラウンノイズは隣接サンプルの差が小さい（低域寄り）', () => {
    const out = generateNoiseSamples('brown', 4096)
    let avgDelta = 0
    for (let i = 1; i < out.length; i++) avgDelta += Math.abs(out[i] - out[i - 1])
    avgDelta /= out.length - 1
    // ホワイトより明確に差分が小さい（低域寄りなので隣接サンプルが似る）
    expect(avgDelta).toBeLessThan(0.2)
  })

  it('ピンクノイズはホワイトより低域寄りである（隣接差がホワイトより小さい）', () => {
    const white = generateNoiseSamples('white', 4096)
    const pink = generateNoiseSamples('pink', 4096)
    const delta = (a: Float32Array) => {
      let s = 0
      for (let i = 1; i < a.length; i++) s += Math.abs(a[i] - a[i - 1])
      return s / (a.length - 1)
    }
    expect(delta(pink)).toBeLessThan(delta(white))
  })

  it('長さ 0 でも例外を出さず空配列を返す', () => {
    expect(generateNoiseSamples('white', 0).length).toBe(0)
  })
})
