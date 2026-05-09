import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { paths } from './paths.js';

export interface PersonaMeta {
  name: string;
  aliases: string[];
  model?: string;
  description?: string;
  tools?: string[];
  traits?: string[];
  source: 'bundled' | 'external';
  path: string;
}

export async function listPersonas(): Promise<PersonaMeta[]> {
  const out: PersonaMeta[] = [];
  for (const dir of await safeReaddir(paths.bundledPersonasDir)) {
    const meta = await readPersonaDir(join(paths.bundledPersonasDir, dir), 'bundled');
    if (meta) out.push(meta);
  }
  for (const dir of await safeReaddir(paths.externalDir)) {
    const meta = await readPersonaDir(join(paths.externalDir, dir), 'external');
    if (meta) out.push(meta);
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

async function readPersonaDir(dir: string, source: 'bundled' | 'external'): Promise<PersonaMeta | null> {
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
      source,
      path: dir,
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
