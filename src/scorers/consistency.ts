import {
  average,
  createEvaliteScorer,
  deepEqualNormalized,
  includesText,
  isRecord,
  jaccardSimilarity,
  makeResult,
  normalizeText,
  safeJsonString,
  tokenOverlapRatio,
  type ScoreInput,
  type ScorerResult,
  type ThresholdOptions,
} from "./common.ts";
import { parseStructuredOutput } from "./structured-output.ts";

export interface ParaphraseEquivalenceOptions extends ThresholdOptions {
  minSimilarity?: number;
}

export interface RepeatedRunVarianceOptions extends ThresholdOptions {
  maxVarianceScore?: number;
}

export interface RegressionCase {
  id: string;
  currentScore: number;
  baselineScore: number;
  minDelta?: number;
  threshold?: number;
}

export interface RegressionCountOptions extends ThresholdOptions {
  minDelta?: number;
}

export interface ConsistencyExpected {
  invariantAnswer: string;
  mustMatchFields?: Readonly<Record<string, unknown>>;
  maxVarianceScore?: number;
  minConsistencyScore?: number;
}

function textSimilarity(left: string, right: string): number {
  return Math.max(
    jaccardSimilarity(left, right),
    average([tokenOverlapRatio(left, right), tokenOverlapRatio(right, left)]),
  );
}

export function scoreParaphraseEquivalence(
  output: string,
  expectedEquivalent: string,
  options: ParaphraseEquivalenceOptions = {},
): ScorerResult {
  const similarity = includesText(output, expectedEquivalent)
    || includesText(expectedEquivalent, output)
    ? 1
    : textSimilarity(output, expectedEquivalent);
  const threshold = options.threshold ?? options.minSimilarity ?? 0.8;

  return makeResult(
    similarity,
    similarity >= threshold
      ? "Output is equivalent to the invariant answer by deterministic similarity."
      : "Output differs from the invariant answer.",
    { expectedEquivalent, similarity },
    threshold,
  );
}

function pairwiseSimilarities(outputs: readonly string[]): number[] {
  const similarities: number[] = [];

  for (let left = 0; left < outputs.length; left += 1) {
    for (let right = left + 1; right < outputs.length; right += 1) {
      similarities.push(textSimilarity(outputs[left] ?? "", outputs[right] ?? ""));
    }
  }

  return similarities;
}

export function scoreRepeatedRunVariance(
  outputs: readonly string[],
  options: RepeatedRunVarianceOptions = {},
): ScorerResult {
  const similarities = pairwiseSimilarities(outputs);
  const averageSimilarity = average(similarities);
  const varianceScore = 1 - averageSimilarity;
  const maxVarianceScore = options.maxVarianceScore ?? 0.2;
  const score = maxVarianceScore <= 0
    ? varianceScore === 0 ? 1 : 0
    : 1 - varianceScore / maxVarianceScore;

  return makeResult(
    score,
    varianceScore <= maxVarianceScore
      ? "Repeated-run variance is within the configured limit."
      : "Repeated-run variance exceeds the configured limit.",
    { outputs, similarities, averageSimilarity, varianceScore, maxVarianceScore },
    options.threshold,
  );
}

function fieldFromOutput(output: unknown, field: string): unknown {
  const parsed = parseStructuredOutput(output);

  if (isRecord(parsed.value)) {
    if (parsed.value[field] !== undefined) {
      return parsed.value[field];
    }

    const slots = parsed.value["slots"];

    if (isRecord(slots) && slots[field] !== undefined) {
      return slots[field];
    }
  }

  return undefined;
}

export function scoreInvariantFields(
  outputs: readonly unknown[],
  mustMatchFields: Readonly<Record<string, unknown>>,
  options: ThresholdOptions = {},
): ScorerResult {
  const fields = Object.entries(mustMatchFields);
  const mismatches: Array<{ outputIndex: number; field: string; expected: unknown; actual: unknown }> = [];
  let matches = 0;

  for (const [field, expected] of fields) {
    for (const [outputIndex, output] of outputs.entries()) {
      const actual = fieldFromOutput(output, field);
      const outputText = safeJsonString(output);
      const matched = actual === undefined
        ? typeof expected === "string" && includesText(outputText, expected)
        : deepEqualNormalized(actual, expected);

      if (matched) {
        matches += 1;
        continue;
      }

      mismatches.push({ outputIndex, field, expected, actual });
    }
  }

  const denominator = Math.max(fields.length * outputs.length, 1);
  const score = matches / denominator;

  return makeResult(
    score,
    mismatches.length === 0
      ? "Invariant fields are stable across outputs."
      : "Invariant fields vary or are missing.",
    { mustMatchFields, mismatches },
    options.threshold,
  );
}

export function scoreRegressionCounts(
  cases: readonly RegressionCase[],
  options: RegressionCountOptions = {},
): ScorerResult {
  const minDelta = options.minDelta ?? 0.001;
  const regressions = cases.filter((testCase) => {
    const allowedDelta = testCase.minDelta ?? minDelta;
    const belowBaseline = testCase.currentScore < testCase.baselineScore - allowedDelta;
    const belowThreshold =
      testCase.threshold === undefined ? false : testCase.currentScore < testCase.threshold;

    return belowBaseline || belowThreshold;
  });
  const score = cases.length === 0 ? 1 : 1 - regressions.length / cases.length;

  return makeResult(
    score,
    regressions.length === 0
      ? "No regressions were detected."
      : `${regressions.length} regression(s) were detected.`,
    { total: cases.length, regressions, minDelta },
    options.threshold,
  );
}

export function scoreConsistencyAcrossRuns(
  outputs: readonly unknown[],
  expected: ConsistencyExpected,
): ScorerResult {
  const outputTexts = outputs.map(safeJsonString);
  const checks: ScorerResult[] = [
    ...outputTexts.map((output) =>
      expected.minConsistencyScore === undefined
        ? scoreParaphraseEquivalence(output, expected.invariantAnswer)
        : scoreParaphraseEquivalence(output, expected.invariantAnswer, {
            minSimilarity: expected.minConsistencyScore,
          }),
    ),
    expected.maxVarianceScore === undefined
      ? scoreRepeatedRunVariance(outputTexts)
      : scoreRepeatedRunVariance(outputTexts, {
          maxVarianceScore: expected.maxVarianceScore,
        }),
  ];

  if (expected.mustMatchFields) {
    checks.push(scoreInvariantFields(outputs, expected.mustMatchFields));
  }

  const score = average(checks.map((check) => check.score));
  const failed = checks.filter((check) => !check.passed);

  return makeResult(
    score,
    failed.length === 0
      ? "All configured consistency checks passed."
      : `${failed.length} consistency check(s) failed.`,
    { checks },
    expected.minConsistencyScore ?? 1,
  );
}

export function normalizeForParaphrase(text: string): string {
  return normalizeText(text);
}

export function createConsistencyScorer<TInput, TOutput, TExpected>(opts: {
  outputs: (input: ScoreInput<TInput, TOutput, TExpected>) => readonly unknown[];
  expected: (input: ScoreInput<TInput, TOutput, TExpected>) => ConsistencyExpected;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "consistency",
    description: "Checks invariant answer equivalence, repeated-run variance, and field stability.",
    scorer: (input) => scoreConsistencyAcrossRuns(opts.outputs(input), opts.expected(input)),
  });
}
