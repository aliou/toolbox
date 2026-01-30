#!/usr/bin/env bun

import { createParser } from "@aliou/toolbox-cli";
import pc from "picocolors";
import { queryMemos } from "./src/database";
import { selectMemos } from "./src/select";

function showHelp(): void {
  console.log(`
${pc.bold("voice-memos")} - List and select Apple Voice Memos

${pc.bold("USAGE:")}
  voice-memos [command] [options]

${pc.bold("COMMANDS:")}
  list (default)      List all memos
  select              Select memos interactively, returns paths

${pc.bold("OPTIONS:")}
  -j, --json          Output as JSON (list only)
  -h, --help          Show this help message
  -v, --version       Show version

${pc.bold("EXAMPLES:")}
  voice-memos list
  voice-memos list --json
  voice-memos select | xargs transcribe-audio
  transcribe-audio -o ./transcripts $(voice-memos select)
`);
}

const parser = createParser({
  options: {
    json: { type: "boolean", short: "j" },
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
  },
  defaultCommand: "list",
  strict: true,
});

async function commandList(json: boolean) {
  const memos = queryMemos();

  if (json) {
    console.log(JSON.stringify(memos, null, 2));
  } else {
    // Print as table
    console.log(
      pc.dim("PATH") +
        "\t" +
        pc.dim("LABEL") +
        "\t" +
        pc.dim("DURATION") +
        "\t" +
        pc.dim("RECORDED AT"),
    );
    for (const memo of memos) {
      console.log(
        `${memo.path}\t${memo.label}\t${memo.duration}\t${memo.recordedAt}`,
      );
    }
  }
}

async function commandSelect() {
  const memos = queryMemos();
  const paths = await selectMemos(memos);

  if (paths.length === 0) {
    process.exit(0);
  }

  // Output selected paths (one per line)
  console.log(paths.join("\n"));
}

async function main() {
  const result = parser.parse(process.argv.slice(2));

  if (!result.success) {
    console.error(pc.red("Error:"), result.error);
    console.log(pc.dim('Run "voice-memos --help" for usage information.'));
    process.exit(1);
  }

  const { command, values } = result;

  if (values.help) {
    showHelp();
    process.exit(0);
  }

  if (values.version) {
    const pkg = await import("./package.json");
    console.log(`voice-memos v${pkg.version}`);
    process.exit(0);
  }

  try {
    if (command === "list") {
      await commandList(values.json || false);
    } else if (command === "select") {
      await commandSelect();
    } else {
      console.error(pc.red(`Unknown command: ${command}`));
      console.log(pc.dim('Run "voice-memos --help" for usage information.'));
      process.exit(1);
    }
  } catch (error) {
    console.error(pc.red("Error:"), error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(pc.red("Fatal error:"), error);
  process.exit(1);
});
