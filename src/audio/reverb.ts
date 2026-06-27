// 軽量シンセリバーブ。
// インパルス応答（IR）をホワイトノイズ × 指数減衰で手続き的に生成し、
// ConvolverNode に流して空間的な広がりを与える。

/**
 * IR サンプル列を 2ch（ステレオ）で生成する。
 * - 左右に独立した乱数を使うことで自然なステレオ感が出る。
 * - 包絡は (1 - t)^decay の指数減衰。decay が大きいほど早く減衰する。
 */
export function generateImpulseResponseSamples(
  sampleRate: number,
  seconds: number,
  decay: number,
): [Float32Array, Float32Array] {
  const length = Math.max(1, Math.floor(sampleRate * seconds))
  const left = new Float32Array(length)
  const right = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const t = i / length
    const env = Math.pow(1 - t, decay)
    left[i] = (Math.random() * 2 - 1) * env
    right[i] = (Math.random() * 2 - 1) * env
  }
  return [left, right]
}

/** ConvolverNode を作って IR を流し込む */
export function createReverbConvolver(
  ctx: AudioContext,
  seconds = 1.6,
  decay = 2.2,
): ConvolverNode {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  const [left, right] = generateImpulseResponseSamples(ctx.sampleRate, seconds, decay)
  buffer.getChannelData(0).set(left)
  buffer.getChannelData(1).set(right)
  const conv = ctx.createConvolver()
  conv.buffer = buffer
  return conv
}

/**
 * ドライ/ウェットの 2 系統で入力をまとめるヘルパー。
 * 戻り値の `input` に音を繋ぐと dest（通常はサウンドスケープの root gain）に
 * 直接信号とリバーブ信号がミックスされる。
 */
export function createReverbSend(
  ctx: AudioContext,
  dest: AudioNode,
  opts: { wet: number; seconds?: number; decay?: number } = { wet: 0.18 },
): { input: GainNode; convolver: ConvolverNode } {
  const input = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  dry.gain.value = 1
  wet.gain.value = Math.max(0, opts.wet)

  const convolver = createReverbConvolver(ctx, opts.seconds ?? 1.6, opts.decay ?? 2.2)

  input.connect(dry).connect(dest)
  input.connect(convolver).connect(wet).connect(dest)
  return { input, convolver }
}
