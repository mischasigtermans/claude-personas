import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { paths } from './paths.js';

export interface PersonasConfig {
  enabled: string[];
  version: number;
}

const DEFAULT: PersonasConfig = { enabled: [], version: 1 };

export async function readConfig(): Promise<PersonasConfig> {
  try {
    const text = await readFile(paths.configFile, 'utf8');
    const parsed = JSON.parse(text) as Partial<PersonasConfig>;
    return {
      enabled: Array.isArray(parsed.enabled) ? parsed.enabled.filter((x) => typeof x === 'string') : [],
      version: typeof parsed.version === 'number' ? parsed.version : 1,
    };
  } catch (err: unknown) {
    if (isEnoent(err)) return { ...DEFAULT };
    throw err;
  }
}

export async function writeConfig(config: PersonasConfig): Promise<void> {
  await mkdir(dirname(paths.configFile), { recursive: true });
  await writeFile(paths.configFile, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

export async function setEnabled(name: string, enabled: boolean): Promise<PersonasConfig> {
  const config = await readConfig();
  const set = new Set(config.enabled);
  if (enabled) set.add(name);
  else set.delete(name);
  config.enabled = [...set];
  await writeConfig(config);
  return config;
}

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ENOENT';
}
