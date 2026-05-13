import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { z } from "zod";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PackageJsonSchema = z.object({
  type: z.literal("module"),
  packageManager: z.string().regex(/^pnpm@\d+\.\d+\.\d+$/u),
  scripts: z.record(z.string(), z.string()),
  dependencies: z.record(z.string(), z.string()),
  devDependencies: z.record(z.string(), z.string()),
});

const requiredScripts = [
  "setup",
  "smoke",
  "data:check",
  "data:summary",
  "lab:01",
  "lab:02",
  "lab:03",
  "lab:04",
  "lab:05",
  "lab:06",
  "lab:07",
  "lab:08",
  "lab:09",
  "lab:10",
  "lab:all",
  "eval:dev",
  "eval:all",
  "eval:export",
  "verify",
  "docker:build",
  "docker:shell",
  "docker:verify",
] as const;

const requiredFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "evalite.config.ts",
  ".prototools",
  "mise.toml",
  "Dockerfile",
  "compose.yaml",
  ".env.example",
  "scripts/smoke.ts",
  "scripts/run-lab.ts",
] as const;

const fail = (message: string): never => {
  throw new Error(message);
};

const readJson = async (path: string): Promise<unknown> => {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
};

const assertFileExists = async (relativePath: string): Promise<void> => {
  await access(resolve(rootDir, relativePath));
};

const main = async (): Promise<void> => {
  const packageJson = PackageJsonSchema.parse(
    await readJson(resolve(rootDir, "package.json")),
  );

  if (packageJson.dependencies["evalite"] !== "1.0.0-beta.16") {
    fail("package.json must pin evalite to 1.0.0-beta.16.");
  }

  for (const dependency of ["zod"] as const) {
    if (!(dependency in packageJson.dependencies)) {
      fail(`Missing runtime dependency: ${dependency}.`);
    }
  }

  for (const dependency of ["tsx", "typescript", "vitest"] as const) {
    if (!(dependency in packageJson.devDependencies)) {
      fail(`Missing development dependency: ${dependency}.`);
    }
  }

  for (const scriptName of requiredScripts) {
    const script = packageJson.scripts[scriptName] ?? fail(
      `Missing package script: ${scriptName}.`,
    );

    if (script.toLowerCase().includes("checkpoint")) {
      fail(`Package script ${scriptName} must not mention checkpoints.`);
    }
  }

  for (const relativePath of requiredFiles) {
    await assertFileExists(relativePath);
  }

  const mode = process.env["WORKSHOP_MODE"] ?? "mock";
  if (!["mock", "live"].includes(mode)) {
    fail("WORKSHOP_MODE must be either mock or live.");
  }

  const configModule = await import(
    pathToFileURL(resolve(rootDir, "evalite.config.ts")).href
  );
  if (typeof configModule.default !== "object" || configModule.default === null) {
    fail("evalite.config.ts must export an Evalite config object.");
  }

  console.log("Runtime smoke check passed.");
  console.log(`Mode: ${mode}`);
  console.log(`Package manager: ${packageJson.packageManager}`);
  console.log("API keys are not required for mock mode.");
};

await main();
