import { readFile } from 'node:fs/promises';
import { resolvePersona } from '../state/persona.js';
import { projectId as computeProjectId } from '../state/project.js';
import { paths } from '../state/paths.js';
import {
  readLastClosed,
  readOpenThread,
  writeOpenThread,
} from '../state/threads.js';
import { requireString, type ToolDef } from './types.js';

export const personasReopenThread: ToolDef = {
  name: 'reopen_thread',
  description:
    'Restore the persona\'s most recently closed thread as the open thread. Errors if no last-closed exists or if a thread is already open.',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'name');
    const result = await resolvePersona(ref);
    if (!result) throw new Error(`No persona found matching "${ref}"`);
    if ('ambiguous' in result) {
      throw new Error(`"${ref}" is ambiguous: ${result.candidates.map((c) => c.name).join(', ')}`);
    }
    const p = result.match;

    const pid = await computeProjectId();
    if (await readOpenThread(pid, p.name)) {
      throw new Error(`${p.name} already has an open thread. Close it first.`);
    }
    const last = await readLastClosed(pid, p.name);
    if (!last) throw new Error(`No closed thread to reopen for ${p.name}.`);

    const transcript = paths.threadFile(pid, p.name, last.thread_id);
    const text = await readFile(transcript, 'utf8');
    const firstUser = text.split('\n').find((l) => /^## .* — User$/.test(l));
    const startedAt = firstUser ? firstUser.replace(/^## /, '').replace(/ — User$/, '') : new Date().toISOString();
    const subjectMatch = /## .* — User\n([^\n]+)/.exec(text);
    const subject = subjectMatch ? subjectMatch[1].slice(0, 80) : '(restored)';

    await writeOpenThread(pid, p.name, {
      thread_id: last.thread_id,
      started_at: startedAt,
      subject,
    });
    return `Reopened ${p.name} thread (${subject}).`;
  },
};
