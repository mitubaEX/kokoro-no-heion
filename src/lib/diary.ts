/**
 * 心の日記の永続化。
 * storage.ts（STORAGE_KEYS.diary）を介して、日付ごとの気分とメモを
 * 端末ローカルに保存・取得・更新・削除する。すべて端末内のみ（外部送信なし）。
 */
import { get, set, STORAGE_KEYS } from './storage'

/** 1日分の記録。date は 'YYYY-MM-DD'、mood は 1〜5 の気分スケール */
export interface DiaryEntry {
  /** ローカル日付 'YYYY-MM-DD' */
  date: string
  /** 気分（1=とても悪い 〜 5=とても良い） */
  mood: number
  /** ひとことメモ */
  note: string
  /** 最終更新時刻（epoch ミリ秒） */
  updatedAt: number
}

/** 保存形式: date をキーにした entry のマップ */
type DiaryMap = Record<string, DiaryEntry>

/** mood を有効範囲（1〜5 の整数）に収める */
function clampMood(mood: number): number {
  if (!Number.isFinite(mood)) return 3
  return Math.min(5, Math.max(1, Math.round(mood)))
}

/** 保存済みのマップを読み込む（未保存・破損時は空） */
function loadMap(): DiaryMap {
  return get<DiaryMap>(STORAGE_KEYS.diary, {})
}

/** ローカル日付の 'YYYY-MM-DD' を返す（今日のキー） */
export function todayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 全エントリを新しい日付順（降順）で返す */
export function getEntries(): DiaryEntry[] {
  return Object.values(loadMap()).sort((a, b) => b.date.localeCompare(a.date))
}

/** 指定日のエントリを返す（無ければ undefined） */
export function getEntry(date: string): DiaryEntry | undefined {
  return loadMap()[date]
}

/** 指定日のエントリを作成または更新する。保存後の entry を返す */
export function upsertEntry(date: string, mood: number, note: string): DiaryEntry {
  const map = loadMap()
  const entry: DiaryEntry = {
    date,
    mood: clampMood(mood),
    note: note.trim(),
    updatedAt: Date.now(),
  }
  map[date] = entry
  set<DiaryMap>(STORAGE_KEYS.diary, map)
  return entry
}

/** 指定日のエントリを削除する */
export function deleteEntry(date: string): void {
  const map = loadMap()
  if (date in map) {
    delete map[date]
    set<DiaryMap>(STORAGE_KEYS.diary, map)
  }
}
