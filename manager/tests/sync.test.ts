import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let root: string;
const prev = { CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR, PARLEY_DIR: process.env.PARLEY_DIR, PERSONAS_DIR: process.env.PERSONAS_DIR };

describe('syncPluginPaths', () => {
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'personas-sync-'));
    process.env.CLAUDE_CONFIG_DIR = join(root, '.claude');
    process.env.PARLEY_DIR = join(root, 'parley');
    process.env.PERSONAS_DIR = join(root, 'personas');
  });

  afterAll(async () => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    await rm(root, { recursive: true, force: true });
  });

  it('moves an enabled persona onto its updated install path and leaves disabled ones out', async () => {
    const plugin = (name: string, version: string) => join(root, 'cache', name, version);
    for (const [name, version] of [['taylor-otwell', '0.1.2'], ['steve-jobs', '0.1.2']]) {
      await mkdir(plugin(name, version), { recursive: true });
      await writeFile(join(plugin(name, version), 'persona.json'), JSON.stringify({ name, aliases: [name.split('-')[0]] }));
    }
    await mkdir(join(root, '.claude', 'plugins'), { recursive: true });
    await writeFile(
      join(root, '.claude', 'plugins', 'installed_plugins.json'),
      JSON.stringify({
        plugins: {
          'taylor-otwell@by-mischa': [{ installPath: plugin('taylor-otwell', '0.1.2') }],
          'steve-jobs@by-mischa': [{ installPath: plugin('steve-jobs', '0.1.2') }],
        },
      }),
    );
    await mkdir(join(root, 'parley', 'extensions'), { recursive: true });
    await writeFile(
      join(root, 'parley', 'extensions', 'personas.json'),
      JSON.stringify({
        name: 'personas',
        peers: [
          { alias: 'taylor-otwell', path: plugin('taylor-otwell', '0.1.1') },
          { alias: 'taylor', path: plugin('taylor-otwell', '0.1.1') },
        ],
      }),
    );

    const { syncPluginPaths, readManifest } = await import('../src/state/manifest.js');
    await syncPluginPaths();
    const m = await readManifest();

    expect(m.peers.map((p) => p.alias).sort()).toEqual(['taylor', 'taylor-otwell']);
    expect(m.peers.every((p) => p.path === plugin('taylor-otwell', '0.1.2'))).toBe(true);
  });
});
