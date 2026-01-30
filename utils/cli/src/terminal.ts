import { spawn } from "node:child_process";

/**
 * Check if running in an interactive terminal (not piped, not CI).
 * Use this to decide whether to show interactive UI elements or raw output.
 */
export function isInteractive(): boolean {
  return Boolean(process.stdout.isTTY && !process.env.CI);
}

/**
 * Get terminal width, with fallback for non-TTY environments.
 */
export function getTerminalWidth(fallback = 80): number {
  return process.stdout.columns || fallback;
}

/**
 * Output content through a pager (less) if interactive, otherwise print directly.
 * Handles SIGPIPE gracefully when user quits pager early.
 */
export async function pagerOutput(content: string): Promise<void> {
  if (!isInteractive()) {
    console.log(content);
    return;
  }

  const pager = process.env.PAGER || "less";
  const pagerArgs = pager === "less" ? ["-R"] : [];

  return new Promise((resolve, reject) => {
    const child = spawn(pager, pagerArgs, {
      stdio: ["pipe", "inherit", "inherit"],
    });

    let writeError = false;

    child.stdin.on("error", (err: NodeJS.ErrnoException) => {
      // EPIPE is expected when user quits pager early (e.g., pressing 'q')
      if (err.code === "EPIPE") {
        writeError = true;
        return;
      }
      reject(err);
    });

    child.on("close", (code) => {
      // Don't treat early quit as an error
      if (writeError || code === 0) {
        resolve();
      } else {
        // Pager exited with error - fall back to direct output
        console.log(content);
        resolve();
      }
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      // Pager not found - fall back to direct output
      if (err.code === "ENOENT") {
        console.log(content);
        resolve();
        return;
      }
      reject(err);
    });

    child.stdin.write(content);
    child.stdin.end();
  });
}
