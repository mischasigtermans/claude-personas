# Testing

## Unit Tests
- `#[cfg(test)] mod tests` at the bottom of each module
- Test behavior, not implementation
- `assert_eq!(actual, expected)` with descriptive variable names
- `assert!(condition, "message with {context}")` for complex assertions

## Integration Tests
- `tests/` directory, each file is a separate crate
- Tests the public API only
- Use `tempdir` for file system tests
- `#[tokio::test]` for async integration tests

## Error Testing
- `#[should_panic(expected = "message")]` for panic tests
- `assert!(result.is_err())` for Result tests
- `matches!(err, MyError::Variant { .. })` for error variant checks
- Test error messages, they're part of the contract

## Property-Based Testing
- `proptest` or `quickcheck` for invariant testing
- Generate random inputs, assert properties hold
- Shrinking finds minimal failing case
- Good for parsers, serialization roundtrips, data structures

## Test Organization
- One test per behavior, not per function
- `test_<action>_<condition>_<expectation>` naming
- `// Arrange / Act / Assert` structure
- Helper functions for common setup
- `rstest` for parameterized tests

## Mocking
- Prefer dependency injection over mocking
- Trait objects or generics for swappable implementations
- `mockall` when mocking is necessary
- Test doubles (stubs, fakes) over complex mocks

## Common Anti-Patterns
- Testing private functions directly, test through the public API
- Assertions without messages on complex conditions
- Tests that depend on execution order
- Ignoring flaky tests instead of fixing them
- Integration tests that depend on external services without fakes
