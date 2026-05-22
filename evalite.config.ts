import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { defineConfig } from "evalite/config";
import { createSqliteStorage } from "evalite/sqlite-storage";

const readBoolean = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
};

const readNumber = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a finite number.`);
  }

  return parsed;
};

const storagePath = resolve(
  process.env["EVALITE_DB_PATH"] ?? ".evalite/evalite.db",
);

export default defineConfig({
  storage: async () => {
    mkdirSync(dirname(storagePath), { recursive: true });
    return createSqliteStorage(storagePath);
  },
  server: {
    port: readNumber("EVALITE_PORT", 3006),
  },
  scoreThreshold: readNumber("EVALITE_SCORE_THRESHOLD", 70),
  testTimeout: readNumber("EVALITE_TEST_TIMEOUT_MS", 30000),
  maxConcurrency: readNumber("EVALITE_MAX_CONCURRENCY", 1),
  trialCount: readNumber("EVALITE_TRIAL_COUNT", 1),
  cache: readBoolean("EVALITE_CACHE", true),
  hideTable: readBoolean("EVALITE_HIDE_TABLE", false),
  forceRerunTriggers: [
    "data/**/*.jsonl",
    "src/**/*.ts",
    "evals/**/*.ts",
    "scripts/**/*.ts"
  ],
});
