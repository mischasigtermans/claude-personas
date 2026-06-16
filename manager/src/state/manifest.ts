/**
 * Parley extensions manifest owned by the personas plugin.
 *
 * Personas writes enabled personas to `<parleyDir>/extensions/personas.json`.
 * Parley scans that directory and merges the entries into its peer registry.
 * The contract is purely filesystem-level; personas does NOT import any code
 * from claude-parley. The schema is part of parley's extensions docs:
 * https://github.com/mischasigtermans/claude-parley/blob/main/docs/extensions.md
 */
import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { paths } from './paths.js';
import type { PersonaMeta } from './persona.js';

export interface ExtensionPeer {
  alias: string;
  path: string;
  description?: string;
  /** Opaque type hint for parley's display logic. */
  type?: 'persona';
  /** Model the persona's headless spawn should use (e.g. 'opus'). */
  model?: string;
  /** MCP servers the persona declares in persona.json. */
  mcpServers?: Record<string, unknown>;
  /** Personas run with permissions skipped; they're trusted advisory peers. */
  skipPermissions?: boolean;
}

export interface PersonasExtensionManifest {
  name: 'personas';
  version?: string;
  description?: string;
  peers: ExtensionPeer[];
}

const MANIFEST_VERSION = '0.3.0';
const MANIFEST_DESCRIPTION = 'Persona advisors with knowledge modules';

function empty(): PersonasExtensionManifest {
  return {
    name: 'personas',
    version: MANIFEST_VERSION,
    description: MANIFEST_DESCRIPTION,
    peers: [],
  };
}

export async function readManifest(): Promise<PersonasExtensionManifest> {
  try {
    const raw = await readFile(paths.parleyExtensionManifest, 'utf8');
    const parsed = JSON.parse(raw) as PersonasExtensionManifest;
    if (!Array.isArray(parsed.peers)) return empty();
    return {
      name: 'personas',
      version: typeof parsed.version === 'string' ? parsed.version : MANIFEST_VERSION,
      description: typeof parsed.description === 'string' ? parsed.description : MANIFEST_DESCRIPTION,
      peers: parsed.peers.filter(isValidEntry),
    };
  } catch (err) {
    if (isEnoent(err)) return empty();
    throw err;
  }
}

export async function writeManifest(m: PersonasExtensionManifest): Promise<void> {
  await mkdir(paths.parleyExtensionsDir, { recursive: true });
  // If the manifest is empty after a disable, remove the file instead of
  // writing an empty peers list. Keeps the extensions dir tidy and avoids
  // listing a no-op extension in parley_peers.
  if (m.peers.length === 0) {
    try {
      await unlink(paths.parleyExtensionManifest);
    } catch (err) {
      if (!isEnoent(err)) throw err;
    }
    return;
  }
  const tmp = `${paths.parleyExtensionManifest}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(dirname(tmp), { recursive: true });
  await writeFile(tmp, JSON.stringify(m, null, 2));
  await rename(tmp, paths.parleyExtensionManifest);
}

/**
 * Add (or refresh) a persona's entries in the manifest. Writes one peer entry
 * per alias (canonical name + each alias from the persona's metadata), all
 * pointing at the same persona path. `parley_ask peer=<any alias>` resolves.
 */
export async function upsertPersona(p: PersonaMeta): Promise<void> {
  // Single-user assumption: not lock-guarded. If two processes call upsert
  // concurrently, one write loses. Acceptable for v0.3.0.
  const m = await readManifest();
  const allAliases = uniqueLowercase([p.name, ...p.aliases]);
  const aliasSet = new Set(allAliases);
  // Drop entries by EITHER path match OR alias match. Catches:
  //  (a) same persona at a new path (plugin version bump) — purge old-path rows.
  //  (b) an alias previously claimed by another persona being reassigned.
  const filtered = m.peers.filter((e) => e.path !== p.path && !aliasSet.has(e.alias));
  const desc = p.description || `Persona: ${p.displayName ?? p.name}`;
  const next = [
    ...filtered,
    ...allAliases.map<ExtensionPeer>((alias) => ({
      alias,
      path: p.path,
      description: desc,
      type: 'persona',
      model: p.model,
      mcpServers: isPlainObject(p.mcpServers) ? p.mcpServers : undefined,
      skipPermissions: true,
    })),
  ];
  await writeManifest({ ...m, peers: next });
}

/**
 * Remove all entries pointing at the named persona's path.
 */
export async function removePersona(canonicalName: string, personaPath: string): Promise<void> {
  const m = await readManifest();
  const next = m.peers.filter((e) => e.path !== personaPath && e.alias !== canonicalName);
  await writeManifest({ ...m, peers: next });
}

function isValidEntry(v: unknown): v is ExtensionPeer {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Partial<ExtensionPeer>;
  return typeof e.alias === 'string' && typeof e.path === 'string';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function uniqueLowercase(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const lc = v.toLowerCase();
    if (seen.has(lc)) continue;
    seen.add(lc);
    out.push(lc);
  }
  return out;
}

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ENOENT';
}
