import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import pc from "picocolors";
import { CACHE_DIR, getModelPath, MODEL_NAME, MODEL_URL } from "./config";

export async function ensureModel(): Promise<string> {
  const modelPath = getModelPath();

  if (existsSync(modelPath)) {
    return modelPath;
  }

  console.error(pc.yellow(`Downloading model: ${MODEL_NAME} - about 547MB`));
  console.error(pc.dim("(This only happens once)"));

  mkdirSync(CACHE_DIR, { recursive: true });

  try {
    const response = await fetch(MODEL_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(modelPath, new Uint8Array(buffer));

    console.error(pc.green("Model downloaded"));
    return modelPath;
  } catch (error) {
    console.error(pc.red("Error: Failed to download model"));
    if (existsSync(modelPath)) {
      await Bun.file(modelPath).delete();
    }
    throw error;
  }
}
