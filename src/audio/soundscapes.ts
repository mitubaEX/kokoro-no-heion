import { attachLFO, createNoiseBuffer, startNoise } from './noise'

/** 生成済みのサウンドスケープ。dispose で全ノードを停止・破棄する。 */
export interface Voice {
  dispose: () => void
}

export interface Soundscape {
  id: string
  name: string
  emoji: string
  description: string
  /** 落ち着き系の色味（カードのアクセント） */
  hue: number
  build: (ctx: AudioContext, out: AudioNode) => Voice
}

/** 複数の停止処理をまとめる小さなヘルパー */
function collector() {
  const stops: Array<() => void> = []
  return {
    add: (fn: () => void) => stops.push(fn),
    osc: (o: OscillatorNode) => stops.push(() => o.stop()),
    src: (s: AudioBufferSourceNode) => stops.push(() => s.stop()),
    timer: (id: ReturnType<typeof setInterval>) => stops.push(() => clearInterval(id)),
    dispose: (root: AudioNode) => {
      for (const s of stops) {
        try {
          s()
        } catch {
          /* already stopped */
        }
      }
      try {
        root.disconnect()
      } catch {
        /* noop */
      }
    },
  }
}

// ───────────────────────── 波の音 ─────────────────────────
const waves: Soundscape = {
  id: 'waves',
  name: '海辺の波',
  emoji: '🌊',
  description: 'ゆったりと寄せては返す波の音',
  hue: 200,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.9
    root.connect(out)

    const src = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(src)

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 600
    lp.Q.value = 0.6

    // 波の打ち寄せ — ゆっくりとした音量のうねり
    const swell = ctx.createGain()
    swell.gain.value = 0.25
    c.osc(attachLFO(ctx, swell.gain, 0.09, 0.32, 0.28))
    // フィルタも一緒に開閉させて「ザー」と「サー」を作る
    c.osc(attachLFO(ctx, lp.frequency, 0.09, 650, 350))

    src.connect(lp).connect(swell).connect(root)
    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── 雨 ─────────────────────────
const rain: Soundscape = {
  id: 'rain',
  name: 'やさしい雨',
  emoji: '🌧️',
  description: '窓辺に降りそそぐ細やかな雨',
  hue: 215,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.55
    root.connect(out)

    const src = startNoise(ctx, createNoiseBuffer(ctx, 'pink'))
    c.src(src)

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 5500

    // 細かなゆらぎ
    const flutter = ctx.createGain()
    flutter.gain.value = 0.5
    c.osc(attachLFO(ctx, flutter.gain, 0.6, 0.5, 0.06))

    src.connect(hp).connect(lp).connect(flutter).connect(root)
    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── シンギングボウル ─────────────────────────
const bowl: Soundscape = {
  id: 'bowl',
  name: 'シンギングボウル',
  emoji: '🔔',
  description: '静かに響くボウルの倍音',
  hue: 35,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.0001
    root.connect(out)
    // 立ち上がりをやわらかく
    root.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 4)

    // ボウルの倍音（やや非整数倍で金属的な響き）
    const fundamental = 196 // G3 あたり
    const partials = [1, 2.0, 2.76, 4.07]
    const gains = [0.5, 0.22, 0.14, 0.08]
    partials.forEach((mult, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = fundamental * mult
      const g = ctx.createGain()
      g.gain.value = gains[i]
      // 各倍音をわずかに揺らして「うなり」を出す
      c.osc(attachLFO(ctx, g.gain, 0.05 + i * 0.013, gains[i], gains[i] * 0.5))
      osc.connect(g).connect(root)
      osc.start()
      c.osc(osc)
    })

    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── アンビエントパッド ─────────────────────────
const pad: Soundscape = {
  id: 'pad',
  name: '星空のパッド',
  emoji: '✨',
  description: '広がりのある幻想的なドローン',
  hue: 265,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.0001
    root.connect(out)
    root.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 5)

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1200
    lp.Q.value = 0.8
    // ゆっくり開閉するフィルタ
    c.osc(attachLFO(ctx, lp.frequency, 0.03, 1100, 700))
    lp.connect(root)

    // A メジャー系のやわらかい和音
    const notes = [110, 164.81, 220, 277.18] // A2, E3, A3, C#4
    notes.forEach((freq, i) => {
      // 各音を 2 つのオシレータでわずかにデチューンして厚みを出す
      ;[-1, 1].forEach((dir) => {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = freq
        osc.detune.value = dir * (4 + i)
        const g = ctx.createGain()
        g.gain.value = 0.06
        c.osc(attachLFO(ctx, g.gain, 0.02 + i * 0.01, 0.06, 0.03))
        osc.connect(g).connect(lp)
        osc.start()
        c.osc(osc)
      })
    })

    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── 森のせせらぎ ─────────────────────────
const forest: Soundscape = {
  id: 'forest',
  name: '森のせせらぎ',
  emoji: '🍃',
  description: '小川のせせらぎと木々のそよぎ',
  hue: 150,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.5
    root.connect(out)

    // せせらぎ — 高めにフィルタした水のノイズ
    const stream = startNoise(ctx, createNoiseBuffer(ctx, 'white'))
    c.src(stream)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2500
    bp.Q.value = 0.7
    c.osc(attachLFO(ctx, bp.frequency, 0.8, 2500, 600))
    const streamGain = ctx.createGain()
    streamGain.gain.value = 0.18
    stream.connect(bp).connect(streamGain).connect(root)

    // 木々のそよぎ — 低めのノイズをゆっくりうねらせる
    const wind = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(wind)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 450
    const windGain = ctx.createGain()
    windGain.gain.value = 0.2
    c.osc(attachLFO(ctx, windGain.gain, 0.07, 0.2, 0.14))
    wind.connect(lp).connect(windGain).connect(root)

    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── 焚き火 ─────────────────────────
const campfire: Soundscape = {
  id: 'campfire',
  name: '焚き火',
  emoji: '🔥',
  description: 'ぱちぱちと爆ぜる薪のあたたかな炎',
  hue: 22,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.7
    root.connect(out)

    // 炎のうなり — ブラウンノイズをローパスして低くこもらせる
    const bed = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(bed)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    lp.Q.value = 0.5
    const bedGain = ctx.createGain()
    bedGain.gain.value = 0.4
    // ゆっくりとした炎のゆらめき
    c.osc(attachLFO(ctx, bedGain.gain, 0.13, 0.4, 0.16))
    bed.connect(lp).connect(bedGain).connect(root)

    // 爆ぜる音（クラックル） — 短いノイズバーストを不定期に鳴らす
    const crackleBuf = createNoiseBuffer(ctx, 'white', 1)
    const fireCrackle = () => {
      const now = ctx.currentTime
      const src = ctx.createBufferSource()
      src.buffer = crackleBuf
      // バッファ内のランダムな位置から短く切り出す
      const offset = Math.random() * 0.9
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1200 + Math.random() * 1800
      const g = ctx.createGain()
      // ぱちっと小さく立ち上がってすぐ減衰
      const peak = 0.04 + Math.random() * 0.1
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(peak, now + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.08)
      src.connect(hp).connect(g).connect(root)
      src.start(now, offset, 0.18)
      src.stop(now + 0.25)
    }
    // 不規則なパチパチ感を出すため、毎回ランダム間隔で予約し直す
    let crackleTimer: ReturnType<typeof setTimeout>
    const scheduleCrackle = () => {
      fireCrackle()
      crackleTimer = setTimeout(scheduleCrackle, 120 + Math.random() * 420)
    }
    scheduleCrackle()
    c.add(() => clearTimeout(crackleTimer))

    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── ホワイトノイズ（集中・睡眠） ─────────────────────────
const whitenoise: Soundscape = {
  id: 'whitenoise',
  name: 'ホワイトノイズ',
  emoji: '🌫️',
  description: 'ゆらぎのない静かなノイズ。集中や睡眠に。',
  hue: 210,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.0001
    root.connect(out)
    // 耳に刺さらないよう、ゆっくり立ち上げる
    root.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 3)

    const src = startNoise(ctx, createNoiseBuffer(ctx, 'white'))
    c.src(src)

    // 高域の刺激を抑えてやわらかく整える
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 6000
    lp.Q.value = 0.4

    // 低域の重さを少し削いで安定させる
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 200

    src.connect(hp).connect(lp).connect(root)
    return { dispose: () => c.dispose(root) }
  },
}

// ───────────────────────── 夜の虫の音 ─────────────────────────
const crickets: Soundscape = {
  id: 'crickets',
  name: '夜の虫の音',
  emoji: '🦗',
  description: '静かな夜に響く虫たちのすずやかな声',
  hue: 130,
  build(ctx, out) {
    const c = collector()
    const root = ctx.createGain()
    root.gain.value = 0.5
    root.connect(out)

    // 夜の空気感 — ごく低いブラウンノイズの底
    const air = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(air)
    const airLp = ctx.createBiquadFilter()
    airLp.type = 'lowpass'
    airLp.frequency.value = 300
    const airGain = ctx.createGain()
    airGain.gain.value = 0.12
    air.connect(airLp).connect(airGain).connect(root)

    // 鈴虫のすだき — 高めの三角波をトレモロで細かく刻む
    const chirp = (base: number, rate: number, level: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = base
      // バンドパスで虫らしい線の細い音色に
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = base
      bp.Q.value = 6
      // トレモロ用ゲート — 0 と level の間を素早く開閉して「リリリ」を作る
      const gate = ctx.createGain()
      gate.gain.value = 0
      c.osc(attachLFO(ctx, gate.gain, rate, level / 2, level / 2))
      osc.connect(bp).connect(gate).connect(root)
      osc.start()
      c.osc(osc)
    }
    // 数匹ぶんを少しずつ違う高さ・テンポで重ねる
    chirp(4200, 22, 0.05)
    chirp(4600, 19, 0.04)
    chirp(3900, 25, 0.035)

    return { dispose: () => c.dispose(root) }
  },
}

export const SOUNDSCAPES: Soundscape[] = [
  waves,
  rain,
  forest,
  campfire,
  crickets,
  whitenoise,
  bowl,
  pad,
]

export function findSoundscape(id: string): Soundscape | undefined {
  return SOUNDSCAPES.find((s) => s.id === id)
}
