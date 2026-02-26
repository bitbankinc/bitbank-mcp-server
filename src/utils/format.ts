/**
 * 共通フォーマットユーティリティ
 */

/**
 * ペア名を表示用にフォーマット (btc_jpy → BTC/JPY)
 */
export function formatPair(pair: string): string {
  return (pair || '').toUpperCase().replace('_', '/');
}

/**
 * 価格をフォーマット
 */
export function formatPrice(price: number | null, isJpy: boolean): string {
  if (price === null) return 'N/A';
  if (isJpy) {
    return `¥${price.toLocaleString('ja-JP')}`;
  }
  return price.toLocaleString('ja-JP');
}

/**
 * 変動率をフォーマット
 */
export function formatChange(changePct: number | null): string {
  if (changePct === null) return '';
  const sign = changePct >= 0 ? '+' : '';
  return `${sign}${changePct.toFixed(2)}%`;
}

/**
 * 出来高をフォーマット
 */
export function formatVolume(vol: number | null, baseCurrency: string): string {
  if (vol === null) return 'N/A';
  if (vol >= 1000) {
    return `${(vol / 1000).toFixed(2)}K ${baseCurrency}`;
  }
  return `${vol.toFixed(4)} ${baseCurrency}`;
}
