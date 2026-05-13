import { resolvePersona } from '../state/persona.js';
import { projectId as computeProjectId } from '../state/project.js';
import { appendMemoryBullets } from '../state/memory.js';
import {
  clearOpenThread,
  readOpenThread,
  writeLastClosed,
} from '../state/threads.js';
import { requireString, type ToolDef } from './types.js';

export const personasCloseThread: ToolDef = {
  name: 'close_thread',
  description:
    'Close a persona thread. Appends the dispatcher\'s takeaway bullets to memory.md (deduped), archives the open thread pointer.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Persona name or alias' },
      takeaways: {
        type: 'string',
        description: 'Bullet output from the dispatcher (lines starting with "- ").',
      },
    },
    required: ['name', 'takeaways'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'name');
    const takeaways = requireString(args, 'takeaways');

    const result = await resolvePersona(ref);
    if (!result) throw new Error(`No persona found matching "${ref}"`);
    if ('ambiguous' in result) {
      throw new Error(`"${ref}" is ambiguous: ${result.candidates.map((c) => c.name).join(', ')}`);
    }
    const p = result.match;

    const pid = await computeProjectId();
    const open = await readOpenThread(pid, p.name);
    if (!open) throw new Error(`${p.name} has no open thread in this project.`);

    const memResult = await appendMemoryBullets(pid, p.name, takeaways);
    await writeLastClosed(pid, p.name, open.thread_id);
    await clearOpenThread(pid, p.name);

    return `Closed ${p.name}. ${memResult.added} takeaways added (${memResult.deduped} deduped).`;
  },
};
