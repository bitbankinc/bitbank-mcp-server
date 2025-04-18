# bitbank MCP Server

This project is a Model Context Protocol (MCP) server for [bitbank](https://bitbank.cc/).

## Usage

### Local Setup

- Install [Node.js](https://nodejs.org/en/download/) (v18 or later)
- Clone the repository in your local machine
- Run  `npm run build` to build the project
- Install [claude desktop](https://claude.ai/download) or other MCP client
- Set MCP server to claude desktop
  - https://modelcontextprotocol.io/quickstart/user

<!-- Add image -->
![Install](/assets/install.png)


- Set the MCP server to `bitbank` in the claude desktop
  - https://modelcontextprotocol.io/quickstart/user

``` json
{
    "mcpServers": {
        "bitbank": {
            "command": "node",
            "args": [
                "/Users/<your_workspace_dir>/bitbank-mcp-server/build/index.js"
            ]
        }
    }
}

```

### WIP: npx

TBD

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

TBD

- Install [Docker](https://www.docker.com/get-started) for your OS.

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
