type BrandMarkProps = {
  className?: string
}

/**
 * ヘッダ用の小さなブランドマーク。
 * 三日月＋同心円の落ち着いたシンボル。
 * 色は currentColor を基調にし、周囲のテキスト色に追従する。
 * 装飾要素のため aria-hidden。
 */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* 同心円（静かな波紋） */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" />
      {/* 三日月 */}
      <path
        d="M14.8 6.4a6.2 6.2 0 1 0 0 11.2 7.4 7.4 0 0 1 0-11.2Z"
        fill="currentColor"
      />
    </svg>
  )
}
