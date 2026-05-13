import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;

const stripInlineComment = (value: string): string => {
  let quote: '"' | "'" | undefined;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && (index === 0 || value[index - 1] !== "\\")) {
      quote = quote === char ? undefined : char;
      continue;
    }

    if (char === "#" && quote === undefined && /\s/u.test(value[index - 1] ?? " ")) {
      return value.slice(0, index);
    }
  }

  return value;
};

const unquote = (value: string): string => {
  const trimmed = stripInlineComment(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

export const loadWorkshopEnv = (cwd = process.cwd()): void => {
  if (loaded) {
    return;
  }

  loaded = true;
  const path = resolve(cwd, ".env");
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = unquote(trimmed.slice(separatorIndex + 1));
    if (key.length > 0) {
      process.env[key] = value;
    }
  }
};
