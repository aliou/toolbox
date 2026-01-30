# transcribe-audio

Transcribe audio files using Whisper.

## Features

- Transcribe audio files using whisper.cpp
- Auto-download Whisper model on first run (~547MB)
- Support for any audio format (via ffmpeg)
- Optional translation to English
- Output to stdout or files

## Installation

```bash
nix profile install github:aliou/toolbox#transcribe-audio
```

Or via Home Manager:

```nix
programs.toolbox = {
  enable = true;
  transcribeAudio.enable = true;
};
```

## Usage

```bash
# Transcribe single file (output to stdout)
transcribe-audio recording.m4a

# Translate to English
transcribe-audio -t french-audio.m4a

# Save to directory
transcribe-audio -o ./transcripts *.m4a

# Use with voice-memos
voice-memos select | xargs transcribe-audio
```

## Dependencies

- **ffmpeg** (for audio conversion)
- **whisper-cli** (from whisper.cpp)

Both are automatically included in the Nix package.

## Environment Variables

- `TRANSCRIBE_CACHE_DIR`: Override cache directory (default: `~/.cache/whisper`)

## How it works

1. Downloads the Whisper large-v3-turbo model on first run
2. Converts input audio to 16kHz mono WAV (via ffmpeg)
3. Runs whisper-cli for transcription
4. Returns transcribed text

## Technical Details

- **Model**: ggml-large-v3-turbo-q5_0 (quantized, ~547MB)
- **Cached**: Models stored in `~/.cache/whisper/`
- **Audio conversion**: ffmpeg handles all format conversions
- **Transcription**: whisper.cpp CLI for processing
