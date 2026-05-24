/**
 * 利用履歴のローカル集計とパーソナライズおすすめ。
 * - 再生・瞑想のイベントを storage（STORAGE_KEYS.history）に記録（直近100件）
 * - 履歴の頻度＋時間帯から、おすすめサウンド／瞑想パターンを算出する
 * - 依存は storage.ts のみ（AudioEngine 側から import するため循環を避ける）
 */
import { SOUNDSCAPES } from '../audio/soundscapes'
import { PATTERNS } from '../data/meditations'
import { get, set, STORAGE_KEYS } from './storage'

/** 1回の利用イベント（サウンド再生 or 瞑想開始） */
export interface UsageEvent {
  type: 'sound' | 'meditation'
  id: string
  at: number
}

/** 履歴の保持上限（直近 N 件） */
const MAX_EVENTS = 100

/** 時間帯（朝/昼/夜） */
type TimeOfDay = 'morning' | 'day' | 'night'

/** おすすめ結果 */
export interface Recommendation {
  soundId: string
  patternId: string
  /** おすすめ根拠が履歴か（false=時間帯ベースの既定） */
  fromHistory: boolean
}

/** 時刻から時間帯を求める（朝 5〜10 / 昼 11〜17 / 夜 18〜翌4） */
function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 18) return 'day'
  return 'night'
}

/** 時間帯ベースの妥当な既定（存在する id を選ぶ） */
const TIME_DEFAULTS: Record<TimeOfDay, { soundIds: string[]; patternId: string }> = {
  // 朝: 森・せせらぎ＋しずかな 5-5
  morning: { soundIds: ['forest', 'waves'], patternId: 'calm' },
  // 昼: 雨・波＋集中のボックス
  day: { soundIds: ['rain', 'waves'], patternId: 'box' },
  // 夜: 波・星空＋リラックス 4-7-8
  night: { soundIds: ['waves', 'pad'], patternId: 'relax' },
}

/** 利用イベントを記録する（直近 MAX_EVENTS 件にトリム） */
export function logEvent(type: UsageEvent['type'], id: string): void {
  const events = getHistory()
  events.push({ type, id, at: Date.now() })
  const trimmed = events.slice(-MAX_EVENTS)
  set<UsageEvent[]>(STORAGE_KEYS.history, trimmed)
}

/** 保存済みの利用履歴を取得する（未保存・破損時は空配列） */
export function getHistory(): UsageEvent[] {
  return get<UsageEvent[]>(STORAGE_KEYS.history, [])
}

/** 指定タイプのイベントを id ごとに頻度集計する */
function frequency(events: UsageEvent[], type: UsageEvent['type']): Map<string, number> {
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.type !== type) continue
    counts.set(e.id, (counts.get(e.id) ?? 0) + 1)
  }
  return counts
}

/**
 * 候補 id 群からおすすめを1つ選ぶ。
 * - 今の時間帯に使われた頻度を 2 倍重みで加味（時間帯マッチを優先）
 * - 同点・履歴なしのときは既定候補→先頭、の順でフォールバック
 * - validIds に無い id は決して返さない
 */
function pick(
  counts: Map<string, number>,
  events: UsageEvent[],
  type: UsageEvent['type'],
  now: TimeOfDay,
  validIds: Set<string>,
  defaults: string[],
): { id: string; hasData: boolean } {
  // 現在の時間帯に絞った頻度（時間帯一致を優先するための重み付けに使う）
  const sameSlot = frequency(
    events.filter((e) => timeOfDay(new Date(e.at)) === now),
    type,
  )

  let bestId: string | null = null
  let bestScore = 0
  for (const [id, count] of counts) {
    if (!validIds.has(id)) continue // 存在しない id は除外
    const score = count + (sameSlot.get(id) ?? 0)
    if (score > bestScore) {
      bestScore = score
      bestId = id
    }
  }

  if (bestId !== null) return { id: bestId, hasData: true }

  // 履歴なし: 時間帯ベースの既定（存在する最初の候補）→ なければ先頭
  const fallback = defaults.find((id) => validIds.has(id))
  return { id: fallback ?? [...validIds][0], hasData: false }
}

/**
 * 履歴の頻度＋時間帯から、おすすめのサウンドと瞑想パターンを返す。
 * 履歴が空なら時間帯ベースの妥当な既定にフォールバックし、
 * 存在しない id は SOUNDSCAPES / PATTERNS と突き合わせて返さない。
 */
export function recommend(date = new Date()): Recommendation {
  const events = getHistory()
  const slot = timeOfDay(date)
  const def = TIME_DEFAULTS[slot]

  const validSounds = new Set(SOUNDSCAPES.map((s) => s.id))
  const validPatterns = new Set(PATTERNS.map((p) => p.id))

  const sound = pick(
    frequency(events, 'sound'),
    events,
    'sound',
    slot,
    validSounds,
    def.soundIds,
  )
  const pattern = pick(
    frequency(events, 'meditation'),
    events,
    'meditation',
    slot,
    validPatterns,
    [def.patternId],
  )

  return {
    soundId: sound.id,
    patternId: pattern.id,
    fromHistory: sound.hasData || pattern.hasData,
  }
}
