import { attachLFO, createNoiseBuffer, startNoise } from './noise'
import { createReverbSend } from './reverb'

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
    root.gain.value = 0.55 // 0.9 → 0.55 で全体的に小さく
    // 薄いリバーブで「砂浜の広がり」を演出
    const verb = createReverbSend(ctx, out, { wet: 0.22, seconds: 1.8, decay: 2.4 })
    root.connect(verb.input)

    const src = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(src)

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 480 // 600 → 480Hz で耳当たりを柔らかく
    lp.Q.value = 0.6

    // 波の打ち寄せ — 2 系統の LFO を重ねて「うねりのうねり」を作る
    // LFO 0.09→0.07Hz でよりゆったり、depth 0.28→0.22 で揺らぎを穏やかに
    const swell = ctx.createGain()
    swell.gain.value = 0.25
    c.osc(attachLFO(ctx, swell.gain, 0.07, 0.28, 0.22))
    c.osc(attachLFO(ctx, swell.gain, 0.019, 0, 0.03)) // ごく遅い揺らぎ
    c.osc(attachLFO(ctx, lp.frequency, 0.07, 500, 260))

    src.connect(lp).connect(swell).connect(root)
    return {
      dispose: () => {
        c.dispose(root)
        try {
          verb.input.disconnect()
          verb.convolver.disconnect()
        } catch {
          /* noop */
        }
      },
    }
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
    root.gain.value = 0.40 // 0.55 → 0.40 で全体的に小さく
    root.connect(out)

    const src = startNoise(ctx, createNoiseBuffer(ctx, 'pink'))
    c.src(src)

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 4500 // 5500 → 4500Hz で耳に刺さる高域を抑制

    // 細かなゆらぎ
    const flutter = ctx.createGain()
    flutter.gain.value = 0.5
    c.osc(attachLFO(ctx, flutter.gain, 0.6, 0.5, 0.06))

    src.connect(hp).connect(lp).connect(flutter).connect(root)

    // 雨粒 — 短いバンドパスノイズバーストを不規則間隔で散らす
    // 粒のピーク・間隔ともに穏やかにして「やさしい雨」らしく
    const dropBuf = createNoiseBuffer(ctx, 'white', 0.3)
    const dropOne = () => {
      const now = ctx.currentTime
      const s = ctx.createBufferSource()
      s.buffer = dropBuf
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2200 + Math.random() * 1800
      bp.Q.value = 5
      const g = ctx.createGain()
      // ピーク 0.04-0.09 → 0.025-0.05 に
      const peak = 0.025 + Math.random() * 0.025
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(peak, now + 0.004)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07 + Math.random() * 0.05)
      s.connect(bp).connect(g).connect(root)
      const offset = Math.random() * 0.2
      s.start(now, offset, 0.12)
      s.stop(now + 0.18)
    }
    let dropTimer: ReturnType<typeof setTimeout>
    const scheduleDrop = () => {
      dropOne()
      // 40-160ms → 120-340ms → 240-680ms とさらに広げ、しとしと感を強める
      dropTimer = setTimeout(scheduleDrop, 240 + Math.random() * 440)
    }
    scheduleDrop()
    c.add(() => clearTimeout(dropTimer))

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
    // たっぷり長いリバーブで「お堂の中」のような響き
    const verb = createReverbSend(ctx, out, { wet: 0.45, seconds: 2.6, decay: 1.8 })
    root.connect(verb.input)
    // 立ち上がりをよりやわらかく（4s → 6s、到達ゲイン 0.5 → 0.32）
    root.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 6)

    // ボウルの倍音（やや非整数倍で金属的な響き）
    const fundamental = 196 // G3 あたり
    const partials = [1, 2.0, 2.76, 4.07]
    const gains = [0.5, 0.22, 0.14, 0.08]
    partials.forEach((mult, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = fundamental * mult
      // 倍音ごとに僅かにデチューンしてうねりを自然に
      osc.detune.value = (i - 1.5) * 2.2
      const g = ctx.createGain()
      g.gain.value = gains[i]
      c.osc(attachLFO(ctx, g.gain, 0.05 + i * 0.013, gains[i], gains[i] * 0.5))
      osc.connect(g).connect(root)
      osc.start()
      c.osc(osc)
    })

    return {
      dispose: () => {
        c.dispose(root)
        try {
          verb.input.disconnect()
          verb.convolver.disconnect()
        } catch {
          /* noop */
        }
      },
    }
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
    // 最も強めのリバーブで星空のような奥行きを
    const verb = createReverbSend(ctx, out, { wet: 0.55, seconds: 3.0, decay: 1.6 })
    root.connect(verb.input)
    // 立ち上がり 5s → 8s、到達ゲイン 0.4 → 0.28 でよりゆったり静かに
    root.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 8)

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1100 // sawtooth から triangle に変えたので少し下げる
    lp.Q.value = 0.8
    c.osc(attachLFO(ctx, lp.frequency, 0.03, 1000, 600))
    lp.connect(root)

    // A メジャー系のやわらかい和音
    const notes = [110, 164.81, 220, 277.18] // A2, E3, A3, C#4
    notes.forEach((freq, i) => {
      ;[-1, 1].forEach((dir) => {
        const osc = ctx.createOscillator()
        // sawtooth → triangle で倍音を減らしノイズ感を低減
        osc.type = 'triangle'
        osc.frequency.value = freq
        osc.detune.value = dir * (4 + i)
        const g = ctx.createGain()
        g.gain.value = 0.08
        c.osc(attachLFO(ctx, g.gain, 0.02 + i * 0.01, 0.08, 0.04))
        osc.connect(g).connect(lp)
        osc.start()
        c.osc(osc)
      })
    })

    return {
      dispose: () => {
        c.dispose(root)
        try {
          verb.input.disconnect()
          verb.convolver.disconnect()
        } catch {
          /* noop */
        }
      },
    }
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
    root.gain.value = 0.35 // 0.5 → 0.35 で全体的に小さく
    // 薄めのリバーブで「森の中」感
    const verb = createReverbSend(ctx, out, { wet: 0.18, seconds: 1.4, decay: 2.5 })
    root.connect(verb.input)

    // せせらぎ — 高めにフィルタした水のノイズ、左寄りにパン
    const stream = startNoise(ctx, createNoiseBuffer(ctx, 'white'))
    c.src(stream)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2500
    bp.Q.value = 0.7
    c.osc(attachLFO(ctx, bp.frequency, 0.8, 2500, 600))
    const streamGain = ctx.createGain()
    streamGain.gain.value = 0.18
    const streamPan = ctx.createStereoPanner()
    streamPan.pan.value = -0.35
    stream.connect(bp).connect(streamGain).connect(streamPan).connect(root)

    // 木々のそよぎ — 低めのノイズをゆっくりうねらせる、右寄りにパン
    const wind = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(wind)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 450
    const windGain = ctx.createGain()
    windGain.gain.value = 0.2
    c.osc(attachLFO(ctx, windGain.gain, 0.07, 0.2, 0.14))
    const windPan = ctx.createStereoPanner()
    windPan.pan.value = 0.3
    wind.connect(lp).connect(windGain).connect(windPan).connect(root)

    // 葉ずれ — 高域ブラウンノイズの 2 重 LFO で自然な揺らぎ
    const leaves = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(leaves)
    const leavesHp = ctx.createBiquadFilter()
    leavesHp.type = 'highpass'
    leavesHp.frequency.value = 1800
    const leavesGain = ctx.createGain()
    leavesGain.gain.value = 0.04 // 0.06 → 0.04 で控えめに
    c.osc(attachLFO(ctx, leavesGain.gain, 0.11, 0.04, 0.035))
    c.osc(attachLFO(ctx, leavesGain.gain, 0.037, 0, 0.015))
    leaves.connect(leavesHp).connect(leavesGain).connect(root)

    return {
      dispose: () => {
        c.dispose(root)
        try {
          verb.input.disconnect()
          verb.convolver.disconnect()
        } catch {
          /* noop */
        }
      },
    }
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
    root.gain.value = 0.45 // 0.7 → 0.45 で全体的に小さく
    root.connect(out)

    // 炎のうなり — ブラウンノイズをローパスして低くこもらせる
    const bed = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(bed)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    lp.Q.value = 0.5
    const bedGain = ctx.createGain()
    // 「ゴー」という炎のうなりは雰囲気作りの最小限まで絞る（0.08 → 0.035）
    bedGain.gain.value = 0.035
    c.osc(attachLFO(ctx, bedGain.gain, 0.10, 0.035, 0.012))
    bed.connect(lp).connect(bedGain).connect(root)

    // 爆ぜる音（クラックル） — 短いノイズバーストを不定期に鳴らす
    const crackleBuf = createNoiseBuffer(ctx, 'white', 1)
    const fireCrackle = () => {
      const now = ctx.currentTime
      const src = ctx.createBufferSource()
      src.buffer = crackleBuf
      const offset = Math.random() * 0.9
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      // 1200〜3000Hz → 1000〜2400Hz に下げ、耳に刺さるパチ感を抑える
      hp.frequency.value = 1000 + Math.random() * 1400
      const g = ctx.createGain()
      // ピーク 0.04-0.14 → 0.025-0.075 に抑えて穏やかに
      const peak = 0.025 + Math.random() * 0.05
      g.gain.setValueAtTime(0.0001, now)
      // 立ち上がり 0.005 → 0.003 でより乾いた音に
      g.gain.exponentialRampToValueAtTime(peak, now + 0.003)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.08)
      // ステレオに微妙に振り分けて立体感
      const pan = ctx.createStereoPanner()
      pan.pan.value = (Math.random() * 2 - 1) * 0.4
      src.connect(hp).connect(g).connect(pan).connect(root)
      src.start(now, offset, 0.18)
      src.stop(now + 0.25)
    }
    let crackleTimer: ReturnType<typeof setTimeout>
    const scheduleCrackle = () => {
      fireCrackle()
      // 120-540ms → 280-900ms → 560-1800ms とさらに広げ、ゆったりとした炎に
      crackleTimer = setTimeout(scheduleCrackle, 560 + Math.random() * 1240)
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
    // 到達ゲイン 0.45 → 0.30、立ち上がり 3s → 5s でゆったり静かに
    root.gain.exponentialRampToValueAtTime(0.30, ctx.currentTime + 5)

    // ホワイト → ピンクで低域寄り、耳当たりが柔らかい
    const src = startNoise(ctx, createNoiseBuffer(ctx, 'pink'))
    c.src(src)

    // 高域を 6000 → 4500Hz でさらに丸める
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 4500
    lp.Q.value = 0.4

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
    root.gain.value = 0.32 // 0.5 → 0.32 で全体的に小さく
    root.connect(out)

    // 夜の空気感 — ごく低いブラウンノイズの底
    const air = startNoise(ctx, createNoiseBuffer(ctx, 'brown'))
    c.src(air)
    const airLp = ctx.createBiquadFilter()
    airLp.type = 'lowpass'
    airLp.frequency.value = 300
    const airGain = ctx.createGain()
    airGain.gain.value = 0.08 // 0.12 → 0.08 で夜の底もより静かに
    air.connect(airLp).connect(airGain).connect(root)

    // 鈴虫のすだき — 高めの三角波をトレモロで細かく刻む
    // pan で左右に散らし、機械的な等間隔感を消すため僅かなテンポ揺らぎも入れる
    const chirp = (base: number, rate: number, level: number, panValue: number) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = base
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = base
      bp.Q.value = 6
      const gate = ctx.createGain()
      gate.gain.value = 0
      c.osc(attachLFO(ctx, gate.gain, rate, level / 2, level / 2))
      // トレモロ速度自体もゆっくり揺らがせて自然に
      c.osc(attachLFO(ctx, gate.gain, rate * 0.07, 0, level * 0.08))
      const pan = ctx.createStereoPanner()
      pan.pan.value = panValue
      osc.connect(bp).connect(gate).connect(pan).connect(root)
      osc.start()
      c.osc(osc)
    }
    // 数匹ぶんを少しずつ違う高さ・テンポ・位置で重ねる
    // トレモロ速度 22/19/25 → 18/16/20、レベルも控えめにしてゆったり穏やかに
    chirp(4200, 18, 0.035, -0.4)
    chirp(4600, 16, 0.028, 0.45)
    chirp(3900, 20, 0.025, -0.05)

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
