import { listPersonas } from '../state/persona.js';
import { readManifest } from '../state/manifest.js';
import type { ToolDef } from './types.js';

export const personasList: ToolDef = {
  name: 'list',
  description:
    "List installed personas with their enabled state. Enabled personas are those written into the parley extensions manifest (~/.claude/parley/extensions/personas.json). All other personas are installed but not yet enabled.",
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  handler: async () => {
    const installed = await listPersonas();
    const manifest = await readManifest();
    const enabledPaths = new Set(manifest.peers.map((p) => p.path));

    const out = installed.map((p) => ({
      name: p.name,
      aliases: p.aliases,
      description: p.description ?? '',
      source: p.source,
      path: p.path,
      enabled: enabledPaths.has(p.path),
    }));
    return JSON.stringify(out, null, 2);
  },
};
