import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dayjs from 'dayjs';
import { BITBANK_API_BASE, fetchJson } from '../client.js';
import { ALLOWED_PAIRS } from '../config/pair.js';
import { NormalizedTicker, TickersJpyResponse } from '../types.js';
import { toIsoTime } from '../utils/datetime.js';
import { formatChange, formatPair, formatPrice } from '../utils/format.js';

let tickersJpyCache: { ts: number; data: NormalizedTicker[] } | null = null;
const TICKERS_JPY_CACHE_TTL = 10000;

export function registerGetTickersJpy(server: McpServer) {
  server.tool('get_tickers_jpy', '全JPYペアのティッカーを取得（/tickers_jpy）。24h変動率付き。キャッシュ10秒。', {}, async () => {
    const now = dayjs().valueOf();

    // キャッシュチェック
    if (tickersJpyCache && now - tickersJpyCache.ts < TICKERS_JPY_CACHE_TTL) {
      return {
        content: [{ type: 'text', text: `JPYペア ${tickersJpyCache.data.length}件 (cached)` }],
        structuredContent: { items: tickersJpyCache.data, meta: { cached: true } },
      };
    }

    try {
      const json = await fetchJson<TickersJpyResponse>(`${BITBANK_API_BASE}/tickers_jpy`, { timeoutMs: 5000 });

      if (!json || json.success !== 1 || !Array.isArray(json.data)) {
        return { content: [{ type: 'text', text: 'Failed to retrieve tickers_jpy data' }] };
      }

      // ALLOWED_PAIRSでフィルタ
      const filtered = json.data.filter((d) => ALLOWED_PAIRS.has(d.pair));

      const items: NormalizedTicker[] = filtered.map((d) => {
        const last = Number(d.last);
        const open = Number(d.open);
        const volume = Number(d.vol);
        const change24hPct = open > 0 ? Number((((last - open) / open) * 100).toFixed(2)) : null;

        return {
          pair: d.pair,
          last,
          buy: Number(d.buy),
          sell: Number(d.sell),
          open,
          high: Number(d.high),
          low: Number(d.low),
          volume,
          timestamp: d.timestamp,
          isoTime: toIsoTime(d.timestamp),
          change24hPct,
          vol24hJpy: Math.round(last * volume),
        };
      });

      tickersJpyCache = { ts: now, data: items };

      // サマリ
      const lines: string[] = [];
      lines.push(`JPYペア ${items.length}件取得`);
      for (const item of items.slice(0, 5)) {
        lines.push(`${formatPair(item.pair)}: ${formatPrice(item.last, true)} (${formatChange(item.change24hPct ?? null)})`);
      }
      if (items.length > 5) {
        lines.push(`... 他${items.length - 5}ペア`);
      }

      return {
        content: [{ type: 'text', text: lines.join('\n') }],
        structuredContent: { items, meta: { count: items.length, fetchedAt: dayjs().toISOString() } },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ネットワークエラー';
      return { content: [{ type: 'text', text: `エラー: ${msg}` }] };
    }
  });
}
