import { readConfig } from '../state/config.js';
import { listPersonas } from '../state/persona.js';
import type { ToolDef } from './types.js';

export const personasList: ToolDef = {
  name: 'list',
  description:
    'List all known personas (bundled + external) with their enabled status, aliases, description, and source path.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  handler: async () => {
    const config = await readConfig();
    const enabled = new Set(config.enabled);
    const personas = await listPersonas();
    const out = personas.map((p) => ({
      name: p.name,
      aliases: p.aliases,
      enabled: enabled.has(p.name),
      description: p.description ?? '',
      source: p.source,
      path: p.path,
    }));
    return JSON.stringify(out, null, 2);
  },
};
