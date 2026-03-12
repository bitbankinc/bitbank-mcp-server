import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { type BuildCandlesTextParams, buildCandlesText, registerGetCandles } from '../get-candles.js';

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
    expect(result.content[0].text).toContain('ローソク足2本');
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

describe('buildCandlesText', () => {
  const baseParams: BuildCandlesTextParams = {
    pair: 'btc_jpy',
    type: '1day',
    normalized: [
      {
        open: 14900000,
        high: 15100000,
        low: 14800000,
        close: 15000000,
        volume: 100,
        timestamp: 1700000000000,
        isoTime: '2023-11-14T22:13:20.000Z',
      },
      {
        open: 15000000,
        high: 15200000,
        low: 14900000,
        close: 15100000,
        volume: 120,
        timestamp: 1700086400000,
        isoTime: '2023-11-15T22:13:20.000Z',
      },
    ],
  };

  it('ヘッダーにペア名・タイプ・本数を含む', () => {
    const text = buildCandlesText(baseParams);
    expect(text).toContain('BTC/JPY [1day] ローソク足2本');
  });

  it('期間を表示する', () => {
    const text = buildCandlesText(baseParams);
    expect(text).toContain('期間: 2023-11-14 〜 2023-11-15');
  });

  it('テーブルヘッダーを含む', () => {
    const text = buildCandlesText(baseParams);
    expect(text).toContain('# | datetime | open | high | low | close | chg% | volume');
  });

  it('各行にOHLCVデータを全件展開する', () => {
    const text = buildCandlesText(baseParams);
    const lines = text.split('\n');
    // 行0のデータ
    const row0 = lines.find((l) => l.startsWith('0 |'));
    expect(row0).toBeDefined();
    expect(row0).toContain('2023-11-14T22:13:20.000Z');
    expect(row0).toContain('¥14,900,000');
    expect(row0).toContain('¥15,100,000');
    expect(row0).toContain('¥14,800,000');
    expect(row0).toContain('¥15,000,000');
    // 行1のデータ
    const row1 = lines.find((l) => l.startsWith('1 |'));
    expect(row1).toBeDefined();
    expect(row1).toContain('2023-11-15T22:13:20.000Z');
    expect(row1).toContain('¥15,100,000');
  });

  it('変動率を計算して表示する', () => {
    const text = buildCandlesText(baseParams);
    // (15000000 - 14900000) / 14900000 * 100 ≈ +0.67%
    expect(text).toContain('+0.67%');
  });

  it('出来高トレンドを表示する（増加）', () => {
    const text = buildCandlesText(baseParams);
    expect(text).toContain('出来高トレンド:');
    expect(text).toContain('(増加)');
  });

  it('出来高トレンド: 減少パターン', () => {
    const params: BuildCandlesTextParams = {
      ...baseParams,
      normalized: [
        {
          open: 15000000,
          high: 15200000,
          low: 14900000,
          close: 15100000,
          volume: 200,
          timestamp: 1700000000000,
          isoTime: '2023-11-14T22:13:20.000Z',
        },
        {
          open: 15100000,
          high: 15300000,
          low: 15000000,
          close: 15200000,
          volume: 50,
          timestamp: 1700086400000,
          isoTime: '2023-11-15T22:13:20.000Z',
        },
      ],
    };
    const text = buildCandlesText(params);
    expect(text).toContain('(減少)');
  });

  it('出来高トレンド: 横ばいパターン', () => {
    const params: BuildCandlesTextParams = {
      ...baseParams,
      normalized: [
        {
          open: 15000000,
          high: 15200000,
          low: 14900000,
          close: 15100000,
          volume: 100,
          timestamp: 1700000000000,
          isoTime: '2023-11-14T22:13:20.000Z',
        },
        {
          open: 15100000,
          high: 15300000,
          low: 15000000,
          close: 15200000,
          volume: 100,
          timestamp: 1700086400000,
          isoTime: '2023-11-15T22:13:20.000Z',
        },
      ],
    };
    const text = buildCandlesText(params);
    expect(text).toContain('(横ばい)');
  });

  it('1本のみの場合は出来高トレンドを表示しない', () => {
    const params: BuildCandlesTextParams = {
      ...baseParams,
      normalized: [
        {
          open: 15000000,
          high: 15200000,
          low: 14900000,
          close: 15100000,
          volume: 100,
          timestamp: 1700000000000,
          isoTime: '2023-11-14T22:13:20.000Z',
        },
      ],
    };
    const text = buildCandlesText(params);
    expect(text).not.toContain('出来高トレンド');
  });

  it('JPY以外のペアでは¥記号を使わない', () => {
    const params: BuildCandlesTextParams = {
      pair: 'btc_usdt',
      type: '1hour',
      normalized: [
        { open: 50000, high: 51000, low: 49000, close: 50500, volume: 10, timestamp: 1700000000000, isoTime: '2023-11-14T22:13:20.000Z' },
        { open: 50500, high: 52000, low: 50000, close: 51000, volume: 15, timestamp: 1700003600000, isoTime: '2023-11-14T23:13:20.000Z' },
      ],
    };
    const text = buildCandlesText(params);
    expect(text).not.toContain('¥');
    expect(text).toContain('BTC/USDT');
  });

  it('isoTimeがnullの場合はN/Aを表示する', () => {
    const params: BuildCandlesTextParams = {
      ...baseParams,
      normalized: [{ open: 15000000, high: 15200000, low: 14900000, close: 15100000, volume: 100, timestamp: 0, isoTime: null }],
    };
    const text = buildCandlesText(params);
    expect(text).toContain('N/A');
  });
});
