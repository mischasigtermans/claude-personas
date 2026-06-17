import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { mkdtemp, rm, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { upsertPersona, removePersona, readManifest } from '../src/state/manifest.js';
import type { PersonaMeta } from '../src/state/persona.js';

let root: string;
const prevParleyDir = process.env.PARLEY_DIR;

function persona(overrides: Partial<PersonaMeta> & { name: string; path: string }): PersonaMeta {
  return {
    aliases: [],
    source: 'plugin',
    ...overrides,
  };
}

describe('upsertPersona', () => {
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'personas-test-'));
    process.env.PARLEY_DIR = root;
  });

  afterEach(async () => {
    if (prevParleyDir === undefined) delete process.env.PARLEY_DIR;
    else process.env.PARLEY_DIR = prevParleyDir;
    await rm(root, { recursive: true, force: true });
  });

  it('writes one entry per declared alias plus the canonical name', async () => {
    await upsertPersona(persona({ name: 'steve-jobs', aliases: ['steve', 'jobs'], path: '/abs/steve-jobs' }));
    const m = await readManifest();
    const aliases = m.peers.map((p) => p.alias).sort();
    expect(aliases).toEqual(['jobs', 'steve', 'steve-jobs']);
    expect(m.peers.every((p) => p.path === '/abs/steve-jobs')).toBe(true);
  });

  it('carries model, mcpServers, and skipPermissions through to the manifest', async () => {
    await upsertPersona(
      persona({
        name: 'steve-jobs',
        aliases: ['steve'],
        path: '/abs/steve-jobs',
        model: 'opus',
        mcpServers: { foo: { command: 'bar' } },
      }),
    );
    const m = await readManifest();
    for (const p of m.peers) {
      expect(p.model).toBe('opus');
      expect(p.mcpServers).toEqual({ foo: { command: 'bar' } });
      expect(p.skipPermissions).toBe(true);
    }
  });

  it('carries an explicit memory opt-out, and omits the field when unset', async () => {
    await upsertPersona(persona({ name: 'quiet', aliases: ['q'], path: '/abs/quiet', memory: false }));
    await upsertPersona(persona({ name: 'normal', aliases: ['n'], path: '/abs/normal' }));
    const m = await readManifest();
    for (const p of m.peers.filter((e) => e.path === '/abs/quiet')) {
      expect(p.memory).toBe(false);
    }
    for (const p of m.peers.filter((e) => e.path === '/abs/normal')) {
      expect('memory' in p).toBe(false);
    }
  });

  it('purges stale entries on a path change (plugin version bump)', async () => {
    await upsertPersona(persona({ name: 'steve-jobs', aliases: ['steve'], path: '/abs/v0.1.0' }));
    await upsertPersona(persona({ name: 'steve-jobs', aliases: ['steve'], path: '/abs/v0.2.0' }));
    const m = await readManifest();
    expect(m.peers).toHaveLength(2);
    expect(m.peers.every((p) => p.path === '/abs/v0.2.0')).toBe(true);
  });

  it('reassigns an alias previously claimed by another persona', async () => {
    await upsertPersona(persona({ name: 'old-persona', aliases: ['shared'], path: '/abs/old' }));
    await upsertPersona(persona({ name: 'new-persona', aliases: ['shared'], path: '/abs/new' }));
    const m = await readManifest();
    const shared = m.peers.filter((p) => p.alias === 'shared');
    expect(shared).toHaveLength(1);
    expect(shared[0].path).toBe('/abs/new');
  });

  it('removePersona drops all entries for the named path', async () => {
    await upsertPersona(persona({ name: 'steve-jobs', aliases: ['steve', 'jobs'], path: '/abs/steve-jobs' }));
    await removePersona('steve-jobs', '/abs/steve-jobs');
    const m = await readManifest();
    expect(m.peers).toEqual([]);
  });

  it('deletes the manifest file when the last persona is removed', async () => {
    await mkdir(join(root, 'extensions'), { recursive: true });
    await upsertPersona(persona({ name: 'solo', aliases: [], path: '/abs/solo' }));
    await removePersona('solo', '/abs/solo');
    await expect(readFile(join(root, 'extensions', 'personas.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not collide when two different personas live at the same path', async () => {
    await upsertPersona(persona({ name: 'a', aliases: ['x'], path: '/abs/shared' }));
    await upsertPersona(persona({ name: 'b', aliases: ['y'], path: '/abs/shared' }));
    const m = await readManifest();
    // Same path means upsert(b) purges (a)'s entries; this is by design.
    const aliases = m.peers.map((p) => p.alias).sort();
    expect(aliases).toEqual(['b', 'y']);
  });
});

