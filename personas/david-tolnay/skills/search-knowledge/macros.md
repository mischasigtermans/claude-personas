# Macros

## Derive Macros (Proc Macros)
- Use `syn` to parse input, `quote` to generate output
- All logic should use `proc_macro2` types for testability
- Convert `proc_macro::TokenStream` only at the entry point
- Return `compile_error!` with spans, never `panic!`

## syn Essentials
- `parse_macro_input!(input as DeriveInput)` — safe parsing
- `DeriveInput` gives you struct/enum name, generics, fields
- `syn::Error::new_spanned(tokens, "message")` — error pointing at exact tokens
- `.to_compile_error()` converts syn::Error to TokenStream

## quote Essentials
- `quote! { impl #name for #struct_name {} }` — quasi-quoting
- `#variable` interpolates, `##` escapes
- `#( #items )*` for repetition
- Always use `<#ty>::method()` not `#ty::method()` for turbofish safety

## Declarative Macros (macro_rules!)
- Prefer over proc macros for simple pattern matching
- `$($x:expr),*` for repeated expressions
- Use `$crate::` prefix for paths to avoid import issues
- `@` for internal rules to keep the macro organized

## When to Use Macros
- Derive macros: eliminating boilerplate trait impls
- Attribute macros: modifying existing code (test frameworks, async)
- Function-like macros: DSLs, compile-time computation
- macro_rules!: simple repetitive patterns

## When NOT to Use Macros
- When a function or generic would work
- When the generated code is hard to debug
- When compile time cost outweighs convenience
- When the macro is more complex than the code it generates

## Common Anti-Patterns
- `panic!` in proc macros — produces useless error messages
- `proc_macro::TokenStream` in library logic — untestable
- String concatenation to build code — use quote!
- Not handling generics — macro works for simple types, breaks on `Vec<T>`
- Missing `#[proc_macro_derive(Name)]` attribute
- Not testing macro output — write tests that compile the generated code
