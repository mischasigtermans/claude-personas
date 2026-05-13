import { mkdir, readFile, rm, symlink, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, isAbsolute, join } from 'node:path';
import { paths } from '../state/paths.js';
import { listPersonas } from '../state/persona.js';
import { requireString, type ToolDef } from './types.js';

const exec = promisify(execFile);

export const personasAdd: ToolDef = {
  name: 'add',
  description:
    'Install an external persona from a git URL or absolute local path. Validates persona.md exists with valid frontmatter. Refuses overwrite of existing canonical names.',
  inputSchema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'git URL (https/ssh) or absolute local path / file:// URL',
      },
    },
    required: ['source'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const source = requireString(args, 'source');
    await mkdir(paths.externalDir, { recursive: true });

    const isUrl = /^(https?:|git@|ssh:)/.test(source);
    const isFileUrl = source.startsWith('file://');
    const localPath = isFileUrl ? source.slice('file://'.length) : source;

    if (!isUrl && !isAbsolute(localPath)) {
      throw new Error('source must be a git URL or absolute path (or file:// URL)');
    }

    const inferredName = inferName(source);
    const targetDir = join(paths.externalDir, inferredName);
    if (await exists(targetDir)) {
      throw new Error(`A persona named "${inferredName}" already exists in external/. Remove it first.`);
    }

    if (isUrl) {
      await exec('git', ['clone', '--depth', '1', source, targetDir]);
    } else {
      await symlink(localPath, targetDir);
    }

    const personaFile = join(targetDir, 'persona.md');
    let text: string;
    try {
      text = await readFile(personaFile, 'utf8');
    } catch {
      await rm(targetDir, { recursive: true, force: true });
      throw new Error(`No persona.md found at ${personaFile}`);
    }
    const fm = /^---\n([\s\S]*?)\n---/.exec(text);
    if (!fm) {
      await rm(targetDir, { recursive: true, force: true });
      throw new Error('persona.md missing YAML frontmatter');
    }
    const nameLine = /^name:\s*(.+)$/m.exec(fm[1]);
    if (!nameLine) {
      await rm(targetDir, { recursive: true, force: true });
      throw new Error('persona.md frontmatter missing required "name" field');
    }
    const canonical = nameLine[1].trim();

    const all = await listPersonas();
    const collision = all.find((p) => p.name === canonical && p.path !== targetDir);
    if (collision) {
      await rm(targetDir, { recursive: true, force: true });
      throw new Error(
        `Persona name "${canonical}" already exists (source: ${collision.source}). Remove the existing one first.`,
      );
    }

    return `Added external persona: ${canonical}. Run personas_enable to activate.`;
  },
};

function inferName(source: string): string {
  const trimmed = source.replace(/\.git$/, '').replace(/\/$/, '');
  return basename(trimmed);
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
