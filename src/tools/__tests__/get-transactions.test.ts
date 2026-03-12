import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import type { NormalizedTransaction } from '../../types.js';
import { type BuildTransactionsTextParams, buildTransactionsText, registerGetTransactions } from '../get-transactions.js';

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

describe('buildTransactionsText', () => {
  const normalized: NormalizedTransaction[] = [
    { transactionId: 1, side: 'buy', price: 15000000, amount: 0.01, executedAt: 1700000000000, isoTime: '2023-11-14T22:13:20.000Z' },
    { transactionId: 2, side: 'sell', price: 15001000, amount: 0.02, executedAt: 1700000001000, isoTime: '2023-11-14T22:13:21.000Z' },
    { transactionId: 3, side: 'buy', price: 15002000, amount: 0.015, executedAt: 1700000002000, isoTime: '2023-11-14T22:13:22.000Z' },
  ];

  const baseParams: BuildTransactionsTextParams = {
    pair: 'btc_jpy',
    normalized,
    buys: 2,
    sells: 1,
    buyRatio: 67,
    totalVolume: 0.045,
  };

  it('ヘッダーにペア名と件数を含む', () => {
    const text = buildTransactionsText(baseParams);
    expect(text).toContain('BTC/JPY 直近取引 3件');
  });

  it('買い優勢を表示する（buyRatio >= 60）', () => {
    const text = buildTransactionsText(baseParams);
    expect(text).toContain('買い優勢');
    expect(text).toContain('買い 2件 / 売り 1件');
  });

  it('売り優勢を表示する（buyRatio <= 40）', () => {
    const params: BuildTransactionsTextParams = { ...baseParams, buys: 1, sells: 3, buyRatio: 25 };
    const text = buildTransactionsText(params);
    expect(text).toContain('売り優勢');
  });

  it('拮抗を表示する（41 <= buyRatio <= 59）', () => {
    const params: BuildTransactionsTextParams = { ...baseParams, buys: 2, sells: 2, buyRatio: 50 };
    const text = buildTransactionsText(params);
    expect(text).toContain('拮抗');
  });

  it('出来高を表示する（< 1の場合は6桁）', () => {
    const text = buildTransactionsText(baseParams);
    expect(text).toContain('出来高: 0.045000 BTC');
  });

  it('出来高を表示する（>= 1の場合は4桁）', () => {
    const params: BuildTransactionsTextParams = { ...baseParams, totalVolume: 1.5 };
    const text = buildTransactionsText(params);
    expect(text).toContain('出来高: 1.5000 BTC');
  });

  it('テーブルヘッダーを含む', () => {
    const text = buildTransactionsText(baseParams);
    expect(text).toContain('datetime | side | price | amount');
  });

  it('各取引を全件展開する', () => {
    const text = buildTransactionsText(baseParams);
    expect(text).toContain('2023-11-14T22:13:20.000Z | buy | ¥15,000,000 | 0.01 BTC');
    expect(text).toContain('2023-11-14T22:13:21.000Z | sell | ¥15,001,000 | 0.02 BTC');
    expect(text).toContain('2023-11-14T22:13:22.000Z | buy | ¥15,002,000 | 0.015 BTC');
  });

  it('空の取引リストではヘッダーのみ表示', () => {
    const params: BuildTransactionsTextParams = {
      pair: 'btc_jpy',
      normalized: [],
      buys: 0,
      sells: 0,
      buyRatio: 0,
      totalVolume: 0,
    };
    const text = buildTransactionsText(params);
    expect(text).toBe('BTC/JPY 直近取引 0件');
  });

  it('JPY以外のペアでは¥記号を使わない', () => {
    const params: BuildTransactionsTextParams = {
      pair: 'eth_btc',
      normalized: [
        { transactionId: 1, side: 'buy', price: 0.065, amount: 5, executedAt: 1700000000000, isoTime: '2023-11-14T22:13:20.000Z' },
      ],
      buys: 1,
      sells: 0,
      buyRatio: 100,
      totalVolume: 5,
    };
    const text = buildTransactionsText(params);
    expect(text).not.toContain('¥');
    expect(text).toContain('ETH/BTC');
  });

  it('isoTimeがnullの場合はN/Aを表示する', () => {
    const params: BuildTransactionsTextParams = {
      ...baseParams,
      normalized: [{ transactionId: 1, side: 'buy', price: 15000000, amount: 0.01, executedAt: 0, isoTime: null }],
      buys: 1,
      sells: 0,
      buyRatio: 100,
      totalVolume: 0.01,
    };
    const text = buildTransactionsText(params);
    expect(text).toContain('N/A | buy');
  });
});
