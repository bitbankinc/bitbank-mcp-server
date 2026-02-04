import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dayjs from 'dayjs';
import { z } from 'zod';
import { BITBANK_API_BASE, fetchJson } from '../client.js';
import { ensurePair, pairRegex } from '../config/pair.js';
import { CandlestickResponse, NormalizedCandle } from '../types.js';
import { toIsoTime } from '../utils/datetime.js';
import { formatPair, formatPrice } from '../utils/format.js';

const CANDLE_TYPES = ['1min', '5min', '15min', '30min', '1hour', '4hour', '8hour', '12hour', '1day', '1week', '1month'] as const;
const YEARLY_TYPES = new Set(['4hour', '8hour', '12hour', '1day', '1week', '1month']);

export function registerGetCandles(server: McpServer) {
  server.tool(
    'get_candles',
    'ローソク足を取得（/candlestick）。OHLCVデータ。date: 1min〜1hour→YYYYMMDD, 4hour以上→YYYY。limit で本数指定。',
    {
      pair: z.string().regex(pairRegex).describe('Trading pair (e.g., btc_jpy)'),
      type: z.enum(CANDLE_TYPES).default('1day').describe('Candle type/timeframe'),
      date: z.string().optional().describe('Date in YYYYMMDD (for minute/hour) or YYYY (for day/week/month)'),
      limit: z.number().min(1).max(1000).default(200).describe('Number of candles to return'),
    },
    async ({ pair, type, date, limit }) => {
      const chk = ensurePair(pair);
      if (!chk.ok) {
        return { content: [{ type: 'text', text: chk.error.message }] };
      }

      // 日付の処理
      const isYearly = YEARLY_TYPES.has(type);
      let dateParam: string;

      if (date) {
        dateParam = isYearly ? date.substring(0, 4) : date;
      } else {
        const now = dayjs();
        dateParam = isYearly ? now.format('YYYY') : now.format('YYYYMMDD');
      }

      try {
        const url = `${BITBANK_API_BASE}/${chk.pair}/candlestick/${type}/${dateParam}`;
        const json = await fetchJson<CandlestickResponse>(url, { timeoutMs: 8000 });

        if (!json || json.success !== 1) {
          return { content: [{ type: 'text', text: 'Failed to retrieve candlestick data' }] };
        }

        const ohlcv = json.data?.candlestick?.[0]?.ohlcv ?? [];

        if (ohlcv.length === 0) {
          return { content: [{ type: 'text', text: `ローソク足データが見つかりません (${chk.pair}/${type}/${dateParam})` }] };
        }

        const rows = ohlcv.slice(-limit);
        const normalized: NormalizedCandle[] = rows.map(([o, h, l, c, v, ts]) => ({
          open: Number(o),
          high: Number(h),
          low: Number(l),
          close: Number(c),
          volume: Number(v),
          timestamp: ts,
          isoTime: toIsoTime(ts),
        }));

        const latest = normalized[normalized.length - 1];
        const oldest = normalized[0];
        const isJpy = chk.pair.includes('jpy');

        // サマリ生成
        const lines: string[] = [];
        lines.push(`${formatPair(chk.pair)} [${type}] ローソク足${normalized.length}本取得`);
        lines.push(`期間: ${oldest.isoTime?.split('T')[0] ?? 'N/A'} 〜 ${latest.isoTime?.split('T')[0] ?? 'N/A'}`);
        lines.push(`最新終値: ${formatPrice(latest.close, isJpy)}`);
        lines.push('');
        lines.push(`⚠️ 配列は古い順: data[0]=最古、data[${normalized.length - 1}]=最新`);

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
          structuredContent: {
            normalized,
            meta: { pair: chk.pair, type, date: dateParam, count: normalized.length },
          },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'ネットワークエラー';
        return { content: [{ type: 'text', text: `エラー: ${msg}` }] };
      }
    },
  );
}
