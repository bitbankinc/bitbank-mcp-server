#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import { z } from 'zod';
import { BITBANK_API_BASE, fetchJson } from './client.js';
import { ALLOWED_PAIRS, ensurePair, pairRegex } from './config/pair.js';
import {
  CandlestickResponse,
  DepthResponse,
  NormalizedCandle,
  NormalizedDepthEntry,
  NormalizedTicker,
  NormalizedTransaction,
  TickerResponse,
  TickersJpyResponse,
  TransactionsResponse,
} from './types.js';
import { toIsoTime } from './utils/datetime.js';
import { formatChange, formatPair, formatPrice, formatVolume } from './utils/format.js';

// Create server instance
const server = new McpServer({
  name: 'bitbank',
  version: '0.2.0',
});

// ============================================================
// get_ticker - 単一ペアのティッカー情報を取得
// ============================================================
function registerGetTicker(server: McpServer) {
  server.tool(
    'get_ticker',
    '単一ペアのティッカーを取得（/ticker）。価格・出来高・24h高安。',
    {
      pair: z.string().regex(pairRegex).describe('Trading pair (e.g., btc_jpy, eth_jpy)'),
    },
    async ({ pair }) => {
      const chk = ensurePair(pair);
      if (!chk.ok) {
        return { content: [{ type: 'text', text: chk.error.message }] };
      }

      try {
        const json = await fetchJson<TickerResponse>(`${BITBANK_API_BASE}/${chk.pair}/ticker`, { timeoutMs: 5000 });

        if (!json || json.success !== 1) {
          return { content: [{ type: 'text', text: 'Failed to retrieve ticker data' }] };
        }

        const d = json.data;
        const isJpy = chk.pair.includes('jpy');
        const baseCurrency = chk.pair.split('_')[0]?.toUpperCase() ?? '';

        const last = Number(d.last);
        const open = Number(d.open);
        const high = Number(d.high);
        const low = Number(d.low);
        const buy = Number(d.buy);
        const sell = Number(d.sell);
        const vol = Number(d.vol);

        // 変動率計算
        const changePct = open > 0 ? ((last - open) / open) * 100 : null;
        // スプレッド計算
        const spread = sell - buy;
        // JPY出来高
        const jpyVol = BigNumber(d.vol).multipliedBy(BigNumber(d.last)).toFixed(0);

        // 出力フォーマット
        const lines: string[] = [];
        lines.push(`${formatPair(chk.pair)} 現在値: ${formatPrice(last, isJpy)}`);
        lines.push(`24h: 始値 ${formatPrice(open, isJpy)} / 高値 ${formatPrice(high, isJpy)} / 安値 ${formatPrice(low, isJpy)}`);
        if (changePct !== null) {
          lines.push(`24h変動: ${formatChange(changePct)}`);
        }
        lines.push(`出来高: ${formatVolume(vol, baseCurrency)}`);
        if (isJpy) {
          lines.push(`出来高(税): ¥${Number(jpyVol).toLocaleString('ja-JP')}`);
        }
        lines.push(`Bid: ${formatPrice(buy, isJpy)} / Ask: ${formatPrice(sell, isJpy)}（スプレッド: ${formatPrice(spread, isJpy)}）`);
        lines.push(`時刻: ${dayjs.unix(d.timestamp / 1000).format('YYYY-MM-DD HH:mm:ss')}`);
        lines.push('---');
        lines.push(`チャート・取引: https://app.bitbank.cc/trade/${chk.pair}`);

        const normalized: NormalizedTicker = {
          pair: chk.pair,
          last,
          buy,
          sell,
          open,
          high,
          low,
          volume: vol,
          timestamp: d.timestamp,
          isoTime: toIsoTime(d.timestamp),
          change24hPct: changePct ? Number(changePct.toFixed(2)) : null,
          vol24hJpy: isJpy ? Number(jpyVol) : null,
        };

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
          structuredContent: { raw: json, normalized },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'ネットワークエラー';
        return { content: [{ type: 'text', text: `エラー: ${msg}` }] };
      }
    },
  );
}

// ============================================================
// get_tickers_jpy - JPYペアのみ取得（厳格フィルタ付き）
// ============================================================
let tickersJpyCache: { ts: number; data: NormalizedTicker[] } | null = null;
const TICKERS_JPY_CACHE_TTL = 10000;

function buildTickersJpyText(items: NormalizedTicker[], cached: boolean): string {
  const lines: string[] = [];
  lines.push(`--- DATA BEGIN: get_tickers_jpy (${items.length}件${cached ? ', cached' : ''}) ---`);
  lines.push('pair | last | high | low | vol | chg24h');
  for (const item of items) {
    const base = item.pair.split('_')[0]?.toUpperCase() ?? '';
    lines.push(
      `${formatPair(item.pair)} | ${formatPrice(item.last, true)} | ${formatPrice(item.high, true)} | ${formatPrice(item.low, true)} | ${formatVolume(item.volume, base)} | ${formatChange(item.change24hPct ?? null)}`,
    );
  }
  lines.push(`--- DATA END (${items.length}/${items.length}件 全件表示) ---`);
  lines.push('');
  lines.push('含まれるデータ: 全JPYペアの last/high/low/vol/change24h');
  lines.push('含まれないデータ: bid/ask スプレッド、板深度、約定履歴');
  lines.push('💡 個別ペア詳細 → get_ticker(pair), 板情報 → get_depth(pair), 約定 → get_transactions(pair)');
  return lines.join('\n');
}

