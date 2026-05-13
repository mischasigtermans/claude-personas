import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { paths } from './paths.js';

export interface MemoryAppendResult {
  added: number;
  deduped: number;
}

export async function appendMemoryBullets(
  projectId: string,
  persona: string,
  takeawaysText: string,
): Promise<MemoryAppendResult> {
  const file = paths.memoryFile(projectId, persona);
  const existing = await readMemory(file);
  const existingKeys = new Set(existing.map(memoryKey));

  const incoming = parseBullets(takeawaysText);
  let added = 0;
  let deduped = 0;
  const toAppend: string[] = [];

  for (const line of incoming) {
    const key = memoryKey(line);
    if (existingKeys.has(key)) {
      deduped++;
      continue;
    }
    existingKeys.add(key);
    toAppend.push(line);
    added++;
  }

  if (toAppend.length > 0) {
    await mkdir(paths.personaStateDir(projectId, persona), { recursive: true });
    const prefix = existing.length === 0 ? '' : '';
    await writeFile(file, [...existing, ...toAppend].join('\n') + '\n', 'utf8');
    void prefix;
  }

  return { added, deduped };
}

async function readMemory(file: string): Promise<string[]> {
  try {
    const text = await readFile(file, 'utf8');
    return text.split('\n').filter((l) => l.trim().length > 0);
  } catch (err: unknown) {
    if (isEnoent(err)) return [];
    throw err;
  }
}

function parseBullets(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => /^- /.test(l));
}

function memoryKey(line: string): string {
  return line
    .replace(/^- /, '')
    .toLowerCase()
    .slice(0, 60);
}

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ENOENT';
}
