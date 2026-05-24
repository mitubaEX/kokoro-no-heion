import { useEffect, type ReactNode } from 'react'
import { useAudioEngine } from '../audio/useAudioEngine'
import './AudioGate.css'

/**
 * 音声有効化まわりの UX をまとめるラッパ。
 * - まだ音声が一度もアンロックされていない間だけ、控えめなヒントを表示。
 * - 初回のユーザー操作（pointerdown / keydown）を一度捕捉したら
 *   AudioContext を resume してヒントを消す。
 *   （実際に音が鳴るのは再生ボタン押下時。ここでは確実な初回再生のため resume だけ行う）
 */
export default function AudioGate({ children }: { children: ReactNode }) {
  const { unlocked, unlock } = useAudioEngine()

  useEffect(() => {
    if (unlocked) return

    const onFirstInteraction = () => {
      void unlock()
    }

    // 一度だけ捕捉。実際に unlocked になれば下の cleanup で外れる
    window.addEventListener('pointerdown', onFirstInteraction, { once: true })
    window.addEventListener('keydown', onFirstInteraction, { once: true })

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction)
      window.removeEventListener('keydown', onFirstInteraction)
    }
  }, [unlocked, unlock])

  return (
    <>
      {children}
      {!unlocked && (
        <div className="audio-gate-hint" role="status" aria-live="polite">
          <span aria-hidden="true">🔈</span>
          画面のどこかをタップすると音が始まります
        </div>
      )}
    </>
  )
}
