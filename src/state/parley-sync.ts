import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdir, readFile, writeFile, unlink, rename } from 'node:fs/promises';
import type { PersonaMeta } from './persona.js';

const parleyDir = (): string =>
  process.env.PARLEY_DIR ?? join(homedir(), '.claude', 'parley');

const peersFile = (): string => join(parleyDir(), 'peers.json');
const peersLockFile = (): string => `${peersFile()}.lock`;

interface PeerEntry {
  path: string;
  description?: string;
  model?: string;
  mcpServers?: Record<string, unknown>;
  skipPermissions?: boolean;
  type?: string;
}

interface PeersFile {
  peers: Record<string, PeerEntry>;
}

/**
 * Write a parley peer entry mirroring the persona's intended runtime config.
 * Silent no-op if parley isn't installed (peers.json absent).
 * Skip-and-warn if an existing entry at the same alias isn't marked
 * type: "persona" -- don't clobber user-curated peers.
 */
export async function syncParleyOnEnable(persona: PersonaMeta): Promise<void> {
  if (!(await isParleyInstalled())) return;
  await withLock(peersLockFile(), async () => {
    const file = await readPeers();
    const existing = file.peers[persona.name];
    if (existing && existing.type !== 'persona') {
      process.stderr.write(
        `parley-sync: peer "${persona.name}" is user-managed; not overwriting. ` +
          `Remove it from peers.json first if you want personas to manage it.\n`,
      );
      return;
    }
    file.peers[persona.name] = {
      path: persona.path,
      description: persona.description,
      model: persona.model,
      mcpServers: isPlainObject(persona.mcpServers) ? persona.mcpServers : undefined,
      skipPermissions: true,
      type: 'persona',
    };
    await writePeers(file);
  });
}

/**
 * Remove a parley peer entry only if it was personas-managed.
 * Silent no-op if parley isn't installed or the entry was user-managed.
 */
export async function syncParleyOnDisable(name: string): Promise<void> {
  if (!(await isParleyInstalled())) return;
  await withLock(peersLockFile(), async () => {
    const file = await readPeers();
    const existing = file.peers[name];
    if (!existing) return;
    if (existing.type !== 'persona') return;
    delete file.peers[name];
    await writePeers(file);
  });
}

/**
 * Detect parley via the Claude Code plugin registry. peers.json existence
 * is the wrong signal: if parley is installed but hasn't run yet, the file
 * doesn't exist and we'd silently no-op forever.
 */
async function isParleyInstalled(): Promise<boolean> {
  try {
    const raw = await readFile(
      join(homedir(), '.claude', 'plugins', 'installed_plugins.json'),
      'utf8',
    );
    const parsed = JSON.parse(raw) as { plugins?: Record<string, unknown> };
    return Object.keys(parsed.plugins ?? {}).some((k) => k.startsWith('parley@'));
  } catch {
    return false;
  }
}

async function readPeers(): Promise<PeersFile> {
  try {
    const raw = await readFile(peersFile(), 'utf8');
    const parsed = JSON.parse(raw) as { peers?: Record<string, PeerEntry> };
    return { peers: parsed.peers ?? {} };
  } catch {
    return { peers: {} };
  }
}

async function writePeers(file: PeersFile): Promise<void> {
  await mkdir(dirname(peersFile()), { recursive: true });
  const tmp = `${peersFile()}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(file, null, 2));
  await rename(tmp, peersFile());
}

/**
 * Cross-plugin lock. Matches parley's withLock convention: same lock path,
 * same PID-as-content protocol, same staleness recovery semantics. Personas
 * and parley contend on the same file when both are touching peers.json.
 */
async function withLock<T>(lockPath: string, fn: () => Promise<T>): Promise<T> {
  const timeoutMs = 30_000;
  const pollMs = 100;
  const deadline = Date.now() + timeoutMs;
  await mkdir(dirname(lockPath), { recursive: true });
  while (true) {
    try {
      await writeFile(lockPath, String(process.pid), { flag: 'wx' });
      break;
    } catch (err: unknown) {
      if (!isErrno(err, 'EEXIST')) throw err;
      if (await tryReclaimStaleLock(lockPath)) continue;
      if (Date.now() > deadline) throw new Error(`parley-sync: lock timeout at ${lockPath}`);
      await sleep(pollMs);
    }
  }
  try {
    return await fn();
  } finally {
    await unlink(lockPath).catch(() => {});
  }
}

async function tryReclaimStaleLock(lockPath: string): Promise<boolean> {
  let pid: number;
  try {
    const contents = (await readFile(lockPath, 'utf8')).trim();
    pid = parseInt(contents, 10);
    if (!Number.isFinite(pid) || pid <= 0) return false;
  } catch {
    return false;
  }
  if (pid === process.pid) return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch {
    await unlink(lockPath).catch(() => {});
    return true;
  }
}

function isErrno(err: unknown, code: string): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === code;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
