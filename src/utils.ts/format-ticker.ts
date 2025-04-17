import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import { TickerResponse } from '../types.js';

/**
 * Function to create format ticker response.
 * @param ticker
 * @param pair
 * @returns string
 */
export function formatTicker(ticker: TickerResponse, pair: string): string {
  const { data } = ticker;
  const { timestamp } = data;
  const human_readable_timestamp = dayjs.unix(timestamp / 1000).format();

  return [
    `Pair: ${pair || 'Unknown'}`,
    `Sell: ${data.sell || 'Unknown'}`,
    `Buy: ${data.buy || 'Unknown'}`,
    `Open: ${data.open || 'Unknown'}`,
    `High: ${data.high || 'Unknown'}`,
    `Low: ${data.low || 'Unknown'}`,
    `Last: ${data.last || 'Unknown'}`,
    `Vol: ${data.vol || 'Unknown'}`,
    `Jpy Vol: ${calculateJpyVol(data.vol, data.last) || 'Unknown'}`,
    `Time: ${human_readable_timestamp || 'Unknown'}`,
    `Time(unix_time): ${timestamp || 'Unknown'}`,
    `See chart or trade URL: https://app.bitbank.cc/trade/${pair}`,
    '---',
  ].join('\n');
}

/**
 * Function to calculate jpy_vol from vol and last.
 * 小数点以下を四捨五入しています
 */
export function calculateJpyVol(vol: string, last: string): string {
  return BigNumber(vol).multipliedBy(BigNumber(last)).toFixed(0);
}
