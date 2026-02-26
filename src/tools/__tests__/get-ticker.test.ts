import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { registerGetTicker } from '../get-ticker.js';

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
  registerGetTicker(mockServer as never);
});

const tickerData = {
  success: 1,
  data: {
    sell: '15000000',
    buy: '14999000',
    high: '15100000',
    low: '14800000',
    open: '14900000',
    last: '15000000',
    vol: '100',
    timestamp: 1700000000000,
  },
};

describe('get_ticker', () => {
  it('正常なティッカーデータを返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue(tickerData);
    const result = await handler({ pair: 'btc_jpy' });
    expect(result.content[0].text).toContain('BTC/JPY');
    expect(result.structuredContent.normalized.last).toBe(15000000);
  });

  it('不正なペアでエラーメッセージを返す', async () => {
    const result = await handler({ pair: 'invalid' });
    expect(result.content[0].text).toContain('不正');
  });

  it('API失敗時にエラーを返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue({ success: 0 });
    const result = await handler({ pair: 'btc_jpy' });
    expect(result.content[0].text).toContain('Failed');
  });

  it('ネットワークエラー時にエラーを返す', async () => {
    (fetchJson as unknown as MockInstance).mockRejectedValue(new Error('timeout'));
    const result = await handler({ pair: 'btc_jpy' });
    expect(result.content[0].text).toContain('timeout');
  });
});
