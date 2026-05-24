import { useEffect, useMemo, useState } from 'react'
import {
  deleteEntry,
  getEntries,
  getEntry,
  todayKey,
  upsertEntry,
  type DiaryEntry,
} from '../lib/diary'
import './Diary.css'

/** 気分スケール（1〜5）と絵文字・ラベルの対応 */
const MOODS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😣', label: 'つらい' },
  { value: 2, emoji: '😕', label: 'いまひとつ' },
  { value: 3, emoji: '😐', label: 'ふつう' },
  { value: 4, emoji: '🙂', label: 'おだやか' },
  { value: 5, emoji: '😄', label: 'ごきげん' },
]

/** mood 値から絵文字を引く（不明値は中立） */
function moodEmoji(mood: number): string {
  return MOODS.find((m) => m.value === mood)?.emoji ?? '😐'
}

/** 'YYYY-MM-DD' を読みやすい和式表記に整形（曜日付き） */
function formatJaDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
  return `${y}年${m}月${d}日（${weekday}）`
}

export default function Diary() {
  const today = useMemo(() => todayKey(), [])

  // 今日の記録エディタの状態
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  // 保存済みエントリ一覧（保存・削除のたびに再読込）
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  // 保存後の控えめな完了表示
  const [saved, setSaved] = useState(false)

  // 一覧を storage から再読込する
  function reload() {
    setEntries(getEntries())
  }

  // 初回マウント時: 今日分があればプリフィルし、一覧を読み込む
  useEffect(() => {
    const todayEntry = getEntry(today)
    if (todayEntry) {
      setMood(todayEntry.mood)
      setNote(todayEntry.note)
    }
    reload()
  }, [today])

  // 完了表示は数秒で自動的に消す
  useEffect(() => {
    if (!saved) return
    const id = window.setTimeout(() => setSaved(false), 2400)
    return () => window.clearTimeout(id)
  }, [saved])

  const isEditing = entries.some((e) => e.date === today)

  function handleSave() {
    if (mood == null) return
    upsertEntry(today, mood, note)
    reload()
    setSaved(true)
  }

  function handleDelete(date: string) {
    const label = formatJaDate(date)
    if (!window.confirm(`${label} の記録を削除しますか？`)) return
    deleteEntry(date)
    // 今日分を消した場合はエディタもクリア
    if (date === today) {
      setMood(null)
      setNote('')
      setSaved(false)
    }
    reload()
  }

  return (
    <section>
      <h1 className="section-title">心の日記</h1>
      <p className="section-lead">
        今日の気分とひとことを残して、心の動きをそっと振り返りましょう。
      </p>

      {/* 今日の記録エディタ */}
      <div className="card diary-editor">
        <div className="diary-today">{formatJaDate(today)}</div>

        <div className="mood-label">いまの気分</div>
        <div
          className="mood-picker"
          role="radiogroup"
          aria-label="今日の気分を選ぶ"
        >
          {MOODS.map((m) => {
            const active = mood === m.value
            return (
              <button
                key={m.value}
                type="button"
                className={`mood-option${active ? ' active' : ''}`}
                onClick={() => setMood(m.value)}
                role="radio"
                aria-checked={active}
                aria-label={m.label}
                title={m.label}
              >
                <span className="mood-emoji" aria-hidden>
                  {m.emoji}
                </span>
                <span className="mood-name">{m.label}</span>
              </button>
            )
          })}
        </div>

        <label className="mood-label" htmlFor="diary-note">
          ひとことメモ
        </label>
        <textarea
          id="diary-note"
          className="diary-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="今日はどんな一日でしたか？（任意）"
          rows={3}
        />

        <div className="diary-save-row">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={mood == null}
          >
            {isEditing ? '記録を更新する' : '記録を保存する'}
          </button>
          {saved && (
            <span className="diary-saved" role="status">
              ✓ 保存しました
            </span>
          )}
        </div>
      </div>

      <p className="diary-privacy">
        🔒 記録はこの端末内にのみ保存されます。外部に送信されることはありません。
      </p>

      {/* 過去の記録一覧 */}
      <h2 className="diary-list-title">これまでの記録</h2>
      {entries.length === 0 ? (
        <p className="diary-empty">
          まだ記録がありません。今日のひとことから始めてみましょう。
        </p>
      ) : (
        <div className="diary-list">
          {entries.map((e) => (
            <article key={e.date} className="card diary-entry">
              <div className="diary-entry-head">
                <span className="diary-entry-emoji" aria-hidden>
                  {moodEmoji(e.mood)}
                </span>
                <span className="diary-entry-date">{formatJaDate(e.date)}</span>
                <button
                  className="diary-delete"
                  onClick={() => handleDelete(e.date)}
                  aria-label={`${formatJaDate(e.date)} の記録を削除`}
                  title="削除"
                >
                  🗑
                </button>
              </div>
              {e.note && <p className="diary-entry-note">{e.note}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
