#!/usr/bin/env node
/**
 * @qbistlab/mcp-server — MCP server wrapping the QBist Lab catalog.
 *
 * Tools:
 *   list_papers           — return the full catalog (paginated)
 *   search_by_postulate   — filter papers by Pudding Theory postulate
 *   search_by_keyword     — case-insensitive keyword match against title/abstract
 *   buy_paper             — return the (UTM-tagged) Stripe checkout URL for a paper
 *
 * Catalog source: https://qbistlab.com/working-papers/api/listings.json
 *   (cached 5 min in-memory)
 *
 * Both human and agent buyers welcome. License: single-use per paper.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const CATALOG_URL = 'https://qbistlab.com/working-papers/api/listings.json';
const CACHE_TTL_MS = 5 * 60 * 1000;

let _cache = { papers: null, fetchedAt: 0 };

const POSTULATES = [
  'Signal Dominance',
  'Material Memory',
  'Vacuum Receptivity',
  'Chaos Susceptibility',
  'Observer As Field',
  'Intent As Negentropy',
  'Temporal Softening',
  'Proximity Gradient',
];

async function fetchCatalog() {
  const now = Date.now();
  if (_cache.papers && now - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache.papers;
  }
  const res = await fetch(CATALOG_URL, {
    headers: { 'Accept': 'application/json', 'User-Agent': '@qbistlab/mcp-server/0.1.0' },
  });
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const papers = Array.isArray(data) ? data : (data.papers || []);
  _cache = { papers, fetchedAt: now };
  return papers;
}

function paperSummary(p) {
  return {
    id: p.id,
    title: p.title,
    arxiv_source: p.arxiv_source,
    postulates: p.postulates || [],
    price_usd: p.price_usd,
    currency: p.currency || 'usd',
    preview_url: p.preview_url,
    buy_url: p.buy_url,
    byline: p.byline,
    license: p.license || 'single-use',
  };
}

const server = new Server(
  {
    name: '@qbistlab/mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_papers',
      description:
        'List Sterling Geisel-bylined working papers from the QBist Lab catalog. ' +
        'Each paper applies one or more of the eight Pudding Theory postulates to a public arXiv source paper. ' +
        'Returns paginated results.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: 'Max results (default 50)', minimum: 1, maximum: 200 },
          offset: { type: 'integer', description: 'Skip N results (default 0)', minimum: 0 },
        },
      },
    },
    {
      name: 'search_by_postulate',
      description:
        'Filter the catalog by one of the eight Pudding Theory postulates: ' +
        POSTULATES.join(', ') + '.',
      inputSchema: {
        type: 'object',
        required: ['postulate'],
        properties: {
          postulate: {
            type: 'string',
            description: 'Postulate name (case-insensitive). One of: ' + POSTULATES.join(', '),
          },
        },
      },
    },
    {
      name: 'search_by_keyword',
      description:
        'Case-insensitive keyword search against paper titles. Returns matching papers with full metadata.',
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Keyword or phrase to match in title.' },
          limit: { type: 'integer', description: 'Max results (default 25)', minimum: 1, maximum: 100 },
        },
      },
    },
    {
      name: 'buy_paper',
      description:
        'Return the Stripe checkout URL for a paper by id (slug). The URL is UTM-tagged ' +
        'so the QBist Lab analytics dashboard can attribute the purchase to MCP / agent traffic. ' +
        'Both human and agent buyers welcome. Single-use license.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Paper slug (the `id` field from list_papers).' },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const papers = await fetchCatalog();

  switch (name) {
    case 'list_papers': {
      const limit = Math.min(Math.max(args?.limit ?? 50, 1), 200);
      const offset = Math.max(args?.offset ?? 0, 0);
      const slice = papers.slice(offset, offset + limit).map(paperSummary);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: slice.length,
                offset,
                total: papers.length,
                papers: slice,
              },
              null,
              2
            ),
          },
        ],
      };
    }
    case 'search_by_postulate': {
      const target = String(args?.postulate || '').trim().toLowerCase();
      if (!target) {
        return {
          content: [{ type: 'text', text: 'Error: postulate is required' }],
          isError: true,
        };
      }
      const matches = papers
        .filter((p) =>
          (p.postulates || []).some((x) => String(x).toLowerCase() === target)
        )
        .map(paperSummary);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: matches.length, postulate: target, papers: matches }, null, 2),
          },
        ],
      };
    }
    case 'search_by_keyword': {
      const q = String(args?.query || '').trim().toLowerCase();
      if (!q) {
        return {
          content: [{ type: 'text', text: 'Error: query is required' }],
          isError: true,
        };
      }
      const limit = Math.min(Math.max(args?.limit ?? 25, 1), 100);
      const matches = papers
        .filter((p) => String(p.title || '').toLowerCase().includes(q))
        .slice(0, limit)
        .map(paperSummary);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: matches.length, query: q, papers: matches }, null, 2),
          },
        ],
      };
    }
    case 'buy_paper': {
      const id = String(args?.id || '').trim();
      if (!id) {
        return {
          content: [{ type: 'text', text: 'Error: id is required' }],
          isError: true,
        };
      }
      const paper = papers.find((p) => p.id === id);
      if (!paper) {
        return {
          content: [{ type: 'text', text: `Error: no paper with id="${id}"` }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: paper.id,
                title: paper.title,
                price_usd: paper.price_usd,
                currency: paper.currency || 'usd',
                checkout_url: paper.buy_url,
                license: paper.license || 'single-use',
                byline: paper.byline,
                preview_url: paper.preview_url,
                note: 'Open the checkout_url to complete payment. UTM params attribute the sale to MCP traffic.',
              },
              null,
              2
            ),
          },
        ],
      };
    }
    default:
      return {
        content: [{ type: 'text', text: `Error: unknown tool "${name}"` }],
        isError: true,
      };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
