# bitbank MCP Server

This project is a Model Context Protocol (MCP) server for [bitbank](https://bitbank.cc/).

## Tools

### get_ticker

単一ペアのティッカーを取得（/ticker）。価格・出来高・24h高安。

- input:
  - `pair` (string): Trading pair (e.g., btc_jpy, eth_jpy)

### get_tickers_jpy

全JPYペアのティッカーを取得（/tickers_jpy）。24h変動率付き。キャッシュ10秒。

- input: なし

### get_candles

ローソク足を取得（/candlestick）。OHLCVデータ。

- input:
  - `pair` (string): Trading pair (e.g., btc_jpy)
  - `type` (string): Candle type (1min, 5min, 15min, 30min, 1hour, 4hour, 8hour, 12hour, 1day, 1week, 1month)
  - `date` (string, optional): Date in YYYYMMDD (for minute/hour) or YYYY (for day/week/month)
  - `limit` (number): Number of candles to return (default: 200, max: 1000)

### get_depth

板の生データ取得（/depth API直接）。差分計算・壁検出・圧力分析の元データ。

- input:
  - `pair` (string): Trading pair (e.g., btc_jpy)
  - `maxLevels` (number): Maximum number of price levels (default: 200, max: 500)

### get_transactions

約定履歴を取得（/transactions）。直近の約定データ。日付指定可。買い/売り比率を算出。

- input:
  - `pair` (string): Trading pair (e.g., btc_jpy)
  - `limit` (number): Number of transactions to return (default: 100, max: 1000)
  - `date` (string, optional): Date in YYYYMMDD format

## Usage

### npx

- Install [Node.js](https://nodejs.org/en/download/)
- Install [Claude desktop](https://claude.ai/download) or other MCP client
- Configure the MCP server in Claude Desktop following the [MCP quickstart guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers)

```json
{
  "mcpServers": {
    "bitbank": {
      "command": "npx",
      "args": [
        "-y",
        "bitbank-mcp-server"
      ]
    }
  }
}
```

If npx cannot be executed, running `which npx` and specifying the command directly may resolve the issue.

- Example: macOS with Volta

```json
{
  "mcpServers": {
    "bitbank": {
      "command": "/Users/xxxx/.volta/bin/npx",
      "args": [
        "-y",
        "bitbank-mcp-server"
      ]
    }
  }
}
```

### Docker

- Install [Docker](https://www.docker.com/get-started) for your OS.
- Install [Claude desktop](https://claude.ai/download) or other MCP client
- Configure the MCP server in Claude Desktop following the [MCP quickstart guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers)

```json
{
  "mcpServers": {
    "bitbank": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "bitbankinc/bitbank-mcp-server"]
    }
  }
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
