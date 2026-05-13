# Dependencies

## Cargo Basics
- `cargo add crate_name`, add a dependency
- `cargo tree`, visualize dependency graph
- `cargo audit`, check for known vulnerabilities
- `cargo deny`, policy enforcement (licenses, sources, bans)
- `cargo update`, update within semver-compatible range

## Minimal Dependencies
- Every dependency is compile time, audit surface, supply chain risk
- Check if `std` provides what you need before adding a crate
- Prefer crates with few transitive dependencies
- `cargo tree -d` shows duplicate dependency versions

## Feature Flags
- `default-features = false` to opt out of heavy defaults
- Feature-gate optional functionality
- Don't enable features you don't use
- `cargo build --no-default-features` to test minimal builds
- Document which features enable what

## Semver
- `0.x.y`, any change can be breaking
- `>=1.0.0`, major for breaking, minor for features, patch for fixes
- The semver trick: re-export types from new version in old version
- Bumping MSRV (minimum supported Rust version) is a breaking change in practice

## no_std Support
- `#![no_std]` at crate root for embedded/WASM targets
- `alloc` crate for heap allocation without full std
- Feature-gate `std` support: `#[cfg(feature = "std")]`
- Test both `std` and `no_std` builds in CI

## Common Anti-Patterns
- Pulling in `regex` for a fixed pattern, use `str` methods
- `chrono` when `time` or `std::time` suffices
- `rand` for non-cryptographic shuffling when not needed
- Multiple JSON crates in the same project
- Not pinning in applications, use `Cargo.lock`
- Yanking published versions without security justification
