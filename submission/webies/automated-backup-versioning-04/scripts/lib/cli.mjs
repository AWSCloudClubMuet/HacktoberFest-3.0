/**
 * Small dependency-free command-line parser shared by the demo scripts.
 */

export function parseArgs(argv, { booleans = [] } = {}) {
  const result = { _: [] };
  const boolSet = new Set(booleans);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--") {
      result._.push(...argv.slice(index + 1));
      break;
    }

    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }

    const equalsAt = token.indexOf("=");
    const rawName = equalsAt === -1 ? token.slice(2) : token.slice(2, equalsAt);
    const inlineValue = equalsAt === -1 ? undefined : token.slice(equalsAt + 1);
    const name = rawName.replaceAll("_", "-");

    if (!name) {
      throw new Error("Empty option name. Use --help for usage.");
    }

    if (boolSet.has(name)) {
      if (inlineValue === undefined) {
        result[name] = true;
      } else if (["true", "1", "yes"].includes(inlineValue.toLowerCase())) {
        result[name] = true;
      } else if (["false", "0", "no"].includes(inlineValue.toLowerCase())) {
        result[name] = false;
      } else {
        throw new Error(`Option --${rawName} expects true or false.`);
      }
      continue;
    }

    let value = inlineValue;
    if (value === undefined) {
      value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Option --${rawName} requires a value.`);
      }
      index += 1;
    }

    result[name] = value;
  }

  return result;
}

export function checkArgs(args, allowed) {
  const unknown = Object.keys(args).filter((key) => key !== "_" && !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown option(s): ${unknown.map((key) => `--${key}`).join(", ")}. Use --help for usage.`,
    );
  }
  if (args._.length > 0) {
    throw new Error(`Unexpected argument(s): ${args._.join(" ")}. Use --help for usage.`);
  }
}

export function parseIntegerOption(value, name, { min, max, fallback }) {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || String(parsed) !== String(value).trim()) {
    throw new Error(`--${name} must be an integer. Received: ${value}`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`--${name} must be between ${min} and ${max}. Received: ${parsed}`);
  }
  return parsed;
}

export function printFatal(label, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[${label}] ERROR: ${message}`);
  if (process.env.DEBUG === "1" && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exitCode = 1;
}
