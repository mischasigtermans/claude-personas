import { homedir } from 'node:os';
import { join } from 'node:path';

function personasDataDir(): string {
  return process.env.PERSONAS_DIR ?? join(homedir(), '.claude', 'personas');
}

/**
 * Parley's state root. Mirrors parley's own path-resolution logic so both
 * plugins agree on where state lives. Don't import parley source; replicate
 * the one-liner here. The extensions manifest contract is purely FS-level.
 */
function parleyDir(): string {
  return process.env.PARLEY_DIR ?? join(homedir(), '.claude', 'parley');
}

function pluginRoot(): string {
  const root = process.env.PERSONAS_PLUGIN_ROOT;
  if (!root) {
    throw new Error('PERSONAS_PLUGIN_ROOT is not set; the MCP server must be launched from the plugin');
  }
  return root;
}

export const paths = {
  get dataRoot() {
    return personasDataDir();
  },
  get pluginRoot() {
    return pluginRoot();
  },
  get externalDir() {
    return join(personasDataDir(), 'external');
  },
  externalPersonaDir: (name: string) => join(personasDataDir(), 'external', name),
  /**
   * Parley extensions manifest owned by personas. Personas writes the list of
   * enabled personas here; parley scans `<parleyDir>/extensions/*.json` and
   * merges these entries into its peer registry. FS-level contract only.
   */
  get parleyExtensionManifest() {
    return join(parleyDir(), 'extensions', 'personas.json');
  },
  get parleyExtensionsDir() {
    return join(parleyDir(), 'extensions');
  },
} as const;
