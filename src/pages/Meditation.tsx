import { useState } from 'react'
import { DURATION_OPTIONS, PATTERNS } from '../data/meditations'
import { formatClock } from '../lib/format'
import { loadSettings, saveSettings } from '../lib/settings'
import { useMeditation } from './useMeditation'
import './Meditation.css'

export default function Meditation() {
  const med = useMeditation()
  // 初期値は保存済みの瞑想設定から復元
  const [saved] = useState(loadSettings)
  const [patternId, setPatternId] = useState(saved.medPatternId)
  const [minutes, setMinutes] = useState(saved.medMinutes)
  const [background, setBackground] = useState(saved.medBackground)

  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0]

  if (med.status === 'running') {
    return (
      <section className="med-stage">
        <div className="breath-wrap">
          <div
            className="breath-ring"
            aria-hidden
            style={{
              transform: `scale(${med.scale})`,
              transitionDuration: `${med.transitionSec}s`,
            }}
          />
          <div className="breath-center">
            {/* フェーズ名の変化（吸う/止める/吐く）をスクリーンリーダーに通知。
                秒カウントは毎秒変わり読み上げが煩雑になるため live 領域から外す。 */}
            <div className="breath-phase" aria-live="polite">
              {med.phaseLabel}
            </div>
            <div className="breath-count mono" aria-hidden>
              {med.phaseSecondsLeft}
            </div>
          </div>
        </div>

        <div className="session-readout">
          残り時間 <span className="mono">{formatClock(med.sessionSecondsLeft * 1000)}</span>
        </div>

        <button className="btn" onClick={med.stop}>
          やめる
        </button>
      </section>
    )
  }

  if (med.status === 'done') {
    return (
      <section className="med-done">
        <div className="big" aria-hidden>
          🌿
        </div>
        <h1 className="section-title">おつかれさまでした</h1>
        <p className="section-lead">
          ひと呼吸おいて、いまの心の状態をそっと感じてみましょう。
        </p>
        <button className="btn btn-primary" onClick={med.reset}>
          もう一度
        </button>
      </section>
    )
  }

  return (
    <section>
      <h1 className="section-title">瞑想ガイド</h1>
      <p className="section-lead">
        呼吸のリズムにあわせて、輪がふくらみ、しぼみます。画面に身をまかせてみましょう。
      </p>

      <div className="card med-setup">
        <div className="option-group">
          <div className="label">呼吸のパターン</div>
          <div className="pattern-list">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                className={`pattern${p.id === patternId ? ' active' : ''}`}
                onClick={() => setPatternId(p.id)}
                aria-pressed={p.id === patternId}
              >
                <div className="pname">{p.name}</div>
                <div className="pdesc">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="label">長さ</div>
          <div className="duration-chips">
            {DURATION_OPTIONS.map((m) => (
              <button
                key={m}
                className={`chip${m === minutes ? ' active' : ''}`}
                onClick={() => setMinutes(m)}
              >
                {m}分
              </button>
            ))}
          </div>
        </div>

        <label className="bg-toggle">
          <input
            type="checkbox"
            checked={background}
            onChange={(e) => setBackground(e.target.checked)}
          />
          背景に「星空のパッド」をそっと流す
        </label>

        <button
          className="btn btn-primary"
          onClick={() => {
            // 開始時に選択を既定として保存
            saveSettings({
              medPatternId: pattern.id,
              medMinutes: minutes,
              medBackground: background,
            })
            med.start(pattern, minutes, background)
          }}
        >
          はじめる
        </button>
      </div>
    </section>
  )
}
