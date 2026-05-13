import { resolvePersona } from '../state/persona.js';
import { projectId as computeProjectId } from '../state/project.js';
import { appendTurn, readOpenThread } from '../state/threads.js';
import { requireString, type ToolDef } from './types.js';

export const personasCommitTurn: ToolDef = {
  name: 'commit_turn',
  description:
    'Append a Q/A pair to the persona\'s open thread transcript. Call this after the dispatcher returns its reply.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Persona name or alias' },
      question: { type: 'string' },
      reply: { type: 'string' },
    },
    required: ['name', 'question', 'reply'],
    additionalProperties: false,
  },
  handler: async (args) => {
    const ref = requireString(args, 'name');
    const question = requireString(args, 'question');
    const reply = requireString(args, 'reply');

    const result = await resolvePersona(ref);
    if (!result) throw new Error(`No persona found matching "${ref}"`);
    if ('ambiguous' in result) {
      throw new Error(`"${ref}" is ambiguous: ${result.candidates.map((c) => c.name).join(', ')}`);
    }
    const p = result.match;

    const pid = await computeProjectId();
    const open = await readOpenThread(pid, p.name);
    if (!open) throw new Error(`No open thread for ${p.name} in this project. Call personas_begin_turn first.`);

    await appendTurn(pid, p.name, open.thread_id, question, reply);
    return '';
  },
};
