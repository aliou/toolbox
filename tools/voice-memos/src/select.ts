import * as p from "@clack/prompts";
import pc from "picocolors";
import type { VoiceMemo } from "./database";

export async function selectMemos(memos: VoiceMemo[]): Promise<string[]> {
  if (memos.length === 0) {
    console.error(pc.red("Error: No voice memos found"));
    process.exit(1);
  }

  const options = memos.map((memo) => ({
    value: memo.path,
    label: memo.label,
    hint: `${memo.duration} - ${memo.recordedAt}`,
  }));

  const result = await p.multiselect({
    message: "Select voice memos:",
    options,
    required: false,
  });

  if (p.isCancel(result)) {
    return [];
  }

  return result as string[];
}
