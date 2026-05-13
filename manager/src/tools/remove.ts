import { rm } from 'node:fs/promises';
import { paths } from '../state/paths.js';
import { setEnabled } from '../state/config.js';
import { getPersona } from '../state/persona.js';
import { requireString, type ToolDef } from './types.js';

export const personasRemove: ToolDef = {
  name: 'remove',
  description: "Uninstall an external persona (cloned via `personas add <git-url>`). Refuses plugin-installed personas, which are managed by Claude Code's plugin system. Per-project state is preserved.",
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
    if (meta.source === 'plugin') {
      throw new Error(
        `"${name}" is a Claude Code plugin. Uninstall via \`/plugin uninstall ${name}-says@<marketplace>\` instead.`,
      );
    }
    await setEnabled(meta.name, false);
    await rm(paths.externalPersonaDir(meta.name), { recursive: true, force: true });
    return `Removed external persona: ${meta.name}. State under ~/.claude/personas/state/ preserved.`;
  },
};
