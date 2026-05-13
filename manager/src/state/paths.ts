import { homedir } from 'node:os';
import { join } from 'node:path';

function personasDataDir(): string {
  return process.env.PERSONAS_DIR ?? join(homedir(), '.claude', 'personas');
}

function pluginRoot(): string {
  const root = process.env.PERSONAS_PLUGIN_ROOT;
  if (!root) {
    throw new Error('PERSONAS_PLUGIN_ROOT is not set; the MCP server must be launched from the plugin');
  }
  return root;
}

export const paths = {
  get dataRoot() {
    return personasDataDir();
  },
  get pluginRoot() {
    return pluginRoot();
  },
  get configFile() {
    return join(personasDataDir(), 'config.json');
  },
  get externalDir() {
    return join(personasDataDir(), 'external');
  },
  get stateDir() {
    return join(personasDataDir(), 'state');
  },
  externalPersonaDir: (name: string) => join(personasDataDir(), 'external', name),
  projectStateDir: (projectId: string) => join(personasDataDir(), 'state', projectId),
  personaStateDir: (projectId: string, persona: string) =>
    join(personasDataDir(), 'state', projectId, persona),
  threadsDir: (projectId: string, persona: string) =>
    join(personasDataDir(), 'state', projectId, persona, 'threads'),
  threadFile: (projectId: string, persona: string, threadId: string) =>
    join(personasDataDir(), 'state', projectId, persona, 'threads', `${threadId}.md`),
  memoryFile: (projectId: string, persona: string) =>
    join(personasDataDir(), 'state', projectId, persona, 'memory.md'),
  openThreadFile: (projectId: string, persona: string) =>
    join(personasDataDir(), 'state', projectId, persona, 'open-thread.json'),
  lastClosedFile: (projectId: string, persona: string) =>
    join(personasDataDir(), 'state', projectId, persona, 'last-closed.json'),
} as const;
