# transcribe-audio

Transcribe audio files to text using Whisper. Supports any audio format.

## When to use

- User wants to transcribe audio or voice recordings to text
- User wants to convert speech to text from any audio format
- Used after `voice-memos select` to transcribe selected memos

## Usage

```bash
# Transcribe to stdout
transcribe-audio recording.m4a

# Translate non-English audio to English
transcribe-audio -t french-audio.m4a

# Save transcripts to a directory
transcribe-audio -o ./transcripts *.m4a

# Pipe from voice-memos
voice-memos select | xargs transcribe-audio
transcribe-audio -o ./transcripts $(voice-memos select)
```

## Notes

- First run downloads the Whisper model (~547MB), cached in `~/.cache/whisper/`
- Override cache location with `TRANSCRIBE_CACHE_DIR` env var
- Requires `ffmpeg` and `whisper-cli` on PATH (included in Nix package)
- Supports any audio format that ffmpeg can handle (m4a, mp3, wav, etc.)
