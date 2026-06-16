import { resolvePersona } from '../state/persona.js';
import { upsertPersona, removePersona } from '../state/manifest.js';
import { requireString, type ToolDef } from './types.js';

export const personasEnable: ToolDef = {
  name: 'enable',
  description:
    'Enable a persona by canonical name or alias. Writes the persona (and all its aliases) into the parley extensions manifest at ~/.claude/parley/extensions/personas.json so parley_ask routes to it without a manual parley_add.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'name');
    const result = await resolvePersona(ref);
    if (!result) throw new Error(`No persona found matching "${ref}"`);
    if ('ambiguous' in result) {
      throw new Error(
        `"${ref}" is ambiguous: ${result.candidates.map((c) => c.name).join(', ')}. Use the full canonical name.`,
      );
    }
    const p = result.match;

    await upsertPersona(p);

    const aliases = p.aliases.length > 0 ? ` (aliases: ${p.aliases.join(', ')})` : '';
    return `Enabled: ${p.name}${aliases}. Reachable from any project via parley_ask.`;
  },
};

export const personasDisable: ToolDef = {
  name: 'disable',
  description:
    'Disable a persona by canonical name or alias. Removes its entries from the parley extensions manifest. Open threads on disk are preserved.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'name');
    const result = await resolvePersona(ref);
    if (!result) throw new Error(`No persona found matching "${ref}"`);
    if ('ambiguous' in result) {
      throw new Error(`"${ref}" is ambiguous: ${result.candidates.map((c) => c.name).join(', ')}`);
    }

    await removePersona(result.match.name, result.match.path);

    return `Disabled: ${result.match.name}`;
  },
};
