# bitbank MCP Server

This project is a Model Context Protocol (MCP) server for [bitbank](https://bitbank.cc/).

## Tools

- get_ticker
  - Get ticker data for a trading pair
  - input:
    - `pair` (string): Trading pair to get ticker data for. eg. btc_jpy, eth_jpy

## Usage

### WIP: npx

- Install [Node.js](https://nodejs.org/en/download/) (v18 or later)
- Install [Claude desktop](https://claude.ai/download) or other MCP client
- Set MCP server to Claude desktop
  - https://modelcontextprotocol.io/quickstart/user

![Install](/assets/install.png)

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

### WIP: Docker

- Install [Docker](https://www.docker.com/get-started) for your OS.
- Install [Claude desktop](https://claude.ai/download) or other MCP client
- Set MCP server to Claude desktop
  - https://modelcontextprotocol.io/quickstart/user

```json
{
  "mcpServers": {
    "bitbank": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "bitbank-mcp-server"]
    }
  }
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
