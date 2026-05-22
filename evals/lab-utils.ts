import type { Evalite } from "evalite/types";
import type { ZodType } from "zod";

import {
  formatDatasetIssue,
  loadJsonlFile,
} from "../src/datasets/jsonl";
import type { CaseType } from "../src/datasets/schemas";
import {
  average,
  createEvaliteScorer,
  makeResult,
  type ScoreInput,
  type ScorerResult,
} from "../src/scorers/common";

export interface LabRecordBase<TExpected = unknown> {
  readonly id: string;
  readonly caseType: CaseType;
  readonly risk: string;
  readonly labels: readonly string[];
  readonly input: unknown;
  readonly expected: TExpected;
  readonly expectedBehavior: string;
}

export interface LabDataShape<TRecord extends LabRecordBase> {
  readonly input: TRecord;
  readonly expected: TRecord["expected"];
}

export async function loadLabData<TRecord extends LabRecordBase>(
  filePath: string,
  schema: ZodType<TRecord>,
): Promise<Array<LabDataShape<TRecord>>> {
  const loaded = await loadJsonlFile(filePath, schema);

  if (loaded.issues.length > 0) {
    throw new Error(
      loaded.issues.map((issue) => formatDatasetIssue(issue)).join("\n"),
    );
  }

  return loaded.records.map((record) => ({
    input: record,
    expected: record.expected,
  }));
}

export function outputText<TInput, TExpected>(
  input: ScoreInput<TInput, { readonly text: string }, TExpected>,
): string {
  return input.output.text;
}

export function summaryText<TInput, TExpected>(
  input: ScoreInput<TInput, { readonly summary: string }, TExpected>,
): string {
  return input.output.summary;
}

export function resultFromChecks(
  checks: readonly ScorerResult[],
  summary: string,
  threshold = 0.8,
): ScorerResult {
  const score = average(checks.map((check) => check.score));
  const failed = checks.filter((check) => !check.passed);

  return makeResult(
    score,
    failed.length === 0 ? summary : `${failed.length} check(s) need review.`,
    { checks },
    threshold,
  );
}

export function createCaseTypeScorer<
  TInput extends LabRecordBase,
  TOutput,
  TExpected,
>(opts: {
  readonly score: (
    input: ScoreInput<TInput, TOutput, TExpected>,
  ) => number | ScorerResult;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "case_discussion_signal",
    description: "Keeps pass, borderline, and failing workshop cases visible.",
    scorer: (input) => {
      const result = opts.score(input);

      if (typeof result !== "number") {
        return result;
      }

      return makeResult(
        result,
        `${input.input.caseType} case scored ${result.toFixed(2)}.`,
        {
          id: input.input.id,
          caseType: input.input.caseType,
          expectedBehavior: input.input.expectedBehavior,
        },
        input.input.caseType === "passing" ? 0.85 : 0.5,
      );
    },
  });
}

export function workshopColumns<
  TInput extends LabRecordBase,
  TOutput extends {
    readonly variant?: string;
    readonly trace?: { readonly mode?: string; readonly modelName?: string };
  },
  TExpected,
>(opts: Evalite.ColumnInput<TInput, TOutput, TExpected>): Evalite.RenderedColumn[] {
  const numericScores = opts.scores
    .map((score) => score.score)
    .filter((score): score is number => typeof score === "number");

  return [
    { label: "case", value: opts.input.id },
    { label: "type", value: opts.input.caseType },
    { label: "risk", value: opts.input.risk },
    { label: "variant", value: opts.output.variant ?? "n/a" },
    {
      label: "runtime",
      value: opts.output.trace?.mode === "live"
        ? (opts.output.trace.modelName ?? "live")
        : (opts.output.trace?.mode ?? "local"),
    },
    {
      label: "avg",
      value: numericScores.length === 0
        ? "n/a"
        : average(numericScores).toFixed(2),
    },
  ];
}

export type ScoreLike = {
  readonly name: string;
  readonly score?: number | null;
};

export function namedScore(
  scores: readonly ScoreLike[],
  name: string,
): number | undefined {
  const score = scores.find((candidate) => candidate.name === name)?.score;
  return typeof score === "number" ? score : undefined;
}

export function formatScore(score: number | undefined): string {
  return typeof score === "number" ? score.toFixed(2) : "n/a";
}

export function compactCaseId(id: string, prefix: string): string {
  return id.replace(new RegExp(`^${prefix}`, "u"), "");
}

export function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

export function requireExpected<TExpected>(
  caseId: string,
  expected: TExpected | undefined,
): TExpected {
  if (expected === undefined) {
    throw new Error(`Missing expected data for ${caseId}.`);
  }

  return expected;
}
