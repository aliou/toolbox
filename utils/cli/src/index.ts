import { parseArgs } from "node:util";

export { getTerminalWidth, isInteractive, pagerOutput } from "./terminal";

// Option type definitions
type BooleanOption = {
  type: "boolean";
  short?: string;
};

type StringOption = {
  type: "string";
  short?: string;
  required?: boolean;
};

type NumberOption = {
  type: "number";
  short?: string;
  required?: boolean;
};

type EnumOption<T extends readonly string[]> = {
  type: "enum";
  values: T;
  short?: string;
  required?: boolean;
};

type OptionConfig =
  | BooleanOption
  | StringOption
  | NumberOption
  | EnumOption<readonly string[]>;

type OptionsSchema = Record<string, OptionConfig>;

// Infer the result type from the options schema
type InferOptionType<T extends OptionConfig> = T extends BooleanOption
  ? boolean
  : T extends NumberOption
    ? T["required"] extends true
      ? number
      : number | undefined
    : T extends EnumOption<infer V>
      ? T["required"] extends true
        ? V[number]
        : V[number] | undefined
      : T extends StringOption
        ? T["required"] extends true
          ? string
          : string | undefined
        : never;

type InferValues<T extends OptionsSchema> = {
  [K in keyof T]: InferOptionType<T[K]>;
};

// Result types
type ParseSuccess<T> = {
  success: true;
  command: string | undefined;
  values: T;
  positionals: string[];
};

type ParseError = {
  success: false;
  error: string;
};

type ParseResult<T> = ParseSuccess<T> | ParseError;

// Parser configuration
type ParserConfig<T extends OptionsSchema> = {
  options: T;
  defaultCommand?: string;
  strict?: boolean;
};

// Parser instance
type Parser<T extends OptionsSchema> = {
  parse: (args: string[]) => ParseResult<InferValues<T>>;
};

export function createParser<T extends OptionsSchema>(
  config: ParserConfig<T>,
): Parser<T> {
  const { options, defaultCommand, strict = true } = config;

  return {
    parse(args: string[]): ParseResult<InferValues<T>> {
      // Build parseArgs config
      const parseArgsOptions: Record<
        string,
        { type: "boolean" | "string"; short?: string }
      > = {};

      for (const [name, opt] of Object.entries(options)) {
        // parseArgs only supports boolean and string - we'll coerce numbers later
        const parseArgsType = opt.type === "boolean" ? "boolean" : "string";
        parseArgsOptions[name] = { type: parseArgsType };
        if (opt.short) {
          parseArgsOptions[name].short = opt.short;
        }
      }

      // Parse with parseArgs
      let parsed: { values: Record<string, unknown>; positionals: string[] };
      try {
        parsed = parseArgs({
          args,
          options: parseArgsOptions,
          strict,
          allowPositionals: true,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown parsing error";
        return { success: false, error: message };
      }

      const { values: rawValues, positionals } = parsed;

      // Extract command from positionals
      const command =
        positionals.length > 0 && !positionals[0].startsWith("-")
          ? positionals[0]
          : defaultCommand;

      const restPositionals =
        command && positionals[0] === command
          ? positionals.slice(1)
          : positionals;

      // Validate and coerce values
      const values: Record<string, unknown> = {};

      for (const [name, opt] of Object.entries(options)) {
        const rawValue = rawValues[name];

        // Handle boolean - default to false if not present
        if (opt.type === "boolean") {
          values[name] = rawValue === true;
          continue;
        }

        // Handle required check
        if (opt.required && (rawValue === undefined || rawValue === "")) {
          return {
            success: false,
            error: `Missing required option: --${name}`,
          };
        }

        // Handle undefined/empty for non-required
        if (rawValue === undefined || rawValue === "") {
          values[name] = undefined;
          continue;
        }

        // Handle number coercion
        if (opt.type === "number") {
          const num = Number.parseInt(rawValue as string, 10);
          if (Number.isNaN(num)) {
            return {
              success: false,
              error: `Invalid number for --${name}: "${rawValue}"`,
            };
          }
          values[name] = num;
          continue;
        }

        // Handle enum validation
        if (opt.type === "enum") {
          const enumValues = opt.values as readonly string[];
          if (!enumValues.includes(rawValue as string)) {
            return {
              success: false,
              error: `Invalid value for --${name}: "${rawValue}". Valid values: ${enumValues.join(", ")}`,
            };
          }
          values[name] = rawValue;
          continue;
        }

        // Handle string
        values[name] = rawValue;
      }

      return {
        success: true,
        command,
        values: values as InferValues<T>,
        positionals: restPositionals,
      };
    },
  };
}

export type { ParseResult, ParseSuccess, ParseError, OptionsSchema };
