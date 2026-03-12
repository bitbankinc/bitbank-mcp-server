import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dayjs from 'dayjs';
import { z } from 'zod';
import { BITBANK_API_BASE, fetchJson } from '../client.js';
import { ensurePair, pairRegex } from '../config/pair.js';
import { CandlestickResponse, NormalizedCandle } from '../types.js';
import { toIsoTime } from '../utils/datetime.js';
import { formatChange, formatPair, formatPrice, formatVolume } from '../utils/format.js';

const CANDLE_TYPES = ['1min', '5min', '15min', '30min', '1hour', '4hour', '8hour', '12hour', '1day', '1week', '1month'] as const;
const YEARLY_TYPES = new Set(['4hour', '8hour', '12hour', '1day', '1week', '1month']);

export interface BuildCandlesTextParams {
  pair: string;
  type: string;
  normalized: NormalizedCandle[];
}

export function buildCandlesText({ pair, type, normalized }: BuildCandlesTextParams): string {
  const latest = normalized[normalized.length - 1];
  const oldest = normalized[0];
  const isJpy = pair.includes('jpy');
  const baseCurrency = pair.split('_')[0]?.toUpperCase() ?? '';

  const lines: string[] = [];
  lines.push(`${formatPair(pair)} [${type}] ローソク足${normalized.length}本`);
  lines.push(`期間: ${oldest.isoTime?.split('T')[0] ?? 'N/A'} 〜 ${latest.isoTime?.split('T')[0] ?? 'N/A'}`);
  lines.push('');
  lines.push('# | datetime | open | high | low | close | chg% | volume');
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    const changePct = c.open > 0 ? ((c.close - c.open) / c.open) * 100 : 0;
    lines.push(
      `${i} | ${c.isoTime ?? 'N/A'} | ${formatPrice(c.open, isJpy)} | ${formatPrice(c.high, isJpy)} | ${formatPrice(c.low, isJpy)} | ${formatPrice(c.close, isJpy)} | ${formatChange(changePct)} | ${formatVolume(c.volume, baseCurrency)}`,
    );
  }
  // 出来高トレンド（前半 vs 後半）
  const half = Math.floor(normalized.length / 2);
  if (half > 0) {
    const firstHalfVol = normalized.slice(0, half).reduce((s, c) => s + c.volume, 0);
    const secondHalfVol = normalized.slice(half).reduce((s, c) => s + c.volume, 0);
    const volTrend = secondHalfVol > firstHalfVol ? '増加' : secondHalfVol < firstHalfVol ? '減少' : '横ばい';
    lines.push('');
    lines.push(
      `出来高トレンド: 前半 ${formatVolume(firstHalfVol, baseCurrency)} → 後半 ${formatVolume(secondHalfVol, baseCurrency)} (${volTrend})`,
    );
  }

  return lines.join('\n');
}

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

        const text = buildCandlesText({ pair: chk.pair, type, normalized });

        return {
          content: [{ type: 'text', text }],
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
