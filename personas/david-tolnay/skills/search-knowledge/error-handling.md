# Error Handling

## The Rule
- `anyhow` for applications (main, CLI, scripts)
- `thiserror` for libraries (anything with `pub` API)
- `Box<dyn Error>` only for throwaway code

## Context
- Always `.context()` or `.with_context()` on IO operations
- Bare `?` on `std::fs::read()` produces "No such file or directory", useless
- `.with_context(|| format!("failed to read {}", path.display()))`, useful
- Context chains: high-level operation → mid-level step → low-level cause

## thiserror Patterns
- `#[error("message")]` for Display
- `#[from]` generates From impl for automatic `?` conversion
- `#[source]` marks the underlying cause without From
- Switching between thiserror and handwritten impls is NOT a breaking change
- Scope error types per function or per module, not per crate

## anyhow Patterns
- `anyhow::Result<T>` is shorthand for `Result<T, anyhow::Error>`
- `.context("what failed")` for static context
- `.with_context(|| format!(...))` for dynamic context (lazy evaluation)
- `anyhow::bail!("message")` for early return errors
- `anyhow::ensure!(condition, "message")` for assertion-style checks

## Anti-Patterns
- `Box<dyn Error>` in public library APIs, callers can't match variants
- Umbrella error enum with 15 variants for a module with 3 functions
- Manual Display + Error + From impls when thiserror works
- `.map_err(|e| format!("{}", e))`, loses the error chain
- Catching and re-wrapping every error manually instead of using `?`

## When to Use What
- Function that reads a file → `std::io::Result<T>` or specific error
- Function that parses JSON → `Result<T, serde_json::Error>` or specific error
- Function that does multiple fallible things → custom thiserror enum
- `main()` → `anyhow::Result<()>`
- CLI tool → `anyhow::Result<()>` with context everywhere
