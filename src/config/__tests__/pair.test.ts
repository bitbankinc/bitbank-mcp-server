import { describe, expect, it } from 'vitest';
import { ALLOWED_PAIRS, ensurePair, normalizePair } from '../pair.js';

describe('normalizePair', () => {
  it('正規形式をそのまま返す', () => {
    expect(normalizePair('btc_jpy')).toBe('btc_jpy');
  });

  it('大文字を小文字に変換する', () => {
    expect(normalizePair('BTC_JPY')).toBe('btc_jpy');
  });

  it('前後の空白をトリムする', () => {
    expect(normalizePair(' btc_jpy ')).toBe('btc_jpy');
  });

  it('スラッシュ形式は null を返す（Zodバリデーション前提）', () => {
    expect(normalizePair('BTC/JPY')).toBeNull();
  });

  it('null に対して null を返す', () => {
    expect(normalizePair(null)).toBeNull();
  });

  it('空文字列に対して null を返す', () => {
    expect(normalizePair('')).toBeNull();
  });
});

describe('ensurePair', () => {
  it('有効なペアで ok: true を返す', () => {
    const result = ensurePair('btc_jpy');
    expect(result).toEqual({ ok: true, pair: 'btc_jpy' });
  });

  it('不正な形式で ok: false を返す', () => {
    const result = ensurePair('invalid');
    expect(result.ok).toBe(false);
  });

  it('未対応ペアで ok: false を返す', () => {
    const result = ensurePair('xxx_yyy');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/未対応/);
    }
  });
});

describe('ALLOWED_PAIRS', () => {
  it('主要ペアを含む', () => {
    expect(ALLOWED_PAIRS.has('btc_jpy')).toBe(true);
    expect(ALLOWED_PAIRS.has('eth_jpy')).toBe(true);
    expect(ALLOWED_PAIRS.has('xrp_jpy')).toBe(true);
  });
});
