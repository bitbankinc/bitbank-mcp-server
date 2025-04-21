import { TickerResponse } from './types.js';

// bitban public api base url
const BITBANK_API_BASE_URL = 'https://public.bitbank.cc/';

export async function getTickerResponse(pair: string): Promise<TickerResponse> {
  const ticker = await fetch(`${BITBANK_API_BASE_URL}${pair}/ticker`);
  const tickerJson = await ticker.json();

  return tickerJson;
}
