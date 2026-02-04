import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { registerGetCandles } from '../get-candles.js';

// biome-ignore lint/suspicious/noExplicitAny: test utility
type AnyFn = (...args: any[]) => any;
let handler: AnyFn;

beforeEach(() => {
  vi.clearAllMocks();
  const mockServer = {
    tool: vi.fn((_name: string, _desc: string, _schema: unknown, cb: AnyFn) => {
      handler = cb;
    }),
  };
  registerGetCandles(mockServer as never);
});

const candlesData = {
  success: 1,
  data: {
    candlestick: [
      {
        type: '1day',
        ohlcv: [
          ['14900000', '15100000', '14800000', '15000000', '100', 1700000000000],
          ['15000000', '15200000', '14900000', '15100000', '120', 1700086400000],
        ],
      },
    ],
  },
};

describe('get_candles', () => {
  it('ローソク足データを返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue(candlesData);
    const result = await handler({ pair: 'btc_jpy', type: '1day', limit: 200 });
    expect(result.content[0].text).toContain('ローソク足2本取得');
    expect(result.structuredContent.normalized).toHaveLength(2);
  });

  it('不正なペアでエラーメッセージを返す', async () => {
    const result = await handler({ pair: 'invalid', type: '1day', limit: 200 });
    expect(result.content[0].text).toContain('不正');
  });

  it('空データの場合にメッセージを返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue({
      success: 1,
      data: { candlestick: [{ type: '1day', ohlcv: [] }] },
    });
    const result = await handler({ pair: 'btc_jpy', type: '1day', limit: 200 });
    expect(result.content[0].text).toContain('見つかりません');
  });

  it('ネットワークエラー時にエラーを返す', async () => {
    (fetchJson as unknown as MockInstance).mockRejectedValue(new Error('timeout'));
    const result = await handler({ pair: 'btc_jpy', type: '1day', limit: 200 });
    expect(result.content[0].text).toContain('timeout');
  });
});
