import { rm } from 'node:fs/promises';
import { paths } from '../state/paths.js';
import { removePersona } from '../state/manifest.js';
import { getPersona } from '../state/persona.js';
import { loadInstalledPlugins } from '../state/installed-plugins.js';
import { requireString, type ToolDef } from './types.js';

export const personasRemove: ToolDef = {
  name: 'remove',
  description:
    "Uninstall an external persona (cloned via `personas add <git-url>`). Disables it first (removes from parley extensions manifest), then deletes its directory. Refuses plugin-installed personas, which are managed by Claude Code's plugin system. Per-project state under ~/.claude/personas/state/ is preserved.",
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
      const pluginKey = await findPluginKey(meta.pluginRoot ?? meta.path);
      const hint = pluginKey
        ? `Uninstall via \`/plugin uninstall ${pluginKey}\` instead.`
        : `Uninstall it via Claude Code's \`/plugin\` system instead.`;
      throw new Error(`"${name}" is a Claude Code plugin. ${hint}`);
    }
    await removePersona(meta.name, meta.path);
    await rm(paths.externalPersonaDir(meta.name), { recursive: true, force: true });
    return `Removed external persona: ${meta.name}. State under ~/.claude/personas/state/ preserved.`;
  },
};

/** Reverse-map a plugin's install path to its `name@marketplace` key. */
async function findPluginKey(installPath: string): Promise<string | null> {
  const { plugins } = await loadInstalledPlugins();
  for (const [key, entries] of Object.entries(plugins)) {
    if (entries.some((e) => e.installPath === installPath)) return key;
  }
  return null;
}
