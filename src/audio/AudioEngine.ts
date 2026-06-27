import { logEvent } from '../lib/history'
import { loadSettings, saveSettings } from '../lib/settings'
import { findSoundscape, type Voice } from './soundscapes'

export interface EngineState {
  currentId: string | null
  isPlaying: boolean
  volume: number
  timerTotalMs: number | null
  timerRemainingMs: number | null
  /** 一度でも resume して running になり、音声が有効化されたか */
  unlocked: boolean
}

const FADE_IN = 4.0
const FADE_OUT = 1.0
const TIMER_FADE = 8 // 就寝タイマー終了時のフェードアウト秒数

/**
 * Web Audio をまとめて扱うシングルトンエンジン。
 * - サウンドスケープのクロスフェード再生
 * - マスター音量
 * - 就寝タイマー（指定時間後にゆっくりフェードアウトして停止）
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private current: { id: string; gain: GainNode; voice: Voice } | null = null

  // 初期音量は保存値から復元（未保存なら既定）
  private volume = loadSettings().volume
  private timerTotalMs: number | null = null
  private timerEndAt: number | null = null
  private timerTimeout: ReturnType<typeof setTimeout> | null = null
  private timerTick: ReturnType<typeof setInterval> | null = null

  // 一度でも AudioContext が running になったか（音声アンロック済みか）
  private unlocked = false

  private listeners = new Set<() => void>()
  private snapshot: EngineState = {
    currentId: null,
    isPlaying: false,
    volume: this.volume,
    timerTotalMs: null,
    timerRemainingMs: null,
    unlocked: false,
  }

  constructor() {
    // バックグラウンド復帰時、再生中なら resume（iOS Safari 等の suspend 対策）
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  // ── 外部購読（useSyncExternalStore 用）──
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  getSnapshot = (): EngineState => this.snapshot

  private emit() {
    this.snapshot = {
      currentId: this.current?.id ?? null,
      isPlaying: this.current !== null,
      volume: this.volume,
      timerTotalMs: this.timerTotalMs,
      timerRemainingMs:
        this.timerEndAt != null ? Math.max(0, this.timerEndAt - Date.now()) : null,
      unlocked: this.unlocked,
    }
    this.listeners.forEach((l) => l())
  }

  /** ctx が running なら unlocked を立て、変化があれば emit */
  private markUnlocked(): void {
    if (this.ctx?.state === 'running' && !this.unlocked) {
      this.unlocked = true
      this.emit()
    }
  }

  /**
   * 初回ユーザー操作で AudioContext を resume し音声を有効化する。
   * 実際に音が鳴るのは再生ボタン押下時でよいが、ここで resume しておくと
   * 初回再生が確実になる。
   */
  async unlock(): Promise<void> {
    const { ctx } = this.ensureContext()
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* noop */
      }
    }
    this.markUnlocked()
  }

  /** タブ復帰時、再生中なら resume（バックグラウンドでの自動停止はしない） */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') return
    if (this.current === null || !this.ctx) return
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        /* noop */
      })
    }
  }

  private ensureContext(): { ctx: AudioContext; master: GainNode } {
    if (!this.ctx || !this.master) {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = this.volume
      master.connect(ctx.destination)
      this.ctx = ctx
      this.master = master
    }
    return { ctx: this.ctx, master: this.master }
  }

  /** サウンドスケープを再生（同じ ID なら停止トグル） */
  async play(id: string): Promise<void> {
    if (this.current?.id === id) {
      this.stop()
      return
    }

    const scape = findSoundscape(id)
    if (!scape) return

    const { ctx, master } = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    this.markUnlocked()

    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.gain.value = 0.0001
    gain.connect(master)
    const voice = scape.build(ctx, gain)
    gain.gain.exponentialRampToValueAtTime(1, now + FADE_IN)

    // 旧サウンドをクロスフェードで終了
    this.fadeOutAndDispose(this.current, FADE_OUT)

    this.current = { id, gain, voice }
    saveSettings({ lastScapeId: id }) // 前回の選択として記憶
    logEvent('sound', id) // 利用履歴に記録（おすすめ用）
    this.emit()
  }

  /** 再生を停止（fade 秒かけてフェードアウト） */
  stop(fade = FADE_OUT): void {
    this.fadeOutAndDispose(this.current, fade)
    this.current = null
    this.clearTimer()
    this.emit()
  }

  private fadeOutAndDispose(
    target: { gain: GainNode; voice: Voice } | null,
    fade: number,
  ): void {
    if (!target || !this.ctx) return
    const { gain, voice } = target
    const now = this.ctx.currentTime
    try {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fade)
    } catch {
      /* noop */
    }
    setTimeout(() => voice.dispose(), Math.ceil(fade * 1000) + 60)
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setTargetAtTime(this.volume, now, 0.05)
    }
    saveSettings({ volume: this.volume }) // 音量を保存
    this.emit()
  }

  /** 就寝タイマーを開始（minutes 分後にフェードアウト停止） */
  startTimer(minutes: number): void {
    this.clearTimer()
    const ms = minutes * 60_000
    this.timerTotalMs = ms
    this.timerEndAt = Date.now() + ms
    saveSettings({ timerMinutes: minutes }) // タイマー既定分数を保存

    this.timerTimeout = setTimeout(() => {
      this.stop(TIMER_FADE)
    }, ms)

    this.timerTick = setInterval(() => {
      if (this.timerEndAt != null && Date.now() >= this.timerEndAt) {
        this.clearTimer()
      }
      this.emit()
    }, 1000)

    this.emit()
  }

  cancelTimer(): void {
    this.clearTimer()
    this.emit()
  }

  private clearTimer(): void {
    if (this.timerTimeout) clearTimeout(this.timerTimeout)
    if (this.timerTick) clearInterval(this.timerTick)
    this.timerTimeout = null
    this.timerTick = null
    this.timerTotalMs = null
    this.timerEndAt = null
  }

  /** 瞑想ガイド等から、単発のやさしいトーンを鳴らす */
  async chime(freq = 432, duration = 1.6): Promise<void> {
    const { ctx, master } = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    this.markUnlocked()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = 0.0001
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(g).connect(master)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }
}

export const audioEngine = new AudioEngine()
