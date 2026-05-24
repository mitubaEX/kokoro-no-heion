import { useState } from 'react'
import { TEACHINGS, THEMES, teachingsByTheme, type Theme } from '../data/teachings'
import './Teachings.css'

type Filter = 'all' | Theme

export default function Teachings() {
  const [filter, setFilter] = useState<Filter>('all')

  const list = filter === 'all' ? TEACHINGS : teachingsByTheme(filter)

  return (
    <section>
      <h1 className="section-title">先人の教え</h1>
      <p className="section-lead">
        出典の確かな、古今の言葉を集めました。いまの心に響くテーマから選んでみましょう。
      </p>

      <div className="theme-chips" role="group" aria-label="テーマで絞り込む">
        <button
          className={`chip${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          すべて
        </button>
        {THEMES.map((t) => (
          <button
            key={t}
            className={`chip${filter === t ? ' active' : ''}`}
            onClick={() => setFilter(t)}
            aria-pressed={filter === t}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="teaching-list">
        {list.map((teaching) => (
          <article key={teaching.id} className="card teaching">
            <div className="quote-mark" aria-hidden>
              “
            </div>
            <p className="t-text">{teaching.text}</p>
            <div className="t-source">— {teaching.source}</div>
            <div className="t-note">{teaching.note}</div>
            <div className="t-themes">
              {teaching.theme.map((th) => (
                <span key={th} className="pill">
                  {th}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="t-footnote">
        誤った帰属を避けるため、出典が確かでパブリックドメインの言葉のみを収録しています。
        解説は、現代の私たちに寄り添うためのやさしい意訳です。
      </p>
    </section>
  )
}
