# Rust Anti-Patterns

Code smells David would flag immediately. Each includes the transformation.

---

## Error Handling Anti-Patterns

### 1. anyhow in Library Public APIs
```rust
// Anti-pattern
pub fn parse_config(path: &Path) -> anyhow::Result<Config> {
    let content = std::fs::read_to_string(path)?;
    Ok(serde_json::from_str(&content)?)
}

// Idiomatic
#[derive(thiserror::Error, Debug)]
pub enum ConfigError {
    #[error("failed to read config file")]
    Io(#[from] std::io::Error),
    #[error("invalid config format")]
    Parse(#[from] serde_json::Error),
}

pub fn parse_config(path: &Path) -> Result<Config, ConfigError> {
    let content = std::fs::read_to_string(path)?;
    Ok(serde_json::from_str(&content)?)
}
```
> "anyhow is for applications. thiserror is for libraries."

### 2. Bare Error Propagation Without Context
```rust
// Anti-pattern
fn load_instructions(path: &Path) -> anyhow::Result<Vec<Instruction>> {
    let content = std::fs::read(path)?;  // "No such file or directory"
    Ok(parse(&content)?)
}

// Idiomatic
fn load_instructions(path: &Path) -> anyhow::Result<Vec<Instruction>> {
    let content = std::fs::read(path)
        .with_context(|| format!("failed to read instructions from {}", path.display()))?;
    let instrs = parse(&content).context("failed to parse instruction file")?;
    Ok(instrs)
}
```
> "A bare IO error is useless. Context tells you what operation failed."

### 3. Box<dyn Error> in Public APIs
```rust
// Anti-pattern
pub fn fetch_data() -> Result<Data, Box<dyn std::error::Error>> {
    // ...
}

// Idiomatic
#[derive(thiserror::Error, Debug)]
pub enum FetchError {
    #[error("network timeout after {0:?}")]
    Timeout(Duration),
    #[error("authentication failed")]
    Auth(#[source] AuthError),
}

pub fn fetch_data() -> Result<Data, FetchError> {
    // ...
}
```
> "The caller shouldn't need to downcast."

### 4. Umbrella Error Enums
```rust
// Anti-pattern: one error type for an entire crate
pub enum Error {
    ConfigParse(serde_json::Error),
    NetworkTimeout,
    DatabaseConnection(String),
    FileNotFound(PathBuf),
    InvalidInput(String),
    // ... 10 more variants
}

pub fn read_config() -> Result<Config, Error> { /* can only return 2 of 15 variants */ }

// Idiomatic: per-function or per-module error types
pub enum ConfigError {
    Parse(serde_json::Error),
    NotFound(PathBuf),
}
```
> "Callers are forced to match on variants that can never occur."

### 5. Manual Error Boilerplate
```rust
// Anti-pattern: 30+ lines of Display, Error, From impls
impl std::fmt::Display for AppError { /* ... */ }
impl std::error::Error for AppError { /* ... */ }
impl From<std::io::Error> for AppError { /* ... */ }

// Idiomatic
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("IO error")]
    Io(#[from] std::io::Error),
    #[error("parse error")]
    Parse(#[from] serde_json::Error),
}
```
> "thiserror generates identical code."

---

## Ownership Anti-Patterns

### 6. Cloning to Satisfy the Borrow Checker
```rust
// Anti-pattern
let mut data = get_data();
let snapshot = data.clone();
process(&snapshot);
data.mutate();

// Idiomatic: restructure borrows
let data = get_data();
process(&data);
let mut data = data;
data.mutate();
```
> "If you're cloning to satisfy the borrow checker, you're modeling ownership wrong."

### 7. &String Instead of &str
```rust
// Anti-pattern
fn process(input: &String) { /* ... */ }
process(&"hello".to_string());  // forced allocation

// Idiomatic
fn process(input: &str) { /* ... */ }
process("hello");          // zero-cost
process(&my_string);       // deref coercion
```
> Same applies: `&[T]` over `&Vec<T>`, `&Path` over `&PathBuf`, `&T` over `&Box<T>`.

### 8. Taking Ownership When Borrowing Suffices
```rust
// Anti-pattern
fn validate(config: Config) -> bool {
    config.port > 0 && !config.host.is_empty()
}
// caller must clone: validate(config.clone())

// Idiomatic
fn validate(config: &Config) -> bool {
    config.port > 0 && !config.host.is_empty()
}
```
> "Borrow. The caller shouldn't pay for ownership you don't need."

### 9. Cloning Option Contents
```rust
// Anti-pattern
if selection.is_some() {
    let val = selection.clone().unwrap();
    process(&val);
}

// Idiomatic
if let Some(val) = selection.as_ref() {
    process(val);
}
```

---

## Unwrap Anti-Patterns

### 10. Unwrap on User Input
```rust
// Anti-pattern
let port: u16 = args[1].parse().unwrap();

// Idiomatic
let port: u16 = args[1].parse()
    .context("invalid port number")?;
```
> "This panics on user input. Return a Result."

### 11. Unwrap in Library Code
```rust
// Anti-pattern
pub fn parse_duration(s: &str) -> Duration {
    let secs: u64 = s.parse().unwrap();
    Duration::from_secs(secs)
}

// Idiomatic
pub fn parse_duration(s: &str) -> Result<Duration, ParseIntError> {
    let secs: u64 = s.parse()?;
    Ok(Duration::from_secs(secs))
}
```
> "A library that panics on bad input is a library nobody trusts."

