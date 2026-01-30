## Project

Public toolbox monorepo. CLI tools built with Bun, packaged via Nix flakes with pre-built binaries from GitHub releases.

## Structure

- `tools/` - CLI tools (each is a workspace package with its own `package.json`)
- `utils/` - shared workspace packages (e.g., `utils/cli`)
- `nix/` - Nix packaging (hashes, Home Manager modules)
- `scripts/` - CI helper scripts

## Tools

Each tool has a `toolbox` key in its `package.json` specifying:
- `binary`: the output binary name
- `targets`: bun cross-compilation targets (e.g., `darwin-arm64`, `linux-x64`)

## Versioning

Uses changesets. No npm publishing. Versions are bumped and binaries released to GitHub Releases.

## Nix

- `nix/hashes.json` stores per-tool, per-platform SHA256 hashes (SRI format)
- Hashes are updated automatically by the release workflow
- Home Manager modules in `nix/hm-modules/`