function registerGetTickersJpy(server: McpServer) {
  server.tool('get_tickers_jpy', '全JPYペアのティッカーを取得（/tickers_jpy）。24h変動率付き。キャッシュ10秒。', {}, async () => {
    const now = Date.now();

    // キャッシュチェック
    if (tickersJpyCache && now - tickersJpyCache.ts < TICKERS_JPY_CACHE_TTL) {
      const cacheLines = buildTickersJpyText(tickersJpyCache.data, true);
      return {
        content: [{ type: 'text', text: cacheLines }],
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

      return {
        content: [{ type: 'text', text: buildTickersJpyText(items, false) }],
        structuredContent: { items, meta: { count: items.length, fetchedAt: new Date().toISOString() } },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ネットワークエラー';
      return { content: [{ type: 'text', text: `エラー: ${msg}` }] };
    }
  });
}

// ============================================================
// get_candles - ローソク足データを取得
// ============================================================
const CANDLE_TYPES = ['1min', '5min', '15min', '30min', '1hour', '4hour', '8hour', '12hour', '1day', '1week', '1month'] as const;
const YEARLY_TYPES = new Set(['4hour', '8hour', '12hour', '1day', '1week', '1month']);

function registerGetCandles(server: McpServer) {
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
        const now = new Date();
        if (isYearly) {
          dateParam = String(now.getFullYear());
        } else {
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const d = String(now.getDate()).padStart(2, '0');
          dateParam = `${now.getFullYear()}${m}${d}`;
        }
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
        const baseCurrency = chk.pair.split('_')[0]?.toUpperCase() ?? '';

        // 全件展開
        const lines: string[] = [];
        lines.push(`--- DATA BEGIN: get_candles ${formatPair(chk.pair)} [${type}] ${normalized.length}本 ---`);
        lines.push(`期間: ${oldest.isoTime?.split('T')[0] ?? 'N/A'} 〜 ${latest.isoTime?.split('T')[0] ?? 'N/A'}`);
        lines.push('⚠️ 配列は古い順: data[0]=最古、data[最後]=最新');
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
        lines.push(`--- DATA END (${normalized.length}/${normalized.length}本 全件表示) ---`);
        lines.push('');
        lines.push('含まれるデータ: 全OHLCV + 各足の変動率 + 出来高トレンド');
        lines.push('含まれないデータ: 板情報、約定履歴、他のタイムフレーム');
        lines.push('💡 板情報 → get_depth(pair), 約定 → get_transactions(pair), 現在値 → get_ticker(pair)');

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

// ============================================================
// get_depth - 板情報（生データ）を取得
// ============================================================
function registerGetDepth(server: McpServer) {
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
        const baseCurrency = chk.pair.split('_')[0]?.toUpperCase() ?? '';

        // 全件展開
        const lines: string[] = [];
        lines.push(`--- DATA BEGIN: get_depth ${formatPair(chk.pair)} ---`);
        lines.push(`中値: ${mid ? formatPrice(mid, isJpy) : 'N/A'} | 時刻: ${toIsoTime(d.timestamp) ?? 'N/A'}`);
        lines.push('');
        lines.push(`[ASKS 売り板 ${asks.length}層] (価格昇順: 最良気配が先頭)`);
        lines.push('price | amount');
        for (const [p, s] of asks) {
          lines.push(`${formatPrice(p, isJpy)} | ${formatVolume(s, baseCurrency)}`);
        }
        lines.push('');
        lines.push(`[BIDS 買い板 ${bids.length}層] (価格降順: 最良気配が先頭)`);
        lines.push('price | amount');
        for (const [p, s] of bids) {
          lines.push(`${formatPrice(p, isJpy)} | ${formatVolume(s, baseCurrency)}`);
        }
        lines.push(`--- DATA END (asks ${asks.length}層 + bids ${bids.length}層 全件表示) ---`);
        lines.push('');
        lines.push('含まれるデータ: 全 bid/ask レベルの価格・数量');
        lines.push('含まれないデータ: 約定履歴、ローソク足、ティッカー');
        lines.push('💡 約定 → get_transactions(pair), チャート → get_candles(pair), 現在値 → get_ticker(pair)');

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

// ============================================================
// get_transactions - 取引履歴を取得
// ============================================================
function registerGetTransactions(server: McpServer) {
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

        // 全件展開
        const lines: string[] = [];
        lines.push(`--- DATA BEGIN: get_transactions ${formatPair(chk.pair)} ${normalized.length}件 ---`);
        if (normalized.length > 0) {
          const dominant = buyRatio >= 60 ? '買い優勢' : buyRatio <= 40 ? '売り優勢' : '拮抗';
          const volStr = totalVolume >= 1 ? totalVolume.toFixed(4) : totalVolume.toFixed(6);
          lines.push(`集計: 買い ${buys}件 / 売り ${sells}件（${dominant}） | 出来高: ${volStr} ${baseCurrency}`);
          lines.push('');
          lines.push('datetime | side | price | amount');
          for (const t of normalized) {
            lines.push(`${t.isoTime ?? 'N/A'} | ${t.side} | ${formatPrice(t.price, isJpy)} | ${t.amount} ${baseCurrency}`);
          }
        }
        lines.push(`--- DATA END (${normalized.length}/${normalized.length}件 全件表示) ---`);
        lines.push('');
        lines.push('含まれるデータ: 全約定の時刻・方向・価格・数量');
        lines.push('含まれないデータ: 板情報、ローソク足、ティッカー');
        lines.push('💡 板情報 → get_depth(pair), チャート → get_candles(pair), 現在値 → get_ticker(pair)');

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

// ============================================================
// ツール登録
// ============================================================
registerGetTicker(server);
registerGetTickersJpy(server);
registerGetCandles(server);
registerGetDepth(server);
registerGetTransactions(server);

// ============================================================
// サーバー起動
// ============================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bitbank MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
