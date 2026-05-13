---
name: search-knowledge
description: Deep Rust knowledge for code reviews. Provides detailed guidance on error handling, ownership, serde, type design, concurrency, testing, macros, and dependencies.
---

# Rust Knowledge Base

Comprehensive Rust knowledge for thorough code reviews.

## Knowledge Files

Load based on what you're reviewing:

| Topic | File | Use When |
|-------|------|----------|
| Error Handling | [error-handling.md](error-handling.md) | anyhow, thiserror, Result patterns, context |
| Ownership & Borrowing | [ownership.md](ownership.md) | Lifetimes, references, Cow, clone patterns |
| Serde | [serde.md](serde.md) | Derive, attributes, custom impls, performance |
| Type Design | [type-design.md](type-design.md) | Newtypes, enums, traits, generics, builders |
| Concurrency | [concurrency.md](concurrency.md) | async/await, channels, Arc, Mutex, Send/Sync |
| Testing | [testing.md](testing.md) | Unit, integration, property-based, mocking |
| Macros | [macros.md](macros.md) | Proc macros, syn, quote, declarative macros |
| Dependencies | [dependencies.md](dependencies.md) | Cargo, features, minimal deps, auditing |

## Usage

Read the relevant knowledge file(s) before reviewing code in that area. For comprehensive reviews, load all files.
