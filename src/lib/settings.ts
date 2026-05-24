/**
 * アプリ設定の永続化。
 * storage.ts（STORAGE_KEYS.settings）を介して、音量・最後のサウンド・
 * タイマー既定・瞑想の既定を端末ローカルに保存し、次回起動時に復元する。
 */
import { get, set, STORAGE_KEYS } from './storage'

/** 保存・復元する設定一式 */
export interface AppSettings {
  /** マスター音量（0〜1） */
  volume: number
  /** 最後に選んだサウンドスケープ id（自動再生はしない / 未選択は null） */
  lastScapeId: string | null
  /** 就寝タイマーの既定分数（未設定は null） */
  timerMinutes: number | null
  /** 瞑想の既定パターン id */
  medPatternId: string
  /** 瞑想の既定の長さ（分） */
  medMinutes: number
  /** 瞑想の背景音トグル */
  medBackground: boolean
}

/** 各画面の初期値に使う既定設定（既存挙動に合わせる） */
export const DEFAULT_SETTINGS: AppSettings = {
  volume: 0.7,
  lastScapeId: null,
  timerMinutes: null,
  medPatternId: 'relax',
  medMinutes: 3,
  medBackground: true,
}

/** 設定を読み込む（未保存・破損時は既定値で補完） */
export function loadSettings(): AppSettings {
  const stored = get<Partial<AppSettings>>(STORAGE_KEYS.settings, {})
  return { ...DEFAULT_SETTINGS, ...stored }
}

/** 設定の一部だけを更新して保存する（既存値とマージ） */
export function saveSettings(partial: Partial<AppSettings>): void {
  const next = { ...loadSettings(), ...partial }
  set<AppSettings>(STORAGE_KEYS.settings, next)
}
