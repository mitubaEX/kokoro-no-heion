// 各種ノイズの生成ヘルパー。
// 著作権フリーで自己完結するため、音源ファイルを使わず手続き的に音を作る。

/** 数秒分のループ可能なノイズバッファを生成する */
export function createNoiseBuffer(
  ctx: AudioContext,
  type: 'white' | 'pink' | 'brown',
  seconds = 4,
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      data[i] = last * 3.5
    }
  } else {
    // pink — Paul Kellet の近似フィルタ
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }

  return buffer
}

/** ループ再生するノイズソースを作って即 start する */
export function startNoise(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.start()
  return src
}

/** 低周波オシレータ（ゆらぎ）を作り、param を中心値±depth で揺らす */
export function attachLFO(
  ctx: AudioContext,
  param: AudioParam,
  freq: number,
  center: number,
  depth: number,
): OscillatorNode {
  const lfo = ctx.createOscillator()
  lfo.frequency.value = freq
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = depth
  param.value = center
  lfo.connect(lfoGain).connect(param)
  lfo.start()
  return lfo
}