### 12. When Unwrap IS Acceptable
```rust
// FINE: programmer-controlled static input
let re = Regex::new(r"^\d{4}-\d{2}-\d{2}$").unwrap();

// FINE: invariant just established
match items.len() {
    0 => Default::default(),
    1 => items.pop().unwrap(),
    _ => merge(items),
}
```
> "Unwrap is fine when panicking would indicate a bug in YOUR code, not your user's input."

---

## Serde Anti-Patterns

### 13. Custom Deserialize When Attributes Suffice
```rust
// Anti-pattern: 50-line visitor implementation
impl<'de> Deserialize<'de> for Config {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where D: Deserializer<'de> { /* 50 lines of visitor pattern */ }
}

// Idiomatic
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Config {
    api_key: String,
    max_retries: u32,
}
```
> "The derive handles this."

### 14. Flatten Performance Trap
```rust
// Caution: flatten causes 50-300% deserialization overhead
#[derive(Deserialize)]
struct Request {
    id: String,
    #[serde(flatten)]
    metadata: HashMap<String, Value>,
}

// Better: enumerate known fields
#[derive(Deserialize)]
struct Request {
    id: String,
    source: Option<String>,
    timestamp: Option<String>,
}
```
> "`flatten` triggers internal buffering. Measure before using it in hot paths."

### 15. Wrong Enum Representation
```rust
// Default externally tagged: {"Request": {"id": "..."}}
// Usually not what JSON APIs expect

// Internally tagged for REST APIs:
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum Message {
    Request { id: String, method: String },
    Response { id: String, result: Value },
}
// Produces: {"type": "Request", "id": "...", "method": "..."}
```

### 16. Missing deny_unknown_fields
```rust
// Anti-pattern: silently ignores typos
#[derive(Deserialize)]
struct Config {
    host: String,
    port: u16,
}
// {"host": "localhost", "prot": 8080}  -- typo silently ignored

// Idiomatic for strict APIs
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Config {
    host: String,
    port: u16,
}
```

---

## Proc Macro Anti-Patterns

### 17. Panicking Instead of compile_error!
```rust
// Anti-pattern: useless error message
#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -> TokenStream {
    let ast = syn::parse(input).unwrap();  // "proc macro panicked"
    // ...
}

// Idiomatic: error with span information
#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -> TokenStream {
    let ast = syn::parse_macro_input!(input as DeriveInput);
    match impl_my_derive(&ast) {
        Ok(tokens) => tokens.into(),
        Err(err) => err.to_compile_error().into(),
    }
}
```
> "compile_error! with proper spans points to the exact problematic token. panic! points nowhere useful."

### 18. String-Based Token Generation
```rust
// Anti-pattern: building code as strings
let code = format!("impl {} for {} {{ }}", trait_name, struct_name);
code.parse().unwrap()

// Idiomatic: use quote
quote! {
    impl #trait_name for #struct_name {}
}
```

---

## Type System Anti-Patterns

### 19. Boolean Parameters
```rust
// Anti-pattern
fn process(data: &[u8], compressed: bool, encrypted: bool) { /* ... */ }
process(&data, true, false);  // what do true and false mean?

// Idiomatic: enums
enum Compression { None, Gzip, Zstd }
enum Encryption { None, Aes256 }
fn process(data: &[u8], compression: Compression, encryption: Encryption) { /* ... */ }
```
> "Booleans at call sites are unreadable. Enums document intent."

### 20. Stringly-Typed APIs
```rust
// Anti-pattern
fn set_log_level(level: &str) { /* ... */ }
set_log_level("deubg");  // typo compiles fine

// Idiomatic
enum LogLevel { Debug, Info, Warn, Error }
fn set_log_level(level: LogLevel) { /* ... */ }
```
> "The type system can enforce this at compile time."

### 21. Runtime Checks for Compile-Time Invariants
```rust
// Anti-pattern
struct Port(u16);
impl Port {
    fn new(value: u16) -> Result<Self, Error> {
        if value == 0 { return Err(Error::InvalidPort); }
        Ok(Port(value))
    }
}

// Consider: NonZeroU16 makes zero unrepresentable
use std::num::NonZeroU16;
struct Port(NonZeroU16);
```
> "Make invalid states unrepresentable."

---

## Dependency Anti-Patterns

### 22. Heavy Dependencies for Simple Tasks
```rust
// Anti-pattern: pulling in regex for a fixed pattern check
// Cargo.toml: regex = "1"
fn is_hex(s: &str) -> bool {
    regex::Regex::new(r"^[0-9a-fA-F]+$").unwrap().is_match(s)
}

// Idiomatic: standard library
fn is_hex(s: &str) -> bool {
    !s.is_empty() && s.chars().all(|c| c.is_ascii_hexdigit())
}
```
> "Every dependency is a cost. Compile time, audit surface, supply chain risk."

### 23. Not Using std Traits
```rust
// Anti-pattern: custom conversion method
impl Config {
    fn to_string(&self) -> String { /* ... */ }
    fn from_str(s: &str) -> Config { /* ... */ }
}

// Idiomatic: implement standard traits
impl Display for Config { /* ... */ }
impl FromStr for Config { /* ... */ }
```
> "Implement std traits. The ecosystem composes through them."
