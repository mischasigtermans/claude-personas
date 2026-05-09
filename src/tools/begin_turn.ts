import { mkdir } from 'node:fs/promises';
import { readConfig } from '../state/config.js';
import { resolvePersona } from '../state/persona.js';
import { paths } from '../state/paths.js';
import { projectId as computeProjectId } from '../state/project.js';
import {
  ensureTranscript,
  generateThreadId,
  readOpenThread,
  writeOpenThread,
} from '../state/threads.js';
import { requireString, type ToolDef } from './types.js';

export const personasBeginTurn: ToolDef = {
  name: 'begin_turn',
  description:
    'Begin a turn for a persona. Resolves the persona, computes project_id, ensures state dirs exist, and either reuses the open thread or starts a new one. Returns paths for the dispatcher to use.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Persona name or alias' },
      question: { type: 'string', description: 'The user question (used as subject if a new thread)' },
    },
    required: ['name', 'question'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'name');
    const question = requireString(args, 'question');

    const result = await resolvePersona(ref);
    if (!result) throw new Error(`No persona found matching "${ref}"`);
    if ('ambiguous' in result) {
      throw new Error(`"${ref}" is ambiguous: ${result.candidates.map((c) => c.name).join(', ')}`);
    }
    const p = result.match;

    const config = await readConfig();
    if (!config.enabled.includes(p.name)) {
      throw new Error(
        `Persona "${p.name}" is not enabled. Run personas_enable first or call /personas enable ${p.name}.`,
      );
    }

    const pid = await computeProjectId();
    await mkdir(paths.threadsDir(pid, p.name), { recursive: true });

    let open = await readOpenThread(pid, p.name);
    let isContinuation = open !== null;
    if (!open) {
      const threadId = generateThreadId();
      open = {
        thread_id: threadId,
        started_at: new Date().toISOString(),
        subject: question.slice(0, 80),
      };
      await ensureTranscript(pid, p.name, threadId);
      await writeOpenThread(pid, p.name, open);
    }

    return JSON.stringify({
      persona_name: p.name,
      persona_path: p.path,
      project_id: pid,
      memory_path: paths.memoryFile(pid, p.name),
      thread_path: paths.threadFile(pid, p.name, open.thread_id),
      thread_id: open.thread_id,
      is_continuation: isContinuation,
      subject: open.subject,
      started_at: open.started_at,
    });
  },
};
