import { setEnabled } from '../state/config.js';
import { resolvePersona } from '../state/persona.js';
import { requireString, type ToolDef } from './types.js';

export const personasEnable: ToolDef = {
  name: 'enable',
  description: 'Enable a persona by canonical name or alias.',
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
    await setEnabled(p.name, true);
    const aliases = p.aliases.length > 0 ? ` (${p.aliases.join(', ')})` : '';
    return `Enabled: ${p.name}${aliases}`;
  },
};

export const personasDisable: ToolDef = {
  name: 'disable',
  description: 'Disable a persona by canonical name or alias. Open threads are preserved.',
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
    await setEnabled(result.match.name, false);
    return `Disabled: ${result.match.name}`;
  },
};
