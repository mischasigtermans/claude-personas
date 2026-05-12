import { readFile, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { paths } from './paths.js';

export interface PersonaMeta {
  name: string;
  displayName?: string;
  aliases: string[];
  model?: string;
  description?: string;
  tools?: string[];
  traits?: string[];
  mcpServers?: Record<string, unknown>;
  source: 'external' | 'plugin';
  path: string;
  pluginRoot?: string;
}

export async function listPersonas(): Promise<PersonaMeta[]> {
  const external: PersonaMeta[] = [];
  const plugins: PersonaMeta[] = [];

  for (const dir of await safeReaddir(paths.externalDir)) {
    const meta = await readPersonaDir(join(paths.externalDir, dir));
    if (meta) external.push(meta);
  }
  for (const p of await loadPluginPersonas()) {
    plugins.push(p);
  }

  // Ascending priority: external < plugin. Last write wins.
  const map = new Map<string, PersonaMeta>();
  for (const p of external) registerWithAliases(map, p);
  for (const p of plugins) registerWithAliases(map, p);
  return uniqueByName([...map.values()]);
}

function registerWithAliases(m: Map<string, PersonaMeta>, p: PersonaMeta): void {
  m.set(p.name.toLowerCase(), p);
  for (const a of p.aliases) m.set(a.toLowerCase(), p);
}

function uniqueByName(personas: PersonaMeta[]): PersonaMeta[] {
  const seen = new Set<string>();
  const out: PersonaMeta[] = [];
  for (const p of personas) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    out.push(p);
  }
  return out;
}

export async function getPersona(name: string): Promise<PersonaMeta | null> {
  const all = await listPersonas();
  return all.find((p) => p.name === name) ?? null;
}

export async function resolvePersona(
  ref: string,
): Promise<{ match: PersonaMeta } | { ambiguous: true; candidates: PersonaMeta[] } | null> {
  const all = await listPersonas();
  const lower = ref.toLowerCase();
  const matches = all.filter(
    (p) => p.name.toLowerCase() === lower || p.aliases.some((a) => a.toLowerCase() === lower),
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) return { match: matches[0] };
  return { ambiguous: true, candidates: matches };
}

async function readPersonaDir(dir: string): Promise<PersonaMeta | null> {
  const personaFile = join(dir, 'persona.md');
  try {
    const text = await readFile(personaFile, 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm || typeof fm.name !== 'string') return null;
    return {
      name: fm.name,
      aliases: toStringArray(fm.aliases),
      model: typeof fm.model === 'string' ? fm.model : undefined,
      description: typeof fm.description === 'string' ? fm.description : undefined,
      tools: toStringArray(fm.tools),
      traits: toStringArray(fm.traits),
      source: 'external',
      path: dir,
    };
  } catch {
    return null;
  }
}

interface InstalledPlugin {
  installPath: string;
}

interface InstalledPluginsFile {
  plugins: Record<string, InstalledPlugin[]>;
}

async function loadPluginPersonas(): Promise<PersonaMeta[]> {
  const file = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    return [];
  }
  let parsed: InstalledPluginsFile;
  try {
    parsed = JSON.parse(raw) as InstalledPluginsFile;
  } catch {
    return [];
  }
  const out: PersonaMeta[] = [];
  for (const entries of Object.values(parsed.plugins ?? {})) {
    for (const entry of entries) {
      const meta = await readPersonaJson(entry.installPath);
      if (meta) out.push(meta);
    }
  }
  return out;
}

async function readPersonaJson(pluginRoot: string): Promise<PersonaMeta | null> {
  try {
    const text = await readFile(join(pluginRoot, 'persona.json'), 'utf8');
    const json = JSON.parse(text) as Record<string, unknown>;
    if (typeof json.name !== 'string' || json.name.length === 0) return null;
    return {
      name: json.name,
      displayName: typeof json.displayName === 'string' ? json.displayName : undefined,
      aliases: toStringArray(json.aliases),
      model: typeof json.model === 'string' ? json.model : undefined,
      description: typeof json.description === 'string' ? json.description : undefined,
      tools: toStringArray(json.tools),
      traits: toStringArray(json.traits),
      mcpServers:
        typeof json.mcpServers === 'object' && json.mcpServers !== null
          ? (json.mcpServers as Record<string, unknown>)
          : undefined,
      source: 'plugin',
      path: pluginRoot,
      pluginRoot,
    };
  } catch {
    return null;
  }
}

function parseFrontmatter(text: string): Record<string, unknown> | null {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return null;
  const out: Record<string, unknown> = {};
  for (const line of m[1].split('\n')) {
    const sep = line.indexOf(':');
    if (sep <= 0) continue;
    const key = line.slice(0, sep).trim();
    const val = line.slice(sep + 1).trim();
    out[key] = parseFmValue(val);
  }
  return out;
}

function parseFmValue(raw: string): unknown {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return raw.replace(/^['"]|['"]$/g, '');
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') return [v];
  return [];
}

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => e.name);
  } catch (err: unknown) {
    if (isEnoent(err)) return [];
    throw err;
  }
}

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ENOENT';
}

export { stat as _stat };
