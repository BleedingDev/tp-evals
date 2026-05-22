import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evaliteBin = resolve(rootDir, "node_modules", "evalite", "dist", "bin.js");

type AuditMode = "mock" | "live-nojudge";

type LabAuditDefinition = {
  readonly id: string;
  readonly file: string;
};

type CanonicalEval = {
  readonly id: string;
  readonly score: number | string | undefined;
  readonly scores: readonly { readonly name: string; readonly score: number | string | undefined }[];
};

const allLabs = [
  { id: "01", file: "evals/01-dataset-quality.eval.ts" },
  { id: "02", file: "evals/02-translation-guardrails.eval.ts" },
  { id: "03", file: "evals/03-translation-quality.eval.ts" },
  { id: "04", file: "evals/04-mobile-search-intent.eval.ts" },
  { id: "05", file: "evals/05-mobile-search-conversation.eval.ts" },
  { id: "06", file: "evals/06-prompt-model-variants.eval.ts" },
  { id: "07", file: "evals/07-travel-info-summary.eval.ts" },
  { id: "08", file: "evals/08-judge-calibration.eval.ts" },
  { id: "09", file: "evals/09-prompt-injection.eval.ts" },
  { id: "10", file: "evals/10-consistency-regression.eval.ts" },
  { id: "11", file: "evals/11-agentic-eval-authoring.eval.ts" },
] as const satisfies readonly LabAuditDefinition[];

const liveNoJudgeLabs = allLabs.filter((lab) =>
  ["01", "02", "04", "10"].includes(lab.id),
);

const parseMode = (value: string | undefined): AuditMode => {
  if (value === "mock" || value === "live-nojudge") {
    return value;
  }

  throw new Error("Usage: tsx scripts/workshop-audit.ts <mock|live-nojudge> [--runs=N]");
};

