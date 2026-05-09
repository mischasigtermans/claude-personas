import { personasList } from './list.js';
import { personasResolve } from './resolve.js';
import { personasEnable, personasDisable } from './enable.js';
import { personasBeginTurn } from './begin_turn.js';
import { personasGetThreadContext } from './get_thread_context.js';
import { personasCommitTurn } from './commit_turn.js';
import { personasCloseThread } from './close_thread.js';
import { personasReopenThread } from './reopen_thread.js';
import { personasThreads } from './threads.js';
import { personasAdd } from './add.js';
import { personasRemove } from './remove.js';
import type { ToolDef } from './types.js';

export const tools: ToolDef[] = [
  personasList,
  personasResolve,
  personasThreads,
  personasEnable,
  personasDisable,
  personasBeginTurn,
  personasGetThreadContext,
  personasCommitTurn,
  personasCloseThread,
  personasReopenThread,
  personasAdd,
  personasRemove,
];
