# @qbistlab/mcp-server

MCP server wrapping the [QBist Lab](https://qbistlab.com) catalog of Sterling Geisel-bylined Pudding Theory working papers.

Each paper applies one or more of the eight Pudding Theory postulates to a public arXiv source paper and outputs a falsifiable observable. **Both human and agent buyers welcome.** Single-use license per paper.

## Install

```bash
npm install -g @qbistlab/mcp-server
```

## Tools

| Tool | Description |
|------|-------------|
| `list_papers` | Paginated catalog listing. Args: `limit` (default 50), `offset` (default 0). |
| `search_by_postulate` | Filter by Pudding Theory postulate (Signal Dominance, Material Memory, Vacuum Receptivity, Chaos Susceptibility, Observer As Field, Intent As Negentropy, Temporal Softening, Proximity Gradient). |
| `search_by_keyword` | Case-insensitive keyword search against titles. |
| `buy_paper` | Return UTM-tagged Stripe checkout URL for a paper by slug `id`. |

## Configure in Claude Desktop / Claude Code

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "qbistlab": {
      "command": "npx",
      "args": ["-y", "@qbistlab/mcp-server"]
    }
  }
}
```

## Catalog Source

The server fetches `https://qbistlab.com/working-papers/api/listings.json` (5-min in-memory cache). The same JSON feed is also exposed at `https://qbistlab.com/.well-known/ucp.json` for non-MCP agent buyers.

## Pricing

Working papers are tiered at $2.99, $5.99, or $9.99 USD. Stripe handles checkout. Each paper is a one-time purchase, single-use license.

## Foundational Reading

Pudding Theory: <https://qbistlab.com/Pudding_Theory_01-2026.pdf>

## License

MIT (the server itself). Each working paper carries its own single-use license — see `https://qbistlab.com/working-papers/license`.
