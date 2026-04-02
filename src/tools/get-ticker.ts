import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import { z } from 'zod';
import { BITBANK_API_BASE, fetchJson } from '../client.js';
import { ensurePair, pairRegex } from '../config/pair.js';
import { NormalizedTicker, TickerResponse } from '../types.js';
import { toIsoTime } from '../utils/datetime.js';
import { formatChange, formatPair, formatPrice, formatVolume } from '../utils/format.js';

export function registerGetTicker(server: McpServer) {
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
          lines.push(`出来高(JPY): ¥${Number(jpyVol).toLocaleString('ja-JP')}`);
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
