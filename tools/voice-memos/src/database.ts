import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { APPLE_EPOCH_OFFSET, getDbPath, VOICE_MEMOS_DIR } from "./config";

export interface VoiceMemoRow {
  path: string;
  label: string | null;
  duration: number;
  apple_date: number;
}

export interface VoiceMemo {
  path: string;
  label: string;
  duration: string;
  recordedAt: string;
  exists: boolean;
}

function formatDuration(seconds: number): string {
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function appleToDatetime(appleTs: number): Date {
  const unixTs = appleTs + APPLE_EPOCH_OFFSET;
  return new Date(unixTs * 1000);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function queryMemos(): VoiceMemo[] {
  const dbPath = getDbPath();

  if (!existsSync(dbPath)) {
    throw new Error(`Voice Memos database not found: ${dbPath}`);
  }

  const db = new Database(dbPath, { readonly: true });

  const query = `
    SELECT ZPATH as path, ZCUSTOMLABEL as label, ZDURATION as duration, ZDATE as apple_date
    FROM ZCLOUDRECORDING
    WHERE ZPATH IS NOT NULL
    ORDER BY ZDATE DESC
  `;

  const rows = db.query<VoiceMemoRow, []>(query).all();
  db.close();

  return rows
    .map((row) => {
      const filePath = join(VOICE_MEMOS_DIR, row.path);
      const recordedAt = appleToDatetime(row.apple_date);

      return {
        path: filePath,
        label: row.label || "Untitled",
        duration: formatDuration(row.duration),
        recordedAt: formatDate(recordedAt),
        exists: existsSync(filePath),
      };
    })
    .filter((memo) => memo.exists);
}
