import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { registerGetTickersJpy } from '../get-tickers-jpy.js';

// biome-ignore lint/suspicious/noExplicitAny: test utility
type AnyFn = (...args: any[]) => any;
let handler: AnyFn;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  const mockServer = {
    tool: vi.fn((_name: string, _desc: string, _schema: unknown, cb: AnyFn) => {
      handler = cb;
    }),
  };
  registerGetTickersJpy(mockServer as never);
});

afterEach(() => {
  vi.useRealTimers();
});

const tickersData = {
  success: 1,
  data: [
    {
      pair: 'btc_jpy',
      sell: '15000000',
      buy: '14999000',
      high: '15100000',
      low: '14800000',
      open: '14900000',
      last: '15000000',
      vol: '100',
      timestamp: 1700000000000,
    },
    {
      pair: 'eth_jpy',
      sell: '300000',
      buy: '299000',
      high: '310000',
      low: '290000',
      open: '295000',
      last: '300000',
      vol: '500',
      timestamp: 1700000000000,
    },
  ],
};

describe('get_tickers_jpy', () => {
  it('全JPYペアのティッカーを返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue(tickersData);
    const result = await handler();
    expect(result.content[0].text).toContain('JPYペア 2件取得');
    expect(result.structuredContent.items).toHaveLength(2);
  });

  it('API失敗時にエラーを返す', async () => {
    // キャッシュ TTL(10秒) を超過させる
    vi.advanceTimersByTime(11000);
    (fetchJson as unknown as MockInstance).mockResolvedValue({ success: 0 });
    const result = await handler();
    expect(result.content[0].text).toContain('Failed');
  });

  it('ネットワークエラー時にエラーを返す', async () => {
    vi.advanceTimersByTime(11000);
    (fetchJson as unknown as MockInstance).mockRejectedValue(new Error('network error'));
    const result = await handler();
    expect(result.content[0].text).toContain('network error');
  });
});
