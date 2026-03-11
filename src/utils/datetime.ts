/**
 * 日時変換ユーティリティ
 */
import dayjs from 'dayjs';

/**
 * タイムスタンプをISO8601形式に変換
 * @param ts タイムスタンプ（ミリ秒）
 * @returns ISO8601文字列、無効な場合はnull
 */
export function toIsoTime(ts: unknown): string | null {
  const num = Number(ts);
  if (!Number.isFinite(num)) return null;
  const d = dayjs(num);
  return d.isValid() ? d.toISOString() : null;
}
