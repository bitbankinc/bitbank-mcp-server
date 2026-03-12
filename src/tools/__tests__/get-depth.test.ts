import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { type BuildDepthTextParams, buildDepthText, registerGetDepth } from '../get-depth.js';

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
  registerGetDepth(mockServer as never);
});

const depthData = {
  success: 1,
  data: {
    asks: [
      ['15000000', '0.5'],
      ['15001000', '1.0'],
    ],
    bids: [
      ['14999000', '0.8'],
      ['14998000', '1.2'],
    ],
    timestamp: 1700000000000,
    sequenceId: '123456',
  },
};

describe('get_depth', () => {
  it('板情報を返す', async () => {
    (fetchJson as unknown as MockInstance).mockResolvedValue(depthData);
    const result = await handler({ pair: 'btc_jpy', maxLevels: 200 });
    expect(result.content[0].text).toContain('板深度');
    expect(result.structuredContent.asks).toHaveLength(2);
    expect(result.structuredContent.bids).toHaveLength(2);
  });

  it('不正なペアでエラーメッセージを返す', async () => {
    const result = await handler({ pair: 'invalid', maxLevels: 200 });
    expect(result.content[0].text).toContain('不正');
  });

  it('ネットワークエラー時にエラーを返す', async () => {
    (fetchJson as unknown as MockInstance).mockRejectedValue(new Error('timeout'));
    const result = await handler({ pair: 'btc_jpy', maxLevels: 200 });
    expect(result.content[0].text).toContain('timeout');
  });
});

describe('buildDepthText', () => {
  const baseParams: BuildDepthTextParams = {
    pair: 'btc_jpy',
    asks: [
      [15000000, 0.5],
      [15001000, 1.0],
    ],
    bids: [
      [14999000, 0.8],
      [14998000, 1.2],
    ],
    mid: 14999500,
    timestamp: 1700000000000,
  };

  it('ヘッダーにペア名と板深度を含む', () => {
    const text = buildDepthText(baseParams);
    expect(text).toContain('BTC/JPY 板深度');
  });

  it('中値と時刻を表示する', () => {
    const text = buildDepthText(baseParams);
    expect(text).toContain('中値: ¥14,999,500');
    expect(text).toContain('時刻: 2023-11-14T22:13:20.000Z');
  });

  it('ASKS セクションを全件展開する', () => {
    const text = buildDepthText(baseParams);
    expect(text).toContain('[ASKS 売り板 2層]');
    expect(text).toContain('¥15,000,000 | 0.5000 BTC');
    expect(text).toContain('¥15,001,000 | 1.0000 BTC');
  });

  it('BIDS セクションを全件展開する', () => {
    const text = buildDepthText(baseParams);
    expect(text).toContain('[BIDS 買い板 2層]');
    expect(text).toContain('¥14,999,000 | 0.8000 BTC');
    expect(text).toContain('¥14,998,000 | 1.2000 BTC');
  });

  it('テーブルヘッダーを含む', () => {
    const text = buildDepthText(baseParams);
    const priceAmountHeaders = text.split('\n').filter((l) => l === 'price | amount');
    expect(priceAmountHeaders).toHaveLength(2);
  });

  it('中値がnullの場合はN/Aを表示する', () => {
    const params: BuildDepthTextParams = { ...baseParams, mid: null };
    const text = buildDepthText(params);
    expect(text).toContain('中値: N/A');
  });

  it('JPY以外のペアでは¥記号を使わない', () => {
    const params: BuildDepthTextParams = {
      pair: 'eth_btc',
      asks: [[0.065, 10]],
      bids: [[0.064, 12]],
      mid: 0.0645,
      timestamp: 1700000000000,
    };
    const text = buildDepthText(params);
    expect(text).not.toContain('¥');
    expect(text).toContain('ETH/BTC');
  });

  it('出力全体のフォーマットを検証する', () => {
    const text = buildDepthText(baseParams);
    const lines = text.split('\n');
    expect(lines[0]).toBe('BTC/JPY 板深度');
    expect(lines[1]).toContain('中値:');
    expect(lines[2]).toBe('');
    expect(lines[3]).toContain('[ASKS 売り板');
    expect(lines[4]).toBe('price | amount');
    // asks data lines
    expect(lines[5]).toContain('¥15,000,000');
    expect(lines[6]).toContain('¥15,001,000');
    expect(lines[7]).toBe('');
    expect(lines[8]).toContain('[BIDS 買い板');
    expect(lines[9]).toBe('price | amount');
    // bids data lines
    expect(lines[10]).toContain('¥14,999,000');
    expect(lines[11]).toContain('¥14,998,000');
  });
});
