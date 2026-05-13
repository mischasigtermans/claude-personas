# Serde

## Derive Hierarchy
1. `#[derive(Serialize, Deserialize)]`: always try first
2. Attributes (`#[serde(...)]`): handle 95% of customization
3. Custom impl: last resort, only when derive + attributes can't express it

## Common Attributes
- `#[serde(rename_all = "camelCase")]`: field naming
- `#[serde(rename = "type")]`: single field rename
- `#[serde(default)]`: use Default when field missing
- `#[serde(skip)]`: exclude from serialization
- `#[serde(skip_serializing_if = "Option::is_none")]`: omit None fields
- `#[serde(deny_unknown_fields)]`: catch typos in config
- `#[serde(transparent)]`: newtype wrapper serializes as inner type
- `#[serde(with = "module")]`: custom serialization for one field
- `#[serde(untagged)]`: enum without type discriminator

## Enum Representations
- **Externally tagged** (default): `{"Variant": {...}}`, rarely what APIs want
- **Internally tagged**: `#[serde(tag = "type")]` → `{"type": "Variant", ...}`, most REST APIs
- **Adjacently tagged**: `#[serde(tag = "t", content = "c")]` → `{"t": "Variant", "c": {...}}`
- **Untagged**: tries each variant in order, hidden ordering dependency

## Performance Notes
- `#[serde(flatten)]` causes 50-300% deserialization overhead (internal buffering)
- `flatten` is incompatible with `deny_unknown_fields`
- `#[serde(untagged)]` tries variants sequentially, O(n) on number of variants
- Large `#[serde(default)]` structs re-construct Default on every deserialization

## Common Anti-Patterns
- Custom Deserialize impl for something attributes handle
- `flatten` in hot deserialization paths without measuring
- Untagged enum where order of variants affects correctness
- Missing `deny_unknown_fields` on config types
- `#[serde(skip)]` on fields that should use `#[serde(default)]`
- Thread-local state hacks to pass data outside serde's data model
