import { mkdir, readFile, writeFile, appendFile, unlink, readdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { paths } from './paths.js';

export interface OpenThread {
  thread_id: string;
  started_at: string;
  subject: string;
}

export async function readOpenThread(projectId: string, persona: string): Promise<OpenThread | null> {
  try {
    const text = await readFile(paths.openThreadFile(projectId, persona), 'utf8');
    return JSON.parse(text) as OpenThread;
  } catch (err: unknown) {
    if (isEnoent(err)) return null;
    throw err;
  }
}

export async function writeOpenThread(
  projectId: string,
  persona: string,
  thread: OpenThread,
): Promise<void> {
  await mkdir(paths.threadsDir(projectId, persona), { recursive: true });
  await writeFile(
    paths.openThreadFile(projectId, persona),
    JSON.stringify(thread, null, 2) + '\n',
    'utf8',
  );
}

export async function clearOpenThread(projectId: string, persona: string): Promise<void> {
  try {
    await unlink(paths.openThreadFile(projectId, persona));
  } catch (err: unknown) {
    if (!isEnoent(err)) throw err;
  }
}

export async function writeLastClosed(
  projectId: string,
  persona: string,
  threadId: string,
): Promise<void> {
  await mkdir(paths.personaStateDir(projectId, persona), { recursive: true });
  await writeFile(
    paths.lastClosedFile(projectId, persona),
    JSON.stringify({ thread_id: threadId }, null, 2) + '\n',
    'utf8',
  );
}

export async function readLastClosed(
  projectId: string,
  persona: string,
): Promise<{ thread_id: string } | null> {
  try {
    const text = await readFile(paths.lastClosedFile(projectId, persona), 'utf8');
    return JSON.parse(text) as { thread_id: string };
  } catch (err: unknown) {
    if (isEnoent(err)) return null;
    throw err;
  }
}

export function generateThreadId(): string {
  const now = new Date();
  const stamp =
    now.getFullYear().toString() +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    '-' +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds());
  const rand = randomBytes(2).toString('hex');
  return `${stamp}-${rand}`;
}

export async function ensureTranscript(projectId: string, persona: string, threadId: string): Promise<void> {
  await mkdir(paths.threadsDir(projectId, persona), { recursive: true });
  try {
    await readFile(paths.threadFile(projectId, persona, threadId), 'utf8');
  } catch (err: unknown) {
    if (isEnoent(err)) {
      await writeFile(paths.threadFile(projectId, persona, threadId), '', 'utf8');
    } else {
      throw err;
    }
  }
}

export async function appendTurn(
  projectId: string,
  persona: string,
  threadId: string,
  question: string,
  reply: string,
): Promise<void> {
  const ts = new Date().toISOString();
  const block = `## ${ts} — User\n${question}\n\n## ${ts} — ${persona}\n${reply}\n\n`;
  await mkdir(paths.threadsDir(projectId, persona), { recursive: true });
  await appendFile(paths.threadFile(projectId, persona, threadId), block, 'utf8');
}

export async function listOpenThreadsInProject(
  projectId: string,
): Promise<Array<{ persona: string; thread: OpenThread; transcript_path: string }>> {
  const out: Array<{ persona: string; thread: OpenThread; transcript_path: string }> = [];
  let dirs: string[];
  try {
    const entries = await readdir(paths.projectStateDir(projectId), { withFileTypes: true });
    dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err: unknown) {
    if (isEnoent(err)) return out;
    throw err;
  }
  for (const persona of dirs) {
    const open = await readOpenThread(projectId, persona);
    if (open) {
      out.push({
        persona,
        thread: open,
        transcript_path: paths.threadFile(projectId, persona, open.thread_id),
      });
    }
  }
  return out;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ENOENT';
}
