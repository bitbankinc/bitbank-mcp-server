import { describe, expect, it } from 'vitest';
import { toIsoTime } from '../datetime.js';

describe('toIsoTime', () => {
  it('ミリ秒タイムスタンプをISO8601に変換する', () => {
    const result = toIsoTime(1700000000000);
    expect(result).toBe('2023-11-14T22:13:20.000Z');
  });

  it('0を変換できる', () => {
    expect(toIsoTime(0)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('null は Number(null)=0 となり epoch を返す', () => {
    expect(toIsoTime(null)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('undefined に対して null を返す', () => {
    expect(toIsoTime(undefined)).toBeNull();
  });

  it('NaN に対して null を返す', () => {
    expect(toIsoTime(Number.NaN)).toBeNull();
  });

  it('Infinity に対して null を返す', () => {
    expect(toIsoTime(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('文字列の数値を変換できる', () => {
    const result = toIsoTime('1700000000000');
    expect(result).toBe('2023-11-14T22:13:20.000Z');
  });

  it('数値でない文字列に対して null を返す', () => {
    expect(toIsoTime('abc')).toBeNull();
  });
});
