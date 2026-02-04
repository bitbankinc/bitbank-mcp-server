/**
 * Pair regex
 * eg. btc_jpy
 */
export const pairRegex = /^[a-z]{3,6}_[a-z]{3,6}$/;

/**
 * bitbank 公式ペアリスト（アクティブなもののみ）
 * 参考: https://github.com/bitbankinc/bitbank-api-docs/blob/master/pairs.md
 */
export const ALLOWED_PAIRS: Set<string> = new Set([
  // 主要ペア
  'btc_jpy',
  'eth_jpy',
  'xrp_jpy',
  'ltc_jpy',
  'bcc_jpy',
  // アルトコイン
  'mona_jpy',
  'xlm_jpy',
  'qtum_jpy',
  'bat_jpy',
  'omg_jpy',
  'xym_jpy',
  'link_jpy',
  'boba_jpy',
  'enj_jpy',
  'dot_jpy',
  'doge_jpy',
  'astr_jpy',
  'ada_jpy',
  'avax_jpy',
  'axs_jpy',
  'flr_jpy',
  'sand_jpy',
  'gala_jpy',
  'ape_jpy',
  'chz_jpy',
  'oas_jpy',
  'mana_jpy',
  'grt_jpy',
  'bnb_jpy',
  'dai_jpy',
  'op_jpy',
  'arb_jpy',
  'klay_jpy',
  'imx_jpy',
  'mask_jpy',
  'pol_jpy', // 旧 matic_jpy
  'sol_jpy',
  'cyber_jpy',
  'render_jpy', // 旧 rndr_jpy
  'trx_jpy',
  'lpt_jpy',
  'atom_jpy',
  'sui_jpy',
  'sky_jpy', // 旧 mkr_jpy
]);

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
  if (!ALLOWED_PAIRS.has(norm)) {
    return {
      ok: false,
      error: {
        type: 'user',
        message: `未対応のpair: '${norm}'（対応例: btc_jpy, eth_jpy, xrp_jpy）`,
      },
    };
  }
  return { ok: true, pair: norm };
}
