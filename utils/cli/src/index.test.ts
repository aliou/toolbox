import { describe, expect, test } from "bun:test";
import { createParser } from "./index";

describe("createParser", () => {
  describe("boolean options", () => {
    test("parses boolean flag when present", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
      });
      const result = parser.parse(["--force"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.force).toBe(true);
      }
    });

    test("defaults boolean to false when absent", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.force).toBe(false);
      }
    });

    test("parses boolean with short alias", () => {
      const parser = createParser({
        options: { recursive: { type: "boolean", short: "r" } },
      });
      const result = parser.parse(["-r"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.recursive).toBe(true);
      }
    });
  });

  describe("string options", () => {
    test("parses string option", () => {
      const parser = createParser({
        options: { domain: { type: "string" } },
      });
      const result = parser.parse(["--domain", "example.com"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.domain).toBe("example.com");
      }
    });

    test("parses string with short alias", () => {
      const parser = createParser({
        options: { domain: { type: "string", short: "d" } },
      });
      const result = parser.parse(["-d", "example.com"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.domain).toBe("example.com");
      }
    });

    test("returns undefined for absent optional string", () => {
      const parser = createParser({
        options: { domain: { type: "string" } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.domain).toBeUndefined();
      }
    });

    test("fails on missing required string", () => {
      const parser = createParser({
        options: { domain: { type: "string", required: true } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Missing required option: --domain");
      }
    });

    test("parses --option=value syntax", () => {
      const parser = createParser({
        options: { domain: { type: "string" } },
      });
      const result = parser.parse(["--domain=example.com"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.domain).toBe("example.com");
      }
    });
  });

  describe("number options", () => {
    test("parses number option", () => {
      const parser = createParser({
        options: { port: { type: "number" } },
      });
      const result = parser.parse(["--port", "8080"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.port).toBe(8080);
      }
    });

    test("parses number with short alias", () => {
      const parser = createParser({
        options: { limit: { type: "number", short: "l" } },
      });
      const result = parser.parse(["-l", "10"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.limit).toBe(10);
      }
    });

    test("returns undefined for absent optional number", () => {
      const parser = createParser({
        options: { port: { type: "number" } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.port).toBeUndefined();
      }
    });

    test("fails on invalid number", () => {
      const parser = createParser({
        options: { port: { type: "number" } },
      });
      const result = parser.parse(["--port", "not-a-number"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid number for --port: "not-a-number"');
      }
    });

    test("fails on missing required number", () => {
      const parser = createParser({
        options: { port: { type: "number", required: true } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Missing required option: --port");
      }
    });
  });

  describe("enum options", () => {
    const agents = [
      "claude-code",
      "amp",
      "codex",
      "cursor",
      "opencode",
    ] as const;

    test("parses valid enum value", () => {
      const parser = createParser({
        options: { agent: { type: "enum", values: agents } },
      });
      const result = parser.parse(["--agent", "claude-code"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.agent).toBe("claude-code");
      }
    });

    test("fails on invalid enum value", () => {
      const parser = createParser({
        options: { agent: { type: "enum", values: agents } },
      });
      const result = parser.parse(["--agent", "invalid-agent"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          'Invalid value for --agent: "invalid-agent". Valid values: claude-code, amp, codex, cursor, opencode',
        );
      }
    });

    test("returns undefined for absent optional enum", () => {
      const parser = createParser({
        options: { agent: { type: "enum", values: agents } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.agent).toBeUndefined();
      }
    });

    test("fails on missing required enum", () => {
      const parser = createParser({
        options: { agent: { type: "enum", values: agents, required: true } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Missing required option: --agent");
      }
    });

    test("parses enum with short alias", () => {
      const parser = createParser({
        options: { agent: { type: "enum", values: agents, short: "a" } },
      });
      const result = parser.parse(["-a", "amp"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.agent).toBe("amp");
      }
    });
  });

  describe("command parsing", () => {
    test("extracts command from first positional", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
      });
      const result = parser.parse(["sync", "--force"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBe("sync");
        expect(result.values.force).toBe(true);
      }
    });

    test("uses default command when none provided", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
        defaultCommand: "log",
      });
      const result = parser.parse(["--force"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBe("log");
      }
    });

    test("returns undefined command when no default and none provided", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
      });
      const result = parser.parse(["--force"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBeUndefined();
      }
    });

    test("excludes command from positionals", () => {
      const parser = createParser({
        options: {},
      });
      const result = parser.parse(["sync", "extra", "args"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBe("sync");
        expect(result.positionals).toEqual(["extra", "args"]);
      }
    });
  });

  describe("strict mode", () => {
    test("fails on unknown option in strict mode (default)", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
      });
      const result = parser.parse(["--unknown"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("unknown");
      }
    });

    test("ignores unknown options when strict is false", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
        strict: false,
      });
      const result = parser.parse(["--force", "--unknown"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.force).toBe(true);
      }
    });
  });

  describe("combined options", () => {
    test("parses multiple option types together", () => {
      const parser = createParser({
        options: {
          domain: { type: "string", short: "d", required: true },
          port: { type: "number" },
          force: { type: "boolean", short: "f" },
          agent: { type: "enum", values: ["a", "b", "c"] as const },
        },
      });
      const result = parser.parse([
        "capture",
        "-d",
        "example.com",
        "--port",
        "8080",
        "-f",
        "--agent",
        "b",
      ]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBe("capture");
        expect(result.values.domain).toBe("example.com");
        expect(result.values.port).toBe(8080);
        expect(result.values.force).toBe(true);
        expect(result.values.agent).toBe("b");
      }
    });

    test("handles options before and after command", () => {
      const parser = createParser({
        options: {
          force: { type: "boolean" },
          limit: { type: "number" },
        },
      });
      const result = parser.parse(["--force", "list", "--limit", "10"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBe("list");
        expect(result.values.force).toBe(true);
        expect(result.values.limit).toBe(10);
      }
    });
  });

  describe("edge cases", () => {
    test("handles empty args", () => {
      const parser = createParser({
        options: { force: { type: "boolean" } },
      });
      const result = parser.parse([]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBeUndefined();
        expect(result.values.force).toBe(false);
        expect(result.positionals).toEqual([]);
      }
    });

    test("handles only command", () => {
      const parser = createParser({
        options: {},
      });
      const result = parser.parse(["sync"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.command).toBe("sync");
        expect(result.positionals).toEqual([]);
      }
    });

    test("parses negative numbers", () => {
      const parser = createParser({
        options: { offset: { type: "number" } },
      });
      // Note: negative numbers need = syntax to avoid being parsed as flags
      const result = parser.parse(["--offset=-10"]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values.offset).toBe(-10);
      }
    });
  });
});
