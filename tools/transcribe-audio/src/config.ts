import { homedir } from "node:os";
import { join } from "node:path";

export const CACHE_DIR =
  process.env.TRANSCRIBE_CACHE_DIR || join(homedir(), ".cache", "whisper");

export const MODEL_NAME = "ggml-large-v3-turbo-q5_0.bin";

export const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin";

export function getModelPath(): string {
  return join(CACHE_DIR, MODEL_NAME);
}
