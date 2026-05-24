/**
 * 端末内フィードバックの保存と取得。
 * - バックエンドを持たず、いただいた声はこの端末内（localStorage）にのみ保存する
 * - storage（STORAGE_KEYS.feedback）に配列で保持（直近 MAX_ITEMS 件にトリム）
 * - 依存は storage.ts のみ
 */
import { get, set, STORAGE_KEYS } from './storage'

/** 1件のフィードバック */
export interface Feedback {
  id: string
  category: string
  text: string
  at: number
}

/** 保持上限（直近 N 件） */
const MAX_ITEMS = 50

/** 簡易な一意 id（時刻＋乱数。端末内用途のため厳密性は不要） */
function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 保存済みフィードバックを新しい順で取得する（未保存・破損時は空配列） */
export function getFeedback(): Feedback[] {
  const items = get<Feedback[]>(STORAGE_KEYS.feedback, [])
  // at の降順（新しい順）
  return [...items].sort((a, b) => b.at - a.at)
}

/** フィードバックを1件追加する（直近 MAX_ITEMS 件にトリム）。追加した値を返す */
export function addFeedback(category: string, text: string): Feedback {
  const entry: Feedback = { id: makeId(), category, text, at: Date.now() }
  // 新しい順に並べ、古いものから切り落とす
  const next = [entry, ...getFeedback()].slice(0, MAX_ITEMS)
  set<Feedback[]>(STORAGE_KEYS.feedback, next)
  return entry
}

/** 保存済みフィードバックをすべて削除する */
export function clearFeedback(): void {
  set<Feedback[]>(STORAGE_KEYS.feedback, [])
}
