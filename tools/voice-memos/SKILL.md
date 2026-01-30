# voice-memos

List and select Apple Voice Memos from the command line. macOS only.

## When to use

- User wants to list their voice memos
- User wants to select voice memos for processing (e.g., transcription)
- User needs file paths to voice memo recordings

## Commands

### List memos

```bash
voice-memos list          # table output
voice-memos list --json   # JSON output
```

### Select memos interactively

```bash
voice-memos select
```

Returns selected file paths, one per line. Designed for piping:

```bash
voice-memos select | xargs transcribe-audio
transcribe-audio -o ./transcripts $(voice-memos select)
```

## Notes

- Only works on macOS (reads the Apple Voice Memos SQLite database)
- Shows label, duration, and recording date for each memo
- Filters out memos whose audio files no longer exist on disk
