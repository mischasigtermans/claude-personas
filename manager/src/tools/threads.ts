import { projectId as computeProjectId } from '../state/project.js';
import { listOpenThreadsInProject } from '../state/threads.js';
import type { ToolDef } from './types.js';

export const personasThreads: ToolDef = {
  name: 'threads',
  description: 'List all open persona threads in the current project.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  handler: async () => {
    const pid = await computeProjectId();
    const list = await listOpenThreadsInProject(pid);
    if (list.length === 0) {
      return JSON.stringify({ project_id: pid, threads: [] });
    }
    return JSON.stringify(
      {
        project_id: pid,
        threads: list.map((t) => ({
          persona: t.persona,
          thread_id: t.thread.thread_id,
          started_at: t.thread.started_at,
          subject: t.thread.subject,
          transcript_path: t.transcript_path,
        })),
      },
      null,
      2,
    );
  },
};
