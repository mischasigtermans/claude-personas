import { readConfig } from '../state/config.js';
import { resolvePersona } from '../state/persona.js';
import { requireString, type ToolDef } from './types.js';

export const personasResolve: ToolDef = {
  name: 'resolve',
  description:
    'Resolve a name or alias to a canonical persona. Returns canonical name, source path, enabled status, aliases, and description. On collision, returns ambiguous: true with candidates.',
  inputSchema: {
    type: 'object',
    properties: { ref: { type: 'string', description: 'Persona name or alias' } },
    required: ['ref'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'ref');
    const config = await readConfig();
    const enabled = new Set(config.enabled);
    const result = await resolvePersona(ref);
    if (!result) {
      return JSON.stringify({ found: false, ref });
    }
    if ('ambiguous' in result) {
      return JSON.stringify({
        ambiguous: true,
        candidates: result.candidates.map((p) => ({
          name: p.name,
          aliases: p.aliases,
          source: p.source,
          enabled: enabled.has(p.name),
        })),
      });
    }
    const p = result.match;
    return JSON.stringify({
      found: true,
      name: p.name,
      aliases: p.aliases,
      enabled: enabled.has(p.name),
      description: p.description ?? '',
      source: p.source,
      path: p.path,
    });
  },
};
