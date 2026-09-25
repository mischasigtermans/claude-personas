import { describe, it, expect } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// A persona spawns with only CLAUDE.md in context: a context/ file loads only when CLAUDE.md imports it.
const personasDir = join(import.meta.dir, '..', '..', 'personas');
const personas = readdirSync(personasDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe.each(personas)('%s', (name) => {
  const dir = join(personasDir, name);
  const claudeMd = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
  const imports = [...claudeMd.matchAll(/^@(\S+)$/gm)].map((m) => m[1]);

  it('imports every context file from CLAUDE.md', () => {
    const contextDir = join(dir, 'context');
    const files = existsSync(contextDir) ? readdirSync(contextDir).filter((f) => f.endsWith('.md')) : [];
    expect(files.filter((f) => !imports.includes(`context/${f}`))).toEqual([]);
  });

  it('imports only files that exist', () => {
    expect(imports.filter((path) => !existsSync(join(dir, path)))).toEqual([]);
  });
});
