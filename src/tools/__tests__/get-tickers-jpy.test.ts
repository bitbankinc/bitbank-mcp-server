import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import type { NormalizedTicker } from '../../types.js';
import { buildTickersJpyText, registerGetTickersJpy } from '../get-tickers-jpy.js';

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
    expect(result.content[0].text).toContain('JPYペア 2件');
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

describe('buildTickersJpyText', () => {
  const items: NormalizedTicker[] = [
    {
      pair: 'btc_jpy',
      last: 15000000,
      buy: 14999000,
      sell: 15000000,
      open: 14900000,
      high: 15100000,
      low: 14800000,
      volume: 100,
      timestamp: 1700000000000,
      isoTime: '2023-11-14T22:13:20.000Z',
      change24hPct: 0.67,
      vol24hJpy: 1500000000,
    },
    {
      pair: 'eth_jpy',
      last: 300000,
      buy: 299000,
      sell: 300000,
      open: 295000,
      high: 310000,
      low: 290000,
      volume: 500,
      timestamp: 1700000000000,
      isoTime: '2023-11-14T22:13:20.000Z',
      change24hPct: 1.69,
      vol24hJpy: 150000000,
    },
  ];

  it('ヘッダーに件数を表示する', () => {
    const text = buildTickersJpyText(items, false);
    expect(text).toContain('JPYペア 2件');
    expect(text).not.toContain('cached');
  });

  it('cached フラグが表示される', () => {
    const text = buildTickersJpyText(items, true);
    expect(text).toContain('(cached)');
  });

  it('テーブルヘッダーを含む', () => {
    const text = buildTickersJpyText(items, false);
    expect(text).toContain('pair | last | high | low | vol | chg24h');
  });

  it('各ペアのデータを全件展開する', () => {
    const text = buildTickersJpyText(items, false);
    expect(text).toContain('BTC/JPY');
    expect(text).toContain('¥15,000,000');
    expect(text).toContain('¥15,100,000');
    expect(text).toContain('¥14,800,000');
    expect(text).toContain('+0.67%');
    expect(text).toContain('ETH/JPY');
    expect(text).toContain('¥300,000');
    expect(text).toContain('¥310,000');
    expect(text).toContain('¥290,000');
    expect(text).toContain('+1.69%');
  });

  it('出来高をフォーマットする', () => {
    const text = buildTickersJpyText(items, false);
    // 100 < 1000 → 100.0000 BTC
    expect(text).toContain('100.0000 BTC');
    // 500 < 1000 → 500.0000 ETH
    expect(text).toContain('500.0000 ETH');
  });

  it('空配列の場合は0件のヘッダーのみ', () => {
    const text = buildTickersJpyText([], false);
    expect(text).toContain('JPYペア 0件');
    const lines = text.split('\n');
    expect(lines).toHaveLength(2); // header + table header
  });

  it('change24hPctがnullの場合は空文字を表示する', () => {
    const itemsWithNull: NormalizedTicker[] = [
      {
        pair: 'xrp_jpy',
        last: 80,
        buy: 79,
        sell: 80,
        open: 0,
        high: 85,
        low: 75,
        volume: 10000,
        timestamp: 1700000000000,
        isoTime: '2023-11-14T22:13:20.000Z',
        change24hPct: null,
      },
    ];
    const text = buildTickersJpyText(itemsWithNull, false);
    // formatChange(null) returns ''
    const lines = text.split('\n');
    const dataLine = lines[2];
    expect(dataLine).toContain('XRP/JPY');
    // Should end with " | " (empty change)
    expect(dataLine).toMatch(/\| $/);
  });
});
