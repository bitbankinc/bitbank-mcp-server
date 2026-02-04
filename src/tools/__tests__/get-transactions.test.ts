import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { registerGetTransactions } from '../get-transactions.js';

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
  registerGetTransactions(mockServer as never);
});

const txData = {
  success: 1,
  data: {
    transactions: [
      { transaction_id: 1, side: 'buy', price: '15000000', amount: '0.01', executed_at: 1700000000000 },
      { transaction_id: 2, side: 'sell', price: '15001000', amount: '0.02', executed_at: 1700000001000 },
      { transaction_id: 3, side: 'buy', price: '15002000', amount: '0.015', executed_at: 1700000002000 },
    ],
  },
};

describe('get_transactions', () => {
  it('約定履歴を返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue(txData);
    const result = await handler({ pair: 'btc_jpy', limit: 100 });
    expect(result.content[0].text).toContain('直近取引 3件');
    expect(result.structuredContent.normalized).toHaveLength(3);
    expect(result.structuredContent.meta.buys).toBe(2);
    expect(result.structuredContent.meta.sells).toBe(1);
  });

  it('不正なペアでエラーメッセージを返す', async () => {
    const result = await handler({ pair: 'invalid', limit: 100 });
    expect(result.content[0].text).toContain('不正');
  });

  it('ネットワークエラー時にエラーを返す', async () => {
    (fetchJson as unknown as MockInstance).mockRejectedValue(new Error('timeout'));
    const result = await handler({ pair: 'btc_jpy', limit: 100 });
    expect(result.content[0].text).toContain('timeout');
  });
});
