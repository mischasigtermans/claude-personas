# Concurrency

## Async/Await
- `async fn` returns a Future — nothing happens until polled
- `.await` yields control to the executor
- Use `tokio` or `async-std` as the runtime
- `#[tokio::main]` on main for async entry point
- Prefer `tokio::spawn` for concurrent tasks

## Channels
- `tokio::sync::mpsc` — multiple producer, single consumer
- `tokio::sync::oneshot` — single value, single use
- `tokio::sync::broadcast` — multiple consumers get every message
- `tokio::sync::watch` — latest value, consumers may miss intermediate
- Prefer channels over `Arc<Mutex<T>>` for message passing

## Shared State
- `Arc<T>` — thread-safe reference counting, cheap to clone
- `Arc<Mutex<T>>` — shared mutable state, last resort
- `Arc<RwLock<T>>` — many readers, few writers
- `DashMap` — concurrent HashMap without global lock
- Keep critical sections short — don't hold locks across `.await`

## Send and Sync
- `Send` — safe to move between threads
- `Sync` — safe to share references between threads
- Most types are Send + Sync automatically
- `Rc` is not Send — use `Arc` for multi-threaded code
- `Cell`/`RefCell` are not Sync — use `Mutex`/`RwLock`

## Common Anti-Patterns
- Holding `MutexGuard` across `.await` — deadlock risk
- `Arc<Mutex<Vec<T>>>` when a channel would be cleaner
- Spawning tasks without join handles — fire-and-forget loses errors
- Blocking the async executor with synchronous IO — use `spawn_blocking`
- `async` on functions that don't actually await — unnecessary overhead
- Mixing sync and async code without `block_on` boundaries
