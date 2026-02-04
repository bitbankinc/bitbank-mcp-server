import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../client.js', () => ({
  BITBANK_API_BASE: 'https://public.bitbank.cc',
  fetchJson: vi.fn(),
}));

import { fetchJson } from '../../client.js';
import { registerGetDepth } from '../get-depth.js';

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