const parseRuns = (args: readonly string[]): number => {
  const flag = args.find((arg) => arg.startsWith("--runs="));
  const raw = flag?.slice("--runs=".length) ?? process.env["WORKSHOP_AUDIT_RUNS"] ?? "10";
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid run count: ${raw}`);
  }

  return parsed;
};

const round = (value: unknown): number | string | undefined => {
  if (typeof value !== "number") {
    return typeof value === "string" ? value : undefined;
  }

  return Number(value.toFixed(9));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const caseId = (value: Record<string, unknown>): string => {
  const input = value["input"];

  if (isRecord(input) && typeof input["id"] === "string") {
    return input["id"];
  }

  return String(input).slice(0, 80);
};

const canonicalEval = (value: Record<string, unknown>): CanonicalEval => {
  const scores = Array.isArray(value["scores"])
    ? value["scores"].filter(isRecord).map((score) => ({
        name: typeof score["name"] === "string" ? score["name"] : "unknown",
        score: round(score["score"]),
      }))
    : [];

  return {
    id: caseId(value),
    score: round(value["score"]),
    scores,
  };
};

const run = async (
  args: readonly string[],
  envOverrides: NodeJS.ProcessEnv,
  logPath: string,
): Promise<number> => {
  const child = spawn(process.execPath, [evaliteBin, ...args], {
    cwd: rootDir,
    env: { ...process.env, ...envOverrides },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString("utf8");
  });
  child.stderr.on("data", (chunk: Buffer) => {
    output += chunk.toString("utf8");
  });

  const code = await new Promise<number>((resolveProcess, reject) => {
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolveProcess(exitCode ?? 1);
    });
  });

  await writeFile(logPath, output);
  return code;
};

const readSuite = async (resultPath: string, lab: LabAuditDefinition) => {
  const parsed = JSON.parse(await readFile(resultPath, "utf8")) as unknown;

  if (!isRecord(parsed) || !Array.isArray(parsed["suites"])) {
    throw new Error(`${resultPath} is not a valid Evalite result export.`);
  }

  const suite = parsed["suites"].find(isRecord);
  if (suite === undefined) {
    throw new Error(`${resultPath} does not contain any Evalite suite.`);
  }

  const filepath = suite["filepath"];
  const expectedFile = resolve(rootDir, lab.file);
  if (typeof filepath !== "string" || resolve(filepath) !== expectedFile) {
    throw new Error(
      [
        `Result sanity check failed for Lab ${lab.id}.`,
        `Expected: ${lab.file}`,
        `Actual: ${typeof filepath === "string" ? filepath : String(filepath)}`,
      ].join("\n"),
    );
  }

  return suite;
};

const modeEnv = (mode: AuditMode): NodeJS.ProcessEnv => {
  if (mode === "mock") {
    return {
      WORKSHOP_MODE: "mock",
      LIVE_LLM_ENABLED: "false",
      TP_EVALS_LIVE_JUDGE: "false",
    };
  }

  return {
    WORKSHOP_MODE: "live",
    LIVE_LLM_ENABLED: "true",
    TP_EVALS_LIVE_JUDGE: "false",
  };
};

const compareRuns = (
  lab: LabAuditDefinition,
  runs: readonly {
    readonly run: string;
    readonly suiteName: string;
    readonly average: number | string | undefined;
    readonly order: string;
    readonly evals: readonly CanonicalEval[];
  }[],
) => {
  const base = runs[0];
  if (base === undefined) {
    throw new Error(`No audit runs captured for Lab ${lab.id}.`);
  }

  const avgStable = runs.every((runResult) => runResult.average === base.average);
  const orderStable = runs.every((runResult) => runResult.order === base.order);
  const scoreStable = runs.every(
    (runResult) => JSON.stringify(runResult.evals) === JSON.stringify(base.evals),
  );

  return {
    lab: lab.id,
    suiteName: base.suiteName,
    average: base.average,
    avgStable,
    orderStable,
    scoreStable,
    order: base.order,
    changedRuns: runs
      .filter((runResult) => JSON.stringify(runResult.evals) !== JSON.stringify(base.evals))
      .map((runResult) => runResult.run),
  };
};

const mode = parseMode(process.argv[2]);
const runs = parseRuns(process.argv.slice(3));
const labs = mode === "mock" ? allLabs : liveNoJudgeLabs;
const auditDir = resolve(rootDir, ".audit", "determinism", mode);

await rm(auditDir, { recursive: true, force: true });
await mkdir(auditDir, { recursive: true });

const report = [];

for (const lab of labs) {
  const labRuns = [];

  for (let index = 1; index <= runs; index += 1) {
    const runId = String(index).padStart(2, "0");
    const runDir = resolve(auditDir, `run-${runId}`);
    await mkdir(runDir, { recursive: true });

    const resultPath = resolve(runDir, `lab-${lab.id}.json`);
    const logPath = resolve(runDir, `lab-${lab.id}.log`);
    const dbPath = resolve(runDir, `lab-${lab.id}.db`);
    const port = String(10_000 + index * 100 + Number.parseInt(lab.id, 10));

    const exitCode = await run(
      [
        "run",
        lab.file,
        "--threshold",
        "0",
        "--noCache",
        "--outputPath",
        resultPath,
      ],
      {
        ...modeEnv(mode),
        EVALITE_DB_PATH: dbPath,
        EVALITE_PORT: port,
      },
      logPath,
    );

    if (exitCode !== 0) {
      throw new Error(`Audit failed for Lab ${lab.id}, run ${runId}. See ${logPath}.`);
    }

    const suite = await readSuite(resultPath, lab);
    const evals = Array.isArray(suite["evals"])
      ? suite["evals"].filter(isRecord).map(canonicalEval)
      : [];

    labRuns.push({
      run: runId,
      suiteName: typeof suite["name"] === "string" ? suite["name"] : basename(lab.file),
      average: round(suite["averageScore"]),
      order: evals.map((item) => item.id).join(" > "),
      evals,
    });
  }

  report.push(compareRuns(lab, labRuns));
}

const summaryPath = resolve(auditDir, "summary.json");
await writeFile(summaryPath, JSON.stringify({ mode, runs, report }, null, 2));

console.table(
  report.map((item) => ({
    lab: item.lab,
    average: item.average,
    averageStable: item.avgStable ? "stable" : "DRIFT",
    order: item.orderStable ? "stable" : "DRIFT",
    scores: item.scoreStable ? "stable" : "DRIFT",
    changedRuns: item.changedRuns.join(","),
  })),
);
console.log(`Audit summary: ${summaryPath}`);

const failed = report.filter(
  (item) => !item.avgStable || !item.orderStable || !item.scoreStable,
);

if (mode === "mock" && failed.length > 0) {
  process.exitCode = 1;
}
