/**
 * interface of ticker response from bitbank public api.
 */
export interface TickerResponse {
  success: number;
  data: {
    sell: string;
    buy: string;
    high: string;
    low: string;
    open: string;
    last: string;
    vol: string;
    timestamp: number;
  };
}

/**
 * /tickers_jpy APIレスポンス
 */
export interface TickersJpyResponse {
  success: number;
  data: Array<{
    pair: string;
    sell: string;
    buy: string;
    high: string;
    low: string;
    open: string;
    last: string;
    vol: string;
    timestamp: number;
  }>;
}

/**
 * /candlestick APIレスポンス
 */
export interface CandlestickResponse {
  success: number;
  data: {
    candlestick: Array<{
      type: string;
      ohlcv: Array<[string, string, string, string, string, number]>; // [open, high, low, close, volume, timestamp]
    }>;
  };
}

/**
 * /depth APIレスポンス
 */
export interface DepthResponse {
  success: number;
  data: {
    asks: Array<[string, string]>; // [price, amount]
    bids: Array<[string, string]>;
    timestamp: number;
    sequenceId: string;
  };
}

/**
 * /transactions APIレスポンス
 */
export interface TransactionsResponse {
  success: number;
  data: {
    transactions: Array<{
      transaction_id: number;
      side: 'buy' | 'sell';
      price: string;
      amount: string;
      executed_at: number;
    }>;
  };
}

/**
 * 正規化されたティッカーデータ
 */
export interface NormalizedTicker {
  pair: string;
  last: number | null;
  buy: number | null;
  sell: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  timestamp: number | null;
  isoTime: string | null;
  change24hPct?: number | null;
  vol24hJpy?: number | null;
}

/**
 * 正規化されたローソク足データ
 */
export interface NormalizedCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  isoTime: string | null;
}

/**
 * 正規化された取引データ
 */
export interface NormalizedTransaction {
  transactionId: number;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  executedAt: number;
  isoTime: string | null;
}
