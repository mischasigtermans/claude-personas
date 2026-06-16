import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools/index.js';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function main() {
  const server = new Server(
    { name: 'personas', version: '0.3.0' },
    { capabilities: { tools: {} } },
  );

  const byName = new Map(tools.map((t) => [t.name, t] as const));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = byName.get(request.params.name);
    if (!tool) {
      throw new Error(`personas: unknown tool "${request.params.name}"`);
    }
    try {
      const text = await tool.handler(request.params.arguments ?? {});
      return { content: [{ type: 'text', text }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: errorMessage(err) }],
      };
    }
  });

  const shutdown = () => process.exit(0);
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const stack = err instanceof Error ? err.stack : undefined;
  process.stderr.write(`personas server crashed: ${stack ?? errorMessage(err)}\n`);
  process.exit(1);
});
