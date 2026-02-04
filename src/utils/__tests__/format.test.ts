import { describe, expect, it } from 'vitest';
import { formatChange, formatPair, formatPrice, formatVolume } from '../format.js';

describe('formatPair', () => {
  it('btc_jpy を BTC/JPY に変換する', () => {
    expect(formatPair('btc_jpy')).toBe('BTC/JPY');
  });

  it('空文字列を処理できる', () => {
    expect(formatPair('')).toBe('');
  });
});

describe('formatPrice', () => {
  it('JPY価格をフォーマットする', () => {
    expect(formatPrice(1500000, true)).toMatch(/¥/);
  });

  it('非JPY価格をフォーマットする', () => {
    const result = formatPrice(0.05, false);
    expect(result).not.toMatch(/¥/);
  });

  it('null に対して N/A を返す', () => {
    expect(formatPrice(null, true)).toBe('N/A');
  });
});

describe('formatChange', () => {
  it('正の変動率をフォーマットする', () => {
    expect(formatChange(5.5)).toBe('+5.50%');
  });

  it('負の変動率をフォーマットする', () => {
    expect(formatChange(-3.2)).toBe('-3.20%');
  });

  it('0をフォーマットする', () => {
    expect(formatChange(0)).toBe('+0.00%');
  });

  it('null に対して空文字列を返す', () => {
    expect(formatChange(null)).toBe('');
  });
});

describe('formatVolume', () => {
  it('1000以上をK表示する', () => {
    expect(formatVolume(1500, 'BTC')).toBe('1.50K BTC');
  });

  it('1000未満を小数表示する', () => {
    expect(formatVolume(0.5, 'BTC')).toBe('0.5000 BTC');
  });

  it('null に対して N/A を返す', () => {
    expect(formatVolume(null, 'BTC')).toBe('N/A');
  });
});
