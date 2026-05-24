import { useCallback, useEffect, useRef, useState } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import type { BreathPattern, PhaseKind } from '../data/meditations'
import { logEvent } from '../lib/history'

export type MedStatus = 'idle' | 'running' | 'done'

interface MedState {
  status: MedStatus
  phaseKind: PhaseKind
  phaseLabel: string
  phaseSecondsLeft: number
  sessionSecondsLeft: number
  /** 呼吸の輪の目標スケール（吸う=大 / 吐く=小） */
  scale: number
  transitionSec: number
}

const INITIAL: MedState = {
  status: 'idle',
  phaseKind: 'inhale',
  phaseLabel: '',
  phaseSecondsLeft: 0,
  sessionSecondsLeft: 0,
  scale: 0.45,
  transitionSec: 0,
}

// フェーズごとのやさしいトーン（ソルフェジオ周波数を参考）
const CHIME: Partial<Record<PhaseKind, number>> = {
  inhale: 528,
  exhale: 396,
}

function scaleFor(kind: PhaseKind): number {
  // 吸ったあとの hold は大きいまま、吐いたあとの rest は小さいまま保つ
  return kind === 'inhale' || kind === 'hold' ? 1 : 0.45
}

/** 呼吸ガイドのタイマー進行をまとめて管理する */
export function useMeditation() {
  const [state, setState] = useState<MedState>(INITIAL)

  const runningRef = useRef(false)
  const phaseIndexRef = useRef(0)
  const phaseEndRef = useRef(0)
  const sessionEndRef = useRef(0)
  const patternRef = useRef<BreathPattern | null>(null)
  const phaseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (phaseTimeout.current) clearTimeout(phaseTimeout.current)
    if (tick.current) clearInterval(tick.current)
    phaseTimeout.current = null
    tick.current = null
  }, [])

  const finish = useCallback(() => {
    runningRef.current = false
    clearTimers()
    if (bgRef.current) audioEngine.stop()
    audioEngine.chime(432, 3)
    setState((s) => ({ ...s, status: 'done', scale: 0.45, transitionSec: 2 }))
  }, [clearTimers])

  const runPhase = useCallback(() => {
    const pattern = patternRef.current
    if (!pattern || !runningRef.current) return

    const phase = pattern.phases[phaseIndexRef.current % pattern.phases.length]
    phaseEndRef.current = Date.now() + phase.seconds * 1000

    const chimeFreq = CHIME[phase.kind]
    if (chimeFreq) audioEngine.chime(chimeFreq, 1.4)

    setState((s) => ({
      ...s,
      phaseKind: phase.kind,
      phaseLabel: phase.label,
      phaseSecondsLeft: phase.seconds,
      scale: scaleFor(phase.kind),
      transitionSec: phase.seconds,
    }))

    phaseTimeout.current = setTimeout(() => {
      if (!runningRef.current) return
      phaseIndexRef.current += 1
      runPhase()
    }, phase.seconds * 1000)
  }, [])

  const start = useCallback(
    (pattern: BreathPattern, minutes: number, withBackground: boolean) => {
      clearTimers()
      runningRef.current = true
      patternRef.current = pattern
      phaseIndexRef.current = 0
      sessionEndRef.current = Date.now() + minutes * 60_000
      bgRef.current = withBackground

      logEvent('meditation', pattern.id) // 利用履歴に記録（おすすめ用）

      if (withBackground) audioEngine.play('pad')

      setState((s) => ({
        ...s,
        status: 'running',
        sessionSecondsLeft: minutes * 60,
      }))

      runPhase()

      tick.current = setInterval(() => {
        const now = Date.now()
        const sessionLeft = Math.max(0, Math.ceil((sessionEndRef.current - now) / 1000))
        const phaseLeft = Math.max(0, Math.ceil((phaseEndRef.current - now) / 1000))
        setState((s) => ({
          ...s,
          sessionSecondsLeft: sessionLeft,
          phaseSecondsLeft: phaseLeft,
        }))
        if (sessionLeft <= 0) finish()
      }, 200)
    },
    [clearTimers, runPhase, finish],
  )

  const stop = useCallback(() => {
    runningRef.current = false
    clearTimers()
    if (bgRef.current) audioEngine.stop()
    setState(INITIAL)
  }, [clearTimers])

  const reset = useCallback(() => setState(INITIAL), [])

  // アンマウント時に確実に止める
  useEffect(() => {
    return () => {
      runningRef.current = false
      clearTimers()
      if (bgRef.current) audioEngine.stop()
    }
  }, [clearTimers])

  return { ...state, start, stop, reset }
}
