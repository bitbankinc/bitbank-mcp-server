# bitbank MCP Server

This project is a Model Context Protocol (MCP) server for [bitbank](https://bitbank.cc/).

## Usage

- Clone the repository in your local machine
- Run  `npm run build` to build the project
- Install [claude desktop](https://claude.ai/download)
- Set MCP server to claude desktop
  - https://modelcontextprotocol.io/quickstart/user

<!-- Add image -->
![Install](/assets/install.png)


- Set the MCP server to `bitbank` in the claude desktop

### npx

TBD

```json
{
  "mcpServers": {
    "bitbank": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-bitbank"
      ]
    }
  }
}
```

### Docker

TBD

```json
{
  "mcpServers": {
    "bitbank": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp-server-bitbank"]
    }
  }
}
```

### In local machine

``` json
{
    "mcpServers": {
        "bitbank": {
            "command": "node",
            "args": [
                "/Users/<your_workspace_dir>/mcp-server-bitbank/build/index.js"
            ]
        }
    }
}

```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
