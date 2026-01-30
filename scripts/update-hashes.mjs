#!/usr/bin/env node

// Updates nix/hashes.json with SHA256 hashes (SRI format) from built binaries in dist/.
// Reads tool metadata from each tools/*/package.json.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const TARGET_TO_NIX = {
  "darwin-arm64": "aarch64-darwin",
  "darwin-x64": "x86_64-darwin",
  "linux-arm64": "aarch64-linux",
  "linux-x64": "x86_64-linux",
};

function sriHash(filePath) {
  const data = readFileSync(filePath);
  const hash = createHash("sha256").update(data).digest("base64");
  return `sha256-${hash}`;
}

const hashesPath = join("nix", "hashes.json");
const hashes = existsSync(hashesPath)
  ? JSON.parse(readFileSync(hashesPath, "utf8"))
  : {};

const toolsDir = "tools";
for (const entry of readdirSync(toolsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const pkgPath = join(toolsDir, entry.name, "package.json");
  if (!existsSync(pkgPath)) continue;

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const { binary, targets } = pkg.toolbox || {};
  if (!binary || !targets) continue;

  const toolHashes = {};
  for (const target of targets) {
    const binaryPath = join("dist", `${binary}-${target}`);
    const nixSystem = TARGET_TO_NIX[target];

    if (!nixSystem) {
      console.warn(`Unknown target: ${target}`);
      continue;
    }

    if (existsSync(binaryPath)) {
      toolHashes[nixSystem] = sriHash(binaryPath);
      console.log(`${binary} (${nixSystem}): ${toolHashes[nixSystem]}`);
    } else {
      console.warn(`Binary not found: ${binaryPath}`);
    }
  }

  hashes[binary] = {
    version: pkg.version,
    hashes: toolHashes,
  };
}

writeFileSync(hashesPath, JSON.stringify(hashes, null, 2) + "\n");
console.log(`Updated ${hashesPath}`);
