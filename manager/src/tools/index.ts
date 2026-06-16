import { personasList } from './list.js';
import { personasResolve } from './resolve.js';
import { personasEnable, personasDisable } from './enable.js';
import { personasAdd } from './add.js';
import { personasRemove } from './remove.js';
import type { ToolDef } from './types.js';

/**
 * Reduced tool surface after the Parley unification.
 * The old in-session thread/memory tools (begin_turn, commit_turn, close_thread, etc.) have been removed.
 * All "ask" functionality for personas now goes through Parley.
 */
export const tools: ToolDef[] = [
  personasList,
  personasResolve,
  personasEnable,
  personasDisable,
  personasAdd,
  personasRemove,
];
