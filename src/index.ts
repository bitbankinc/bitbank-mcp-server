import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { pairRegex } from './config/pair.js';
import { formatTicker } from './utils.ts/format-ticker.js';
import { getTickerResponse } from './utils.ts/get-ticker.js';

// Create server instance
const server = new McpServer({
  name: 'bitbank',
  version: '0.0.0',
});

// Register bitbank tools
server.tool(
  'get-ticker',
  'Get ticker data for a trading pair',
  {
    pair: z.string().regex(pairRegex).describe('Trading pair to get ticker data for. eg. btc_jpy, eth_jpy').endsWith('_jpy'),
  },
  async ({ pair }) => {
    const rawTicker = await getTickerResponse(pair);

    if (!rawTicker || rawTicker.success !== 1) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve ticker data',
          },
        ],
      };
    }

    const formattedTicker = formatTicker(rawTicker, pair);

    return {
      content: [
        {
          type: 'text',
          text: formattedTicker,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bitbank MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
