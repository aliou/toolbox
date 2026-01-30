# voice-memos

List and select Apple Voice Memos (macOS only).

## Features

- Query Voice Memos database directly
- List all memos with metadata (label, duration, recorded date)
- Interactive multi-selection with arrow keys and spacebar
- Output as paths or JSON
- Integrates with transcribe-audio

## Installation

```bash
nix profile install github:aliou/toolbox#voice-memos
```

Or via Home Manager:

```nix
programs.toolbox = {
  enable = true;
  voiceMemos.enable = true;
};
```

## Usage

```bash
# List all memos
voice-memos list

# List as JSON
voice-memos list --json

# Select memos interactively
voice-memos select

# Pipe to transcribe-audio
voice-memos select | xargs transcribe-audio
transcribe-audio -o ./transcripts $(voice-memos select)
```

## Dependencies

- macOS Voice Memos app (built-in on macOS)

## Database Location

Reads from:
```
~/Library/Group Containers/group.com.apple.VoiceMemos.shared/Recordings/CloudRecordings.db
```

## How it works

1. Queries the Voice Memos SQLite database
2. Converts Apple Core Data timestamps to readable dates
3. Filters for existing files only
4. Interactive selection via @clack/prompts (multi-select with spacebar, confirm with enter)
