/**
 * 端末ローカル永続化（localStorage ラッパ）。
 * - 型安全な get/set/remove（JSON シリアライズ）
 * - キーは名前空間プレフィックスを付与
 * - SSR / プライベートモード / 例外でもクラッシュしない（get は fallback、set/remove は静かに失敗）
 * - バージョニング: `{ v, data }` で保存し、不一致・破損時は fallback を返す
 */

/** 名前空間プレフィックス（Kokoro no Heion） */
const NAMESPACE = 'khe:'

/** 既知キーの一元管理。実際のデータ型は各機能側で定義する */
export const STORAGE_KEYS = {
  /** 設定（音量 / 最後のサウンド / タイマー / 瞑想既定） */
  settings: 'settings',
  /** 心の日記 */
  diary: 'diary',
  /** 利用履歴 */
  history: 'history',
  /** 端末内フィードバック */
  feedback: 'feedback',
} as const

/** STORAGE_KEYS の値（保存キー名）の型 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** 保存フォーマットのバージョン。互換を壊す変更時に上げる */
const SCHEMA_VERSION = 1

/** localStorage に実際に書き込まれる包み（バージョン付き） */
interface Envelope<T> {
  v: number
  data: T
}

/**
 * localStorage を安全に取得する。
 * SSR や利用不可環境では null を返す（アクセス自体が例外を投げる場合も握りつぶす）。
 */
function getStore(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

/** 名前空間プレフィックスを付けた実キーを返す */
function prefixed(key: StorageKey): string {
  return `${NAMESPACE}${key}`
}

/** 値が Envelope 形か検証する型ガード */
function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'v' in value &&
    'data' in value &&
    typeof (value as { v: unknown }).v === 'number'
  )
}

/**
 * 指定キーの値を取得する。
 * 未保存・バージョン不一致・破損・利用不可環境では fallback を返す。
 */
export function get<T>(key: StorageKey, fallback: T): T {
  const store = getStore()
  if (!store) return fallback

  let raw: string | null
  try {
    raw = store.getItem(prefixed(key))
  } catch {
    return fallback
  }
  if (raw === null) return fallback

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isEnvelope(parsed) || parsed.v !== SCHEMA_VERSION) return fallback
    return parsed.data as T
  } catch {
    return fallback
  }
}

/**
 * 指定キーに値を保存する。
 * 利用不可環境・容量超過・シリアライズ失敗時は静かに失敗する（戻り値で成否を返す）。
 */
export function set<T>(key: StorageKey, value: T): boolean {
  const store = getStore()
  if (!store) return false

  try {
    const envelope: Envelope<T> = { v: SCHEMA_VERSION, data: value }
    store.setItem(prefixed(key), JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}

/**
 * 指定キーの値を削除する。
 * 利用不可環境・例外時は静かに失敗する。
 */
export function remove(key: StorageKey): void {
  const store = getStore()
  if (!store) return
  try {
    store.removeItem(prefixed(key))
  } catch {
    /* noop */
  }
}
