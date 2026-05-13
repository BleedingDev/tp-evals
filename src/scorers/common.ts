import type { Evalite } from "evalite/types";

export interface ScorerResult {
  score: number;
  passed: boolean;
  summary: string;
  details: Record<string, unknown>;
}

export interface ThresholdOptions {
  threshold?: number;
}

export interface TextMatchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

export type ScoreInput<TInput, TOutput, TExpected> = Evalite.ScoreInput<
  TInput,
  TOutput,
  TExpected
>;

export type ResultScorer<TInput, TOutput, TExpected> = (
  input: ScoreInput<TInput, TOutput, TExpected>,
) => ScorerResult | Promise<ScorerResult>;

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(1, Math.max(0, score));
}

export function scoreToPassed(
  score: number,
  threshold = 1,
): boolean {
  return clampScore(score) >= threshold;
}

export function makeResult(
  score: number,
  summary: string,
  details: Record<string, unknown> = {},
  threshold = 1,
): ScorerResult {
  const normalizedScore = clampScore(score);

  return {
    score: normalizedScore,
    passed: scoreToPassed(normalizedScore, threshold),
    summary,
    details,
  };
}

export function createEvaliteScorer<TInput, TOutput, TExpected>(opts: {
  name: string;
  description: string;
  scorer: ResultScorer<TInput, TOutput, TExpected>;
}): Evalite.Scorer<TInput, TOutput, TExpected> {
  return async (input) => {
    const result = await opts.scorer(input);

    return {
      score: result.score,
      name: opts.name,
      description: result.summary || opts.description,
      metadata: result,
    };
  };
}

export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function normalizeText(text: string): string {
  return normalizeWhitespace(text)
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function includesText(
  haystack: string,
  needle: string,
  options: TextMatchOptions = {},
): boolean {
  if (needle.length === 0) {
    return true;
  }

  const source = options.caseSensitive ? haystack : normalizeText(haystack);
  const target = options.caseSensitive ? needle : normalizeText(needle);

  if (!options.wholeWord) {
    return source.includes(target);
  }

  return new RegExp(`\\b${escapeRegExp(target)}\\b`, "u").test(source);
}

export function findPresentTerms(
  output: string,
  terms: readonly string[],
  options: TextMatchOptions = {},
): string[] {
  return terms.filter((term) => includesText(output, term, options));
}

export function findMissingTerms(
  output: string,
  terms: readonly string[],
  options: TextMatchOptions = {},
): string[] {
  return terms.filter((term) => !includesText(output, term, options));
}

export function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "before",
  "but",
  "by",
  "can",
  "does",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "may",
  "must",
  "need",
  "not",
  "of",
  "on",
  "or",
  "should",
  "than",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "with",
  "without",
]);

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .match(/[a-z0-9]+(?:-[a-z0-9]+)?/gu)
    ?? [];
}

export function keywordTokens(text: string): string[] {
  return uniqueStrings(
    tokenize(text).filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

export function tokenOverlapRatio(source: string, candidate: string): number {
  const sourceTokens = keywordTokens(source);
  const candidateTokens = new Set(keywordTokens(candidate));

  if (sourceTokens.length === 0) {
    return 1;
  }

  const matches = sourceTokens.filter((token) => candidateTokens.has(token));

  return matches.length / sourceTokens.length;
}

export function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(keywordTokens(left));
  const rightTokens = new Set(keywordTokens(right));

  if (leftTokens.size === 0 && rightTokens.size === 0) {
    return 1;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token));
  const union = new Set([...leftTokens, ...rightTokens]);

  return intersection.length / union.size;
}

export function splitSentences(text: string): string[] {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function wordCount(text: string): number {
  return tokenize(text).length;
}

export function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 1;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function weightedAverage(
  values: readonly { score: number; weight: number }[],
): number {
  const totalWeight = values.reduce((sum, value) => sum + value.weight, 0);

  if (totalWeight <= 0) {
    return average(values.map((value) => value.score));
  }

  return values.reduce((sum, value) => sum + value.score * value.weight, 0) / totalWeight;
}

export function safeJsonString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getPath(
  value: unknown,
  path: readonly string[],
): unknown {
  let current = value;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

export function deepEqualNormalized(left: unknown, right: unknown): boolean {
  if (typeof left === "string" && typeof right === "string") {
    return normalizeText(left) === normalizeText(right);
  }

  if (typeof left === "number" || typeof right === "number") {
    return Number(left) === Number(right);
  }

  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => deepEqualNormalized(item, right[index]));
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key) => deepEqualNormalized(left[key], right[key]));
  }

  return Object.is(left, right);
}
