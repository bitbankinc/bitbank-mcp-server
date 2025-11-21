# bitbank MCP Server

This project is a Model Context Protocol (MCP) server for [bitbank](https://bitbank.cc/).

## Tools

- get_ticker
  - Get ticker data for a trading pair
  - input:
    - `pair` (string): Trading pair to get ticker data for. eg. btc_jpy, eth_jpy

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
