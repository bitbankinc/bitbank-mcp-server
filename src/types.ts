/**
 * interface of ticker response form bitbank public api.
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
