import { Link } from 'react-router-dom'
import { findSoundscape } from '../audio/soundscapes'
import { PATTERNS } from '../data/meditations'
import { phraseOfTheDay } from '../data/phrases'
import { getHistory, recommend } from '../lib/history'
import './Home.css'

function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'おそくまで、おつかれさまです'
  if (h < 11) return 'おはようございます'
  if (h < 18) return 'こんにちは'
  return 'こんばんは'
}

export default function Home() {
  // 利用履歴に基づくおすすめ（存在する id のみ返る）
  const rec = recommend()
  const recSound = findSoundscape(rec.soundId)
  const recPattern = PATTERNS.find((p) => p.id === rec.patternId)
  // 履歴が少ないうちは控えめな注記を出す
  const fewHistory = !rec.fromHistory || getHistory().length < 3

  return (
    <section>
      <div className="greeting">{greeting()}</div>
      <div className="greeting-sub">
        今日も、心がやすらぐひとときを。まずは深く、ひと呼吸。
      </div>

      <div className="card quote-card">
        <div className="quote-mark" aria-hidden>
          “
        </div>
        <div className="quote-text">{phraseOfTheDay()}</div>
        <div className="quote-label">今日の一言</div>
      </div>

      {(recSound || recPattern) && (
        <div className="recommend">
          <div className="rec-head">あなたへのおすすめ</div>
          <div className="actions">
            {recSound && (
              <Link className="action" to="/music">
                <span className="a-ico" aria-hidden>
                  {recSound.emoji}
                </span>
                <span className="a-title">{recSound.name}</span>
                <span className="a-desc">{recSound.description}</span>
              </Link>
            )}
            {recPattern && (
              <Link className="action" to="/meditation">
                <span className="a-ico" aria-hidden>
                  🧘
                </span>
                <span className="a-title">{recPattern.name}</span>
                <span className="a-desc">{recPattern.desc}</span>
              </Link>
            )}
          </div>
          {fewHistory && (
            <div className="rec-note">
              使うほどに、あなたに合ったおすすめが育ちます。
            </div>
          )}
        </div>
      )}

      <div className="actions">
        <Link className="action" to="/music">
          <span className="a-ico" aria-hidden>
            🎵
          </span>
          <span className="a-title">音を聴く</span>
          <span className="a-desc">波・雨・森などのヒーリングサウンド</span>
        </Link>
        <Link className="action" to="/meditation">
          <span className="a-ico" aria-hidden>
            🧘
          </span>
          <span className="a-title">瞑想する</span>
          <span className="a-desc">呼吸にあわせた、やさしい誘導</span>
        </Link>
      </div>

      <div className="upcoming">
        <span className="pill">準備中</span>
        <span>「先人の教え」「日記」は今後のアップデートで追加予定です。</span>
      </div>
    </section>
  )
}
