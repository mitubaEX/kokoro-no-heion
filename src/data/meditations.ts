export type PhaseKind = 'inhale' | 'hold' | 'exhale' | 'rest'

export interface BreathPhase {
  kind: PhaseKind
  label: string
  seconds: number
}

export interface BreathPattern {
  id: string
  name: string
  desc: string
  phases: BreathPhase[]
}

export const PATTERNS: BreathPattern[] = [
  {
    id: 'relax',
    name: 'リラックス呼吸（4-7-8）',
    desc: '吸う4秒・止める7秒・吐く8秒。眠る前におすすめ。',
    phases: [
      { kind: 'inhale', label: '吸う', seconds: 4 },
      { kind: 'hold', label: '止める', seconds: 7 },
      { kind: 'exhale', label: '吐く', seconds: 8 },
    ],
  },
  {
    id: 'box',
    name: '整える呼吸（ボックス）',
    desc: '吸う・止める・吐く・止めるを各4秒。集中したいときに。',
    phases: [
      { kind: 'inhale', label: '吸う', seconds: 4 },
      { kind: 'hold', label: '止める', seconds: 4 },
      { kind: 'exhale', label: '吐く', seconds: 4 },
      { kind: 'rest', label: '止める', seconds: 4 },
    ],
  },
  {
    id: 'calm',
    name: 'しずかな呼吸（5-5）',
    desc: '吸う5秒・吐く5秒のシンプルな呼吸。いつでも。',
    phases: [
      { kind: 'inhale', label: '吸う', seconds: 5 },
      { kind: 'exhale', label: '吐く', seconds: 5 },
    ],
  },
  {
    id: 'sigh',
    name: 'ため息の呼吸（4-8）',
    desc: '吸う4秒・長く吐く8秒。吐く息を強調して緊張をほどく。',
    phases: [
      { kind: 'inhale', label: '吸う', seconds: 4 },
      { kind: 'exhale', label: '長く吐く', seconds: 8 },
    ],
  },
  {
    id: 'morning',
    name: '朝の活性（4-2-4）',
    desc: '吸う4秒・止める2秒・吐く4秒。軽く整えて一日を始める。',
    phases: [
      { kind: 'inhale', label: '吸う', seconds: 4 },
      { kind: 'hold', label: '止める', seconds: 2 },
      { kind: 'exhale', label: '吐く', seconds: 4 },
    ],
  },
]

export const DURATION_OPTIONS = [1, 3, 5, 10]
