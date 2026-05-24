type IconProps = {
  className?: string
}

/**
 * ボトムナビ用の線画アイコン群。
 * いずれも currentColor を使い、nav の active/非active の色遷移に追従する。
 * サイズは 1em（.nav a .ico の font-size: 1.2rem を基準に自然に揃う）。
 * 装飾要素のため aria-hidden。
 */

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
}

/** ホーム — 家 */
export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  )
}

/** 音 — 音符＋やわらかな波 */
export function SoundIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M9 17V6l9-2v9" />
      <circle cx="6.5" cy="17" r="2.5" />
      <circle cx="15.5" cy="15" r="2.5" />
    </svg>
  )
}

/** 瞑想 — 座って瞑想する人 */
export function MeditationIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="5.5" r="2.2" />
      <path d="M12 9c-3 0-5 2-5 5" />
      <path d="M12 9c3 0 5 2 5 5" />
      <path d="M4.5 18c2-1.4 4.7-2.2 7.5-2.2s5.5.8 7.5 2.2c-2 1.4-4.7 2.2-7.5 2.2S6.5 19.4 4.5 18Z" />
    </svg>
  )
}

/** 教え — 巻物 */
export function TeachingsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M7 5h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H9" />
      <path d="M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
      <path d="M9 12h6" />
      <path d="M9 15.5h4" />
    </svg>
  )
}

/** 日記 — ノート */
export function DiaryIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6.5 4H17a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19.5v-14A1.5 1.5 0 0 1 6.5 4Z" />
      <path d="M5 17h14" />
      <path d="M9 4v17" />
    </svg>
  )
}
