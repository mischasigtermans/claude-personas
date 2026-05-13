import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function projectId(cwd: string = process.cwd()): Promise<string> {
  const remote = await gitRemote(cwd);
  const source = remote ?? cwd;
  return createHash('sha1').update(source).digest('hex').slice(0, 12);
}

async function gitRemote(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await exec('git', ['config', '--get', 'remote.origin.url'], { cwd });
    const url = stdout.trim();
    return url.length > 0 ? url : null;
  } catch {
    return null;
  }
}
