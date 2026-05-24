// 「今日の一言」用のやさしい言葉。
// アイデアの「不確かな教えは排除」する方針に沿い、特定の人物への誤った帰属を避けるため、
// 出典の確実でない引用ではなく、汎用的でおだやかな言葉のみを収録している。
export const PHRASES: string[] = [
  'いまここにある呼吸に、そっと意識を向けてみましょう。',
  '急がなくて大丈夫。心は、ゆっくりと整っていきます。',
  'できなかったことより、できたことに目を向けてみる。',
  '波が引くように、不安もいつかは静まっていきます。',
  '今日の自分を、少しだけ労ってあげましょう。',
  '静けさのなかに、本当の声は聞こえてきます。',
  '完璧でなくていい。あるがままの今日で十分です。',
  '深く吐く息とともに、力みを手放してみましょう。',
  '小さな一歩も、たしかな前進です。',
  '心が疲れた日は、休むことも大切な選択です。',
]

/** 日付ごとに安定して同じ一言を返す */
export function phraseOfTheDay(date = new Date()): string {
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return PHRASES[((dayIndex % PHRASES.length) + PHRASES.length) % PHRASES.length]
}
