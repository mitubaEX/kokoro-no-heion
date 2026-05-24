import { useEffect, useRef, useState } from 'react'
import { addFeedback } from '../lib/feedback'
import './FeedbackSheet.css'

/** アプリ情報（package.json の version と揃える） */
const APP_NAME = '心の平穏 — Kokoro no Heion'
const APP_VERSION = '0.1.0'

/** フィードバックのカテゴリ候補 */
const CATEGORIES = ['ご意見', '不具合', '機能リクエスト', 'その他'] as const

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * フィードバック入力シート（モーダル）。
 * - バックエンドを持たず、入力内容はこの端末内にのみ保存する
 * - Esc / 背景タップ / 閉じるボタンで閉じる
 * - 夜空テーマの CSS 変数に調和（FeedbackSheet.css）
 */
export default function FeedbackSheet({ open, onClose }: Props) {
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 開いている間だけ Esc キーで閉じる
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // 開いたら入力欄へフォーカス、閉じたら入力状態をリセット
  useEffect(() => {
    if (open) {
      textareaRef.current?.focus()
    } else {
      setText('')
      setDone(false)
      setCategory(CATEGORIES[0])
    }
  }, [open])

  if (!open) return null

  const canSubmit = text.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    addFeedback(category, text.trim())
    setText('')
    setDone(true)
  }

  return (
    <div className="fb-overlay" onClick={onClose}>
      <div
        className="fb-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="フィードバックとアプリ情報"
        // シート内クリックで閉じないようにする
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fb-head">
          <div className="fb-title">
            <h2>{APP_NAME}</h2>
            <span className="fb-version">v{APP_VERSION}</span>
          </div>
          <button className="fb-close" onClick={onClose} aria-label="閉じる">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <p className="fb-update">コンテンツは継続的に更新されます。</p>

        {done ? (
          <div className="fb-thanks" role="status" aria-live="polite">
            <p>ありがとうございます。いただいた声を大切にします。</p>
            <button
              className="btn fb-again"
              onClick={() => setDone(false)}
            >
              続けて書く
            </button>
          </div>
        ) : (
          <div className="fb-form">
            <div className="fb-field">
              <span className="fb-label" id="fb-category-label">
                カテゴリ
              </span>
              <div
                className="fb-chips"
                role="group"
                aria-labelledby="fb-category-label"
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`fb-chip${category === c ? ' is-active' : ''}`}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="fb-text">
                ご意見・ご感想
              </label>
              <textarea
                id="fb-text"
                ref={textareaRef}
                className="fb-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="気づいたこと、感じたことをそのままどうぞ。"
                rows={4}
              />
            </div>

            <button
              className="btn btn-primary fb-submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              送信する
            </button>
          </div>
        )}

        <p className="fb-privacy">
          いただいた声はこの端末内にのみ保存されます。
        </p>
      </div>
    </div>
  )
}
