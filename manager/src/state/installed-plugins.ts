import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface InstalledPlugin {
  installPath: string;
}

export interface InstalledPluginsFile {
  plugins: Record<string, InstalledPlugin[]>;
}

let cache: InstalledPluginsFile | null = null;

/**
 * Read and parse ~/.claude/plugins/installed_plugins.json once per process.
 * Claude Code plugin installs require a CC restart, which restarts this MCP
 * server too, so the cache is always fresh for the server's lifetime. No
 * invalidation needed.
 */
export async function loadInstalledPlugins(): Promise<InstalledPluginsFile> {
  if (cache) return cache;
  try {
    const configDir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude');
    const raw = await readFile(join(configDir, 'plugins', 'installed_plugins.json'), 'utf8');
    const parsed = JSON.parse(raw) as InstalledPluginsFile;
    cache = { plugins: parsed.plugins ?? {} };
  } catch {
    cache = { plugins: {} };
  }
  return cache;
}
