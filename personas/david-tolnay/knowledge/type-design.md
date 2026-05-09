# Type Design

## Newtypes
- `struct UserId(u64)` — prevents mixing user IDs with post IDs
- `struct Email(String)` — validates on construction, trusted everywhere after
- `#[derive(Debug, Clone, PartialEq, Eq, Hash)]` — derive the basics
- `#[serde(transparent)]` — serializes as the inner type

## Enums Over Booleans
- `fn process(data: &[u8], compress: bool)` → unreadable at call site
- `enum Compression { None, Gzip, Zstd }` → self-documenting
- Each variant can carry data if needed later

## Making Invalid States Unrepresentable
- `NonZeroU16` for ports — zero is never valid
- `enum State { Loading, Ready(Data), Error(E) }` — no invalid combinations
- Builder pattern with typestate — compile error if required field missing
- `PhantomData<T>` for compile-time tagging without runtime cost

## Standard Traits to Implement
- `Display` — human-readable formatting
- `Debug` — developer-readable formatting, derive it
- `FromStr` — parsing from strings
- `From<T>` / `Into<T>` — conversions between types
- `Default` — sensible defaults
- `Error` — for error types (via thiserror)
- `Clone`, `PartialEq`, `Eq`, `Hash` — as appropriate

## Builder Pattern
- Use for types with many optional fields
- `TypeBuilder::new(required).optional_field(val).build()`
- Typestate builders: `Builder<NoHost>` → `Builder<HasHost>` → `Config`
- `#[derive(typed_builder::TypedBuilder)]` for generated builders

## Trait Design
- Small, focused traits — one method per trait when possible
- `impl Trait` in return position for flexible return types
- Associated types over generic parameters when there's one logical choice
- `where` clauses for complex bounds — more readable than inline

## Common Anti-Patterns
- Raw primitives for domain concepts — easy to mix up
- `String` fields when an enum would be exhaustive
- God structs with 20 fields — decompose into sub-structs
- Trait objects when enums suffice — enums are faster and sized
- Marker traits without compiler enforcement
