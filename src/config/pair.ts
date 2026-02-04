/**
 * Pair regex
 * eg. btc_jpy
 */
export const pairRegex = /^[a-z]{3,6}_[a-z]{3,6}$/;

/**
 * ペア名を正規化
 * Zodバリデーション済みの場合、形式変換（BTC/JPY → btc_jpy）は不要
 * 正規形式（xxx_yyy）以外は null を返す
 */
export function normalizePair(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!pairRegex.test(s)) return null;
  return s;
}

/**
 * ペアの検証結果
 */
export type PairValidationResult = { ok: true; pair: string } | { ok: false; error: { type: 'user' | 'internal'; message: string } };

/**
 * ペアを検証し、正規化して返す
 */
export function ensurePair(pair: unknown): PairValidationResult {
  const norm = normalizePair(pair);
  if (!norm) {
    return {
      ok: false,
      error: { type: 'user', message: `pair '${String(pair)}' が不正です（例: btc_jpy）` },
    };
  }
  return { ok: true, pair: norm };
}
