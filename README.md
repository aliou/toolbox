# toolbox

CLI tools built with Bun, distributed as pre-built binaries via GitHub Releases and Nix flakes.

## Tools

| Tool | Description | Platforms |
|------|-------------|-----------|
| [voice-memos](./tools/voice-memos/) | List and select Apple Voice Memos | macOS |
| [transcribe-audio](./tools/transcribe-audio/) | Transcribe audio files using Whisper | macOS, Linux |

## Installation

### Nix flake

```nix
# flake.nix
{
  inputs.toolbox.url = "github:aliou/toolbox";

  # Use individual packages
  environment.systemPackages = [
    inputs.toolbox.packages.${system}.voice-memos
    inputs.toolbox.packages.${system}.transcribe-audio
  ];
}
```

### Home Manager

```nix
{
  imports = [ inputs.toolbox.homeManagerModules.default ];

  programs.toolbox = {
    enable = true;
    voiceMemos.enable = true;
    transcribeAudio.enable = true;
  };
}
```

### GitHub Releases

Download pre-built binaries from [Releases](https://github.com/aliou/toolbox/releases).

## Development

```bash
# Enter dev shell (requires Nix with flakes)
nix develop

# Install dependencies
bun install

# Run a tool
bun run tools/voice-memos/index.ts

# Run tests
bun test

# Lint
bun run lint
```

## Releasing

This project uses [changesets](https://github.com/changesets/changesets) for version management.

```bash
# Add a changeset
bun changeset

# The release workflow handles the rest:
# 1. Bumps versions via changeset version
# 2. Cross-compiles binaries for all platforms
# 3. Updates Nix hashes
# 4. Commits everything in a single commit
# 5. Creates GitHub Releases with binaries
```
