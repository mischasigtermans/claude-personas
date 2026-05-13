# Ownership & Borrowing

## Function Signatures
- Accept `&str` not `&String`
- Accept `&[T]` not `&Vec<T>`
- Accept `&Path` not `&PathBuf`
- Accept `&T` not `&Box<T>`
- Borrow when you only read, own when you store
- Use `impl AsRef<str>` or `impl Into<String>` for flexible APIs

## Clone Rules
- Every `.clone()` should be justified
- Clone to satisfy the borrow checker = bad ownership model
- Clone `Arc<T>` is cheap (reference count bump), usually fine
- Clone `String`, `Vec<T>`, `HashMap` is expensive, avoid in hot paths
- `Cow<'_, str>` avoids clone-or-borrow decisions

## Lifetime Patterns
- Prefer elided lifetimes when the compiler can infer
- Named lifetimes only when the compiler needs help
- `'static` means "can live forever", not "lives in static memory"
- Structs with references need lifetimes, consider owning the data instead

## Cow (Clone on Write)
- `Cow<'_, str>`, borrowed by default, clones only when mutation needed
- Good for functions that sometimes modify, sometimes pass through
- `impl Into<Cow<'_, str>>` accepts both `&str` and `String`

## Option/Result Borrowing
- `option.as_ref()` borrows through Option: `Option<T>` → `Option<&T>`
- `option.as_deref()` for `Option<String>` → `Option<&str>`
- `result.as_ref()` borrows through Result
- Never `option.clone().unwrap()`, use `option.as_ref().unwrap()`

## Common Anti-Patterns
- Cloning in a loop when a reference works
- Taking `String` parameter just to call `.as_str()` inside
- Collecting into Vec just to iterate once, use iterators
- `Arc<Mutex<T>>` when channels would be cleaner
- Returning `String` from a function that only reformats input, return `Cow`
