import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pc from "picocolors";

async function runCommand(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

function generateTempPath(suffix: string): string {
  const rand = Math.random().toString(36).substring(2, 15);
  return join(tmpdir(), `whisper_${rand}${suffix}`);
}

export async function transcribeFile(
  input: string,
  modelPath: string,
  translate: boolean,
): Promise<string> {
  if (!existsSync(input)) {
    throw new Error(`File not found: ${input}`);
  }

  const tempWav = generateTempPath(".wav");
  const tempOut = generateTempPath("");

  try {
    // Convert to 16kHz mono WAV
    const ffmpegResult = await runCommand("ffmpeg", [
      "-y",
      "-i",
      input,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      tempWav,
      "-loglevel",
      "error",
    ]);

    if (ffmpegResult.code !== 0) {
      throw new Error(`ffmpeg failed: ${ffmpegResult.stderr}`);
    }

    // Run whisper
    const whisperArgs = [
      "-m",
      modelPath,
      "-f",
      tempWav,
      "-l",
      "auto",
      ...(translate ? ["--translate"] : []),
      "--output-txt",
      "-of",
      tempOut,
    ];

    const whisperResult = await runCommand("whisper-cli", whisperArgs);

    const txtFile = `${tempOut}.txt`;
    if (!existsSync(txtFile)) {
      throw new Error(
        `Transcription failed: ${whisperResult.stderr || "output file not created"}`,
      );
    }

    const transcript = await Bun.file(txtFile).text();

    // Cleanup temp files
    if (existsSync(tempWav)) await Bun.file(tempWav).delete();
    if (existsSync(tempOut)) await Bun.file(tempOut).delete();
    if (existsSync(txtFile)) await Bun.file(txtFile).delete();

    return transcript.trim();
  } catch (error) {
    // Cleanup on error
    if (existsSync(tempWav)) await Bun.file(tempWav).delete();
    if (existsSync(tempOut)) await Bun.file(tempOut).delete();
    if (existsSync(`${tempOut}.txt`)) await Bun.file(`${tempOut}.txt`).delete();

    console.error(pc.red(`Error: Failed to transcribe ${input}`));
    throw error;
  }
}
