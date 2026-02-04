#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetCandles } from './tools/get-candles.js';
import { registerGetDepth } from './tools/get-depth.js';
import { registerGetTicker } from './tools/get-ticker.js';
import { registerGetTickersJpy } from './tools/get-tickers-jpy.js';
import { registerGetTransactions } from './tools/get-transactions.js';

const server = new McpServer({
  name: 'bitbank',
  version: '0.2.0',
});

registerGetTicker(server);
registerGetTickersJpy(server);
registerGetCandles(server);
registerGetDepth(server);
registerGetTransactions(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bitbank MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
