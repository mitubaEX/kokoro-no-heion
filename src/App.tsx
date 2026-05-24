import { useState, type ComponentType } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Music from './pages/Music'
import Meditation from './pages/Meditation'
import Teachings from './pages/Teachings'
import Diary from './pages/Diary'
import BrandMark from './components/BrandMark'
import FeedbackSheet from './components/FeedbackSheet'
import {
  DiaryIcon,
  HomeIcon,
  MeditationIcon,
  SoundIcon,
  TeachingsIcon,
} from './components/NavIcons'

type NavItem = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'ホーム', Icon: HomeIcon, end: true },
  { to: '/music', label: '音', Icon: SoundIcon },
  { to: '/meditation', label: '瞑想', Icon: MeditationIcon },
  { to: '/teachings', label: '教え', Icon: TeachingsIcon },
  { to: '/diary', label: '日記', Icon: DiaryIcon },
]

export default function App() {
  // フィードバックシートの開閉
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <div className="app">
      <header className="brand">
        <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <BrandMark className="mark" />
          心の平穏
        </span>
        <span className="sub">Kokoro no Heion</span>
        <button
          className="btn"
          style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.78rem' }}
          onClick={() => setFeedbackOpen(true)}
          aria-label="ご意見・フィードバックを送る"
        >
          <span aria-hidden="true">💬</span>
          ご意見
        </button>
      </header>

      <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/teachings" element={<Teachings />} />
          <Route path="/diary" element={<Diary />} />
        </Routes>
      </main>

      <nav className="nav" aria-label="メインナビゲーション">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="ico" aria-hidden>
              <n.Icon />
            </span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
