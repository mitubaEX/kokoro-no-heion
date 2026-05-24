import { describe, it, expect } from 'vitest'
import { formatClock } from './format'

describe('formatClock', () => {
  it('0ms は 0:00', () => {
    expect(formatClock(0)).toBe('0:00')
  })

  it('59秒は 0:59', () => {
    expect(formatClock(59_000)).toBe('0:59')
  })

  it('60秒は 1:00', () => {
    expect(formatClock(60_000)).toBe('1:00')
  })

  it('端数は切り上げ（1ms でも 0:01 になる）', () => {
    expect(formatClock(1)).toBe('0:01')
  })

  it('端数は切り上げ（59001ms は 1:00）', () => {
    expect(formatClock(59_001)).toBe('1:00')
  })

  it('ちょうどの秒は切り上げで増えない（1000ms は 0:01）', () => {
    expect(formatClock(1000)).toBe('0:01')
  })

  it('負値は 0:00 にクランプされる', () => {
    expect(formatClock(-1)).toBe('0:00')
    expect(formatClock(-60_000)).toBe('0:00')
  })

  it('分が二桁になっても秒のみゼロ埋め（10分=600000ms は 10:00）', () => {
    expect(formatClock(600_000)).toBe('10:00')
  })
})
