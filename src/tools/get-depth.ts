import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BITBANK_API_BASE, fetchJson } from '../client.js';
import { ensurePair, pairRegex } from '../config/pair.js';
import { DepthResponse } from '../types.js';
import { toIsoTime } from '../utils/datetime.js';
import { formatPair, formatPrice } from '../utils/format.js';

export function registerGetDepth(server: McpServer) {
  server.tool(
    'get_depth',
    '板の生データ取得（/depth API直接）。差分計算・壁検出・圧力分析の元データ。maxLevelsで層数制限。',
    {
      pair: z.string().regex(pairRegex).describe('Trading pair (e.g., btc_jpy)'),
      maxLevels: z.number().min(1).max(500).default(200).describe('Maximum number of price levels'),
    },
    async ({ pair, maxLevels }) => {
      const chk = ensurePair(pair);
      if (!chk.ok) {
        return { content: [{ type: 'text', text: chk.error.message }] };
      }

      try {
        const url = `${BITBANK_API_BASE}/${chk.pair}/depth`;
        const json = await fetchJson<DepthResponse>(url, { timeoutMs: 3000 });

        if (!json || json.success !== 1) {
          return { content: [{ type: 'text', text: 'Failed to retrieve depth data' }] };
        }

        const d = json.data;
        const asks = d.asks.slice(0, maxLevels).map(([p, s]) => [Number(p), Number(s)]);
        const bids = d.bids.slice(0, maxLevels).map(([p, s]) => [Number(p), Number(s)]);

        const bestAsk = asks[0]?.[0] ?? null;
        const bestBid = bids[0]?.[0] ?? null;
        const mid = bestBid && bestAsk ? Number(((bestBid + bestAsk) / 2).toFixed(2)) : null;

        const isJpy = chk.pair.includes('jpy');

        // サマリ
        const lines: string[] = [];
        lines.push(`${formatPair(chk.pair)} 板深度`);
        lines.push(`中値: ${mid ? formatPrice(mid, isJpy) : 'N/A'}`);
        lines.push(`板の層数: 買い ${bids.length}層 / 売り ${asks.length}層`);
        lines.push(`時刻: ${toIsoTime(d.timestamp) ?? 'N/A'}`);

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
          structuredContent: {
            asks,
            bids,
            timestamp: d.timestamp,
            sequenceId: d.sequenceId,
            meta: { pair: chk.pair, maxLevels, asksCount: asks.length, bidsCount: bids.length },
          },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'ネットワークエラー';
        return { content: [{ type: 'text', text: `エラー: ${msg}` }] };
      }
    },
  );
}
