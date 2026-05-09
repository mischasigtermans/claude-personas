import { resolvePersona } from '../state/persona.js';
import { paths } from '../state/paths.js';
import { projectId as computeProjectId } from '../state/project.js';
import { readOpenThread } from '../state/threads.js';
import { requireString, type ToolDef } from './types.js';

export const personasGetThreadContext: ToolDef = {
  name: 'get_thread_context',
  description:
    'Return paths for a persona\'s currently open thread (persona_path, memory_path, thread_path) without creating one. Errors if no thread is open. Use before invoking the dispatcher for close-thread or for inspection.',
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
    const open = await readOpenThread(pid, p.name);
    if (!open) throw new Error(`${p.name} has no open thread in this project.`);

    return JSON.stringify({
      persona_name: p.name,
      persona_path: p.path,
      project_id: pid,
      memory_path: paths.memoryFile(pid, p.name),
      thread_path: paths.threadFile(pid, p.name, open.thread_id),
      thread_id: open.thread_id,
      subject: open.subject,
      started_at: open.started_at,
    });
  },
};
