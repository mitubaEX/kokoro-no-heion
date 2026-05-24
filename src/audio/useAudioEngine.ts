import { useSyncExternalStore } from 'react'
import { audioEngine } from './AudioEngine'

/** エンジンの状態を購読し、操作関数とあわせて返すフック */
export function useAudioEngine() {
  const state = useSyncExternalStore(audioEngine.subscribe, audioEngine.getSnapshot)
  return {
    ...state,
    play: (id: string) => audioEngine.play(id),
    stop: () => audioEngine.stop(),
    setVolume: (v: number) => audioEngine.setVolume(v),
    startTimer: (min: number) => audioEngine.startTimer(min),
    cancelTimer: () => audioEngine.cancelTimer(),
    chime: (freq?: number, dur?: number) => audioEngine.chime(freq, dur),
    unlock: () => audioEngine.unlock(),
  }
}
