import { rm } from 'node:fs/promises';
import { paths } from '../state/paths.js';
import { setEnabled } from '../state/config.js';
import { getPersona } from '../state/persona.js';
import { requireString, type ToolDef } from './types.js';

export const personasRemove: ToolDef = {
  name: 'remove',
  description: 'Uninstall an external persona. Refuses bundled personas. Per-project state is preserved.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const name = requireString(args, 'name');
    const meta = await getPersona(name);
    if (!meta) throw new Error(`No persona named "${name}"`);
    if (meta.source === 'bundled') {
      throw new Error(`"${name}" is bundled and cannot be removed.`);
    }
    await setEnabled(meta.name, false);
    await rm(paths.externalPersonaDir(meta.name), { recursive: true, force: true });
    return `Removed external persona: ${meta.name}. State under ~/.claude/personas/state/ preserved.`;
  },
};
