#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
import { createParser } from "@aliou/toolbox-cli";
import pc from "picocolors";
import { ensureModel } from "./src/model";
import { transcribeFile } from "./src/transcribe";

function showHelp(): void {
  console.log(`
${pc.bold("transcribe-audio")} - Transcribe audio files using Whisper

${pc.bold("USAGE:")}
  transcribe-audio [options] <file>...

${pc.bold("OPTIONS:")}
  -o, --output <dir>  Write .txt files to directory (omit or use "-" for stdout)
  -t, --translate     Translate to English
  -h, --help          Show this help message
  -v, --version       Show version

${pc.bold("EXAMPLES:")}
  transcribe-audio recording.m4a
  transcribe-audio -t french-audio.m4a
  transcribe-audio -o ./transcripts *.m4a
  voice-memos select | xargs transcribe-audio

${pc.bold("NOTES:")}
  - First run downloads the model (~547MB)
  - Model cached in ~/.cache/whisper/ (or $TRANSCRIBE_CACHE_DIR)
  - Supports any audio format via ffmpeg

${pc.bold("ENVIRONMENT VARIABLES:")}
  TRANSCRIBE_CACHE_DIR  Override cache directory (default: ~/.cache/whisper)
`);
}

const parser = createParser({
  options: {
    output: { type: "string", short: "o" },
    translate: { type: "boolean", short: "t" },
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
  },
  strict: false,
  defaultCommand: "__transcribe__",
});

async function main() {
  const result = parser.parse(process.argv.slice(2));

  if (!result.success) {
    console.error(pc.red("Error:"), result.error);
    console.log(pc.dim('Run "transcribe-audio --help" for usage information.'));
    process.exit(1);
  }

  const { command, values, positionals } = result;

  if (values.help) {
    showHelp();
    process.exit(0);
  }

  if (values.version) {
    const pkg = await import("./package.json");
    console.log(`transcribe-audio v${pkg.version}`);
    process.exit(0);
  }

  // Collect files: if command is not our default, treat it as the first file
  const files =
    command && command !== "__transcribe__"
      ? [command, ...positionals]
      : positionals;

  if (files.length === 0) {
    console.error(pc.red("Error: No files specified"));
    showHelp();
    process.exit(1);
  }

  const toStdout = !values.output || values.output === "-";

  // Validate output directory if specified
  if (!toStdout) {
    if (values.output === "") {
      console.error(pc.red("Error: -o requires a directory argument"));
      process.exit(1);
    }
    mkdirSync(values.output, { recursive: true });
  }

  // Download model if needed
  const modelPath = await ensureModel();

  // Process each file
  for (const file of files) {
    if (!existsSync(file)) {
      console.error(pc.red(`Error: File not found: ${file}`));
      continue;
    }

    try {
      const transcript = await transcribeFile(
        file,
        modelPath,
        values.translate || false,
      );

      if (!transcript) {
        continue;
      }

      if (toStdout) {
        console.log(transcript);
      } else {
        const name = basename(file).replace(/\.[^.]+$/, "");
        const outFile = `${values.output}/${name}.txt`;
        await Bun.write(outFile, transcript);
        console.error(pc.green(`Done: ${outFile}`));
      }
    } catch (error) {
      console.error(pc.red(`Error processing ${file}:`), error);
    }
  }
}

main().catch((error) => {
  console.error(pc.red("Fatal error:"), error);
  process.exit(1);
});
