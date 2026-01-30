#!/usr/bin/env node
// Generates Homebrew formula files from tool metadata and built binaries.
// Called by the release workflow after binaries are built.
//
// Usage: node scripts/update-tap.mjs <tap-dir>

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const tapDir = process.argv[2];
if (!tapDir) {
  console.error("Usage: node scripts/update-tap.mjs <tap-dir>");
  process.exit(1);
}

const root = join(import.meta.dirname, "..");
const toolsDir = join(root, "tools");
const distDir = join(root, "dist");

function sha256hex(filePath) {
  const data = readFileSync(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function toPascalCase(name) {
  return name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

// toolbox target -> homebrew platform blocks
const PLATFORM_MAP = {
  "darwin-arm64": { os: "macos", arch: "arm" },
  "darwin-x64": { os: "macos", arch: "intel" },
  "linux-arm64": { os: "linux", arch: "arm" },
  "linux-x64": { os: "linux", arch: "intel" },
};

// Extra `depends_on` lines per tool binary name.
const EXTRA_DEPS = {
  "voice-memos": ["depends_on :macos"],
  "transcribe-audio": ['depends_on "ffmpeg"', 'depends_on "whisper-cpp"'],
};

for (const toolName of readdirSync(toolsDir)) {
  const pkgPath = join(toolsDir, toolName, "package.json");
  if (!existsSync(pkgPath)) continue;

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const { binary, targets } = pkg.toolbox || {};
  if (!binary || !targets?.length) continue;

  const version = pkg.version;
  const desc = pkg.description || `${binary} CLI tool`;

  // Group targets by OS.
  const byOS = {};
  for (const target of targets) {
    const pm = PLATFORM_MAP[target];
    if (!pm) continue;

    const distPath = join(distDir, `${binary}-${target}`);
    let hash;
    try {
      hash = sha256hex(distPath);
    } catch {
      hash = "PLACEHOLDER";
    }

    if (!byOS[pm.os]) byOS[pm.os] = [];
    byOS[pm.os].push({ arch: pm.arch, target, hash });
  }

  const lines = [];
  lines.push(`class ${toPascalCase(binary)} < Formula`);
  lines.push(`  desc "${desc}"`);
  lines.push(`  homepage "https://github.com/aliou/toolbox"`);
  lines.push(`  version "${version}"`);
  lines.push(`  license "MIT"`);
  lines.push("");

  for (const dep of EXTRA_DEPS[binary] || []) {
    lines.push(`  ${dep}`);
  }
  lines.push("");

  const osKeys = Object.keys(byOS);
  const singleOS = osKeys.length === 1;

  for (const os of osKeys) {
    if (!singleOS) {
      lines.push(`  on_${os} do`);
    }

    const indent = singleOS ? "  " : "    ";
    for (const entry of byOS[os]) {
      lines.push(`${indent}on_${entry.arch} do`);
      lines.push(
        `${indent}  url "https://github.com/aliou/toolbox/releases/download/${binary}@${version}/${binary}-${entry.target}", using: :nounzip`,
      );
      lines.push(`${indent}  sha256 "${entry.hash}"`);
      lines.push(`${indent}end`);
      lines.push("");
    }

    if (!singleOS) {
      lines.push("  end");
      lines.push("");
    }
  }

  lines.push("  def install");
  lines.push(`    bin.install Dir["*"].first => "${binary}"`);
  lines.push("  end");
  lines.push("");
  lines.push("  test do");
  lines.push(
    `    assert_match version.to_s, shell_output("\#{bin}/${binary} --version")`,
  );
  lines.push("  end");
  lines.push("end");
  lines.push("");

  const formulaPath = join(tapDir, "Formula", `${binary}.rb`);
  writeFileSync(formulaPath, lines.join("\n"));
  console.log(`Updated ${formulaPath}`);
}
