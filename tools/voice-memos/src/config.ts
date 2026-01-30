import { homedir } from "node:os";
import { join } from "node:path";

export const VOICE_MEMOS_DIR = join(
  homedir(),
  "Library",
  "Group Containers",
  "group.com.apple.VoiceMemos.shared",
  "Recordings",
);

export const DB_FILE = "CloudRecordings.db";

// Apple Core Data epoch offset (seconds between Unix epoch and Apple epoch Jan 1, 2001)
export const APPLE_EPOCH_OFFSET = 978307200;

export function getDbPath(): string {
  return join(VOICE_MEMOS_DIR, DB_FILE);
}
