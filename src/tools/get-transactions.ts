import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BITBANK_API_BASE, fetchJson } from '../client.js';
import { ensurePair, pairRegex } from '../config/pair.js';
import { NormalizedTransaction, TransactionsResponse } from '../types.js';
import { toIsoTime } from '../utils/datetime.js';
import { formatPair, formatPrice, formatVolume } from '../utils/format.js';

export function registerGetTransactions(server: McpServer) {
  server.tool(
    'get_transactions',
    '約定履歴を取得（/transactions）。直近の約定データ。日付指定可。買い/売り比率を算出。',
    {
      pair: z.string().regex(pairRegex).describe('Trading pair (e.g., btc_jpy)'),
      limit: z.number().min(1).max(1000).default(100).describe('Number of transactions to return'),
      date: z.string().optional().describe('Date in YYYYMMDD format (optional)'),
    },
    async ({ pair, limit, date }) => {
      const chk = ensurePair(pair);
      if (!chk.ok) {
        return { content: [{ type: 'text', text: chk.error.message }] };
      }

      try {
        const url = date ? `${BITBANK_API_BASE}/${chk.pair}/transactions/${date}` : `${BITBANK_API_BASE}/${chk.pair}/transactions`;
        const json = await fetchJson<TransactionsResponse>(url, { timeoutMs: 4000 });

        if (!json || json.success !== 1) {
          return { content: [{ type: 'text', text: 'Failed to retrieve transactions data' }] };
        }

        const txns = json.data?.transactions ?? [];

        const normalized: NormalizedTransaction[] = txns
          .map((t) => ({
            transactionId: t.transaction_id,
            side: t.side,
            price: Number(t.price),
            amount: Number(t.amount),
            executedAt: t.executed_at,
            isoTime: toIsoTime(t.executed_at),
          }))
          .sort((a, b) => a.executedAt - b.executedAt)
          .slice(-limit);

        const buys = normalized.filter((t) => t.side === 'buy').length;
        const sells = normalized.filter((t) => t.side === 'sell').length;
        const total = buys + sells;
        const buyRatio = total > 0 ? Math.round((buys / total) * 100) : 0;

        const isJpy = chk.pair.includes('jpy');
        const baseCurrency = chk.pair.split('_')[0]?.toUpperCase() ?? '';
        const totalVolume = normalized.reduce((sum, t) => sum + t.amount, 0);

        // サマリ
        const lines: string[] = [];
        lines.push(`${formatPair(chk.pair)} 直近取引 ${normalized.length}件`);
        if (normalized.length > 0) {
          const latest = normalized[normalized.length - 1];
          lines.push(`最新約定: ${formatPrice(latest.price, isJpy)}`);

          const dominant = buyRatio >= 60 ? '買い優勢' : buyRatio <= 40 ? '売り優勢' : '拮抗';
          lines.push(`買い: ${buys}件 / 売り: ${sells}件（${dominant}）`);

          const volStr = totalVolume >= 1 ? totalVolume.toFixed(4) : totalVolume.toFixed(6);
          lines.push(`出来高: ${volStr} ${baseCurrency}`);
        }

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
          structuredContent: {
            normalized,
            meta: { pair: chk.pair, count: normalized.length, buys, sells, source: date ? 'by_date' : 'latest' },
          },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'ネットワークエラー';
        return { content: [{ type: 'text', text: `エラー: ${msg}` }] };
      }
    },
  );
}
