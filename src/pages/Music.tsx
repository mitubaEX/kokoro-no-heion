import { useState } from 'react'
import { SOUNDSCAPES } from '../audio/soundscapes'
import { useAudioEngine } from '../audio/useAudioEngine'
import { formatClock } from '../lib/format'
import { loadSettings } from '../lib/settings'
import './Music.css'

const TIMER_OPTIONS = [5, 15, 30, 60]

export default function Music() {
  const engine = useAudioEngine()
  // 前回選んだサウンドスケープ（自動再生はせず、UI 上の目印に使う）
  const [lastScapeId] = useState(() => loadSettings().lastScapeId)
  const lastScape = SOUNDSCAPES.find((s) => s.id === lastScapeId) ?? null

  const activeTimerMinutes =
    engine.timerTotalMs != null ? Math.round(engine.timerTotalMs / 60_000) : null

  return (
    <section>
      <h1 className="section-title">ヒーリングミュージック</h1>
      <p className="section-lead">
        気分に合わせて、ひとつ選んでみましょう。すべて著作権フリーで、その場で生成される音です。
      </p>

      {!engine.isPlaying && lastScape && (
        <p className="section-lead">
          前回は「{lastScape.emoji} {lastScape.name}」を選びました。タップで再生できます。
        </p>
      )}

      <div className="scape-grid">
        {SOUNDSCAPES.map((s) => {
          const playing = engine.currentId === s.id
          return (
            <button
              key={s.id}
              className={`scape${playing ? ' playing' : ''}`}
              style={{ ['--h' as string]: String(s.hue) }}
              onClick={() => engine.play(s.id)}
              aria-pressed={playing}
            >
              {playing && (
                <span className="eq" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              )}
              <span className="emoji" aria-hidden>
                {s.emoji}
              </span>
              <span className="name">{s.name}</span>
              <span className="desc">{s.description}</span>
            </button>
          )
        })}
      </div>

      <div className="card controls">
        <div className="control-block">
          <div className="label">
            <span>音量</span>
            <span className="mono">{Math.round(engine.volume * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={engine.volume}
            onChange={(e) => engine.setVolume(Number(e.target.value))}
            aria-label="音量"
          />
        </div>

        <div className="control-block">
          <div className="label">
            <span>就寝タイマー</span>
            {engine.timerRemainingMs != null && (
              <span className="mono">残り {formatClock(engine.timerRemainingMs)}</span>
            )}
          </div>
          <div className="timer-chips">
            <button
              className={`chip${activeTimerMinutes == null ? ' active' : ''}`}
              onClick={() => engine.cancelTimer()}
            >
              なし
            </button>
            {TIMER_OPTIONS.map((m) => (
              <button
                key={m}
                className={`chip${activeTimerMinutes === m ? ' active' : ''}`}
                onClick={() => engine.startTimer(m)}
              >
                {m}分
              </button>
            ))}
          </div>
          {engine.timerRemainingMs != null && (
            <div className="timer-readout">
              指定時間が来たら、ゆっくり音が消えて停止します。
            </div>
          )}
        </div>

        {engine.isPlaying && (
          <button className="btn" onClick={() => engine.stop()}>
            ⏸ 停止する
          </button>
        )}
      </div>
    </section>
  )
}
