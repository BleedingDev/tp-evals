import type { ZodType } from "zod";

import {
  average,
  createEvaliteScorer,
  deepEqualNormalized,
  getPath,
  includesText,
  isRecord,
  makeResult,
  normalizeText,
  safeJsonString,
  type ScoreInput,
  type ScorerResult,
  type ThresholdOptions,
} from "./common.js";

export interface SchemaValidityOptions extends ThresholdOptions {
  parseJsonString?: boolean;
}

export interface FieldAccuracyOptions extends ThresholdOptions {
  pathPrefix?: readonly string[];
  allowStringContainment?: boolean;
}

export interface MissingFieldBehaviorOptions extends ThresholdOptions {
  missingFieldKeys?: readonly string[];
  clarificationKeys?: readonly string[];
}

export interface IntentClassificationOptions extends ThresholdOptions {
  minConfidence?: number;
  intentKey?: string;
  confidenceKey?: string;
}

export interface StructuredOutputSpec {
  schema?: ZodType;
  expectedFields?: Readonly<Record<string, unknown>>;
  expectedMissingFields?: readonly string[];
  expectedIntent?: string;
  minIntentConfidence?: number;
}

export interface ParsedStructuredOutput {
  value: unknown;
  source: "object" | "json" | "text";
  error?: string;
}

function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/iu);

  return match?.[1]?.trim() ?? trimmed;
}

function jsonSlice(text: string): string {
  const stripped = stripMarkdownFence(text);
  const objectStart = stripped.indexOf("{");
  const arrayStart = stripped.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);

  if (starts.length === 0) {
    return stripped;
  }

  const start = Math.min(...starts);
  const open = stripped[start];
  const close = open === "{" ? "}" : "]";
  const end = stripped.lastIndexOf(close);

  if (end <= start) {
    return stripped;
  }

  return stripped.slice(start, end + 1);
}

export function parseStructuredOutput(output: unknown): ParsedStructuredOutput {
  if (isRecord(output) || Array.isArray(output)) {
    return { value: output, source: "object" };
  }

  if (typeof output !== "string") {
    return { value: output, source: "text", error: "Output is not an object or JSON string." };
  }

  try {
    return { value: JSON.parse(jsonSlice(output)) as unknown, source: "json" };
  } catch (error) {
    return {
      value: output,
      source: "text",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function scoreSchemaValidity<T>(
  output: unknown,
  schema: ZodType<T>,
  options: SchemaValidityOptions = {},
): ScorerResult {
  const parsed = options.parseJsonString === false
    ? { value: output, source: "object" as const }
    : parseStructuredOutput(output);
  const result = schema.safeParse(parsed.value);

  if (result.success) {
    return makeResult(
      1,
      "Output matches the expected schema.",
      { parseSource: parsed.source },
      options.threshold,
    );
  }

  return makeResult(
    0,
    "Output does not match the expected schema.",
    {
      parseSource: parsed.source,
      parseError: parsed.error,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    },
    options.threshold,
  );
}

function readField(actual: unknown, field: string, prefix: readonly string[] = []): unknown {
  const direct = getPath(actual, [...prefix, field]);

  if (direct !== undefined) {
    return direct;
  }

  if (!isRecord(actual)) {
    return undefined;
  }

  const slots = actual["slots"];

  if (isRecord(slots) && slots[field] !== undefined) {
    return slots[field];
  }

  const fields = actual["fields"];

  if (isRecord(fields) && fields[field] !== undefined) {
    return fields[field];
  }

  return undefined;
}

function fieldMatches(
  actual: unknown,
  expected: unknown,
  allowStringContainment: boolean,
): boolean {
  if (deepEqualNormalized(actual, expected)) {
    return true;
  }

  if (allowStringContainment && typeof actual === "string" && typeof expected === "string") {
    return includesText(actual, expected) || includesText(expected, actual);
  }

  if (allowStringContainment && Array.isArray(actual) && typeof expected === "string") {
    return actual.some((item) => typeof item === "string" && includesText(item, expected));
  }

  return false;
}

export function scoreFieldAccuracy(
  output: unknown,
  expectedFields: Readonly<Record<string, unknown>>,
  options: FieldAccuracyOptions = {},
): ScorerResult {
  const parsed = parseStructuredOutput(output);
  const fields = Object.entries(expectedFields);
  const matched: string[] = [];
  const missing: string[] = [];
  const mismatched: Array<{ field: string; expected: unknown; actual: unknown }> = [];

  for (const [field, expected] of fields) {
    const actual = readField(parsed.value, field, options.pathPrefix);

    if (actual === undefined) {
      missing.push(field);
      continue;
    }

    if (fieldMatches(actual, expected, options.allowStringContainment ?? true)) {
      matched.push(field);
      continue;
    }

    mismatched.push({ field, expected, actual });
  }

  const score = fields.length === 0
    ? 1
    : matched.length / fields.length;

  return makeResult(
    score,
    missing.length === 0 && mismatched.length === 0
      ? "All expected fields match."
      : "Expected field accuracy failed.",
    { matched, missing, mismatched, parseSource: parsed.source },
    options.threshold,
  );
}

function readStringArray(actual: unknown, keys: readonly string[]): string[] {
  if (!isRecord(actual)) {
    return [];
  }

  for (const key of keys) {
    const value = actual[key];

    if (Array.isArray(value)) {
      return value.map(String);
    }
  }

  return [];
}

function hasClarification(actual: unknown, keys: readonly string[]): boolean {
  if (!isRecord(actual)) {
    return false;
  }

  return keys.some((key) => {
    const value = actual[key];

    return typeof value === "string" && value.trim().endsWith("?");
  });
}

export function scoreMissingFieldBehavior(
  output: unknown,
  expectedMissingFields: readonly string[],
  options: MissingFieldBehaviorOptions = {},
): ScorerResult {
  const parsed = parseStructuredOutput(output);
  const missingFieldKeys = options.missingFieldKeys ?? [
    "missingSlots",
    "missing_slots",
    "missingFields",
    "missing_fields",
    "missing",
  ];
  const clarificationKeys = options.clarificationKeys ?? [
    "clarificationQuestion",
    "clarification_question",
    "question",
    "message",
  ];
  const actualMissingFields = readStringArray(parsed.value, missingFieldKeys);
  const matched = expectedMissingFields.filter((field) =>
    actualMissingFields.some((actual) => normalizeText(actual) === normalizeText(field)),
  );
  const missing = expectedMissingFields.filter(
    (field) => !matched.includes(field),
  );
  const extra = actualMissingFields.filter(
    (field) => !expectedMissingFields.some((expected) => normalizeText(expected) === normalizeText(field)),
  );
  const clarificationPresent = hasClarification(parsed.value, clarificationKeys);
  const expectedScore = expectedMissingFields.length === 0
    ? actualMissingFields.length === 0 ? 1 : 0
    : matched.length / expectedMissingFields.length;
  const clarificationScore = expectedMissingFields.length > 0
    ? clarificationPresent || matched.length > 0 ? 1 : 0
    : 1;
  const score = average([expectedScore, clarificationScore]);

  return makeResult(
    score,
    missing.length === 0 && (expectedMissingFields.length > 0 || extra.length === 0)
      ? "Missing-field behavior matches expectations."
      : "Missing-field behavior does not match expectations.",
    {
      expectedMissingFields,
      actualMissingFields,
      matched,
      missing,
      extra,
      clarificationPresent,
    },
    options.threshold,
  );
}

function readIntent(actual: unknown, intentKey: string): string {
  if (typeof actual === "string") {
    return actual;
  }

  if (!isRecord(actual)) {
    return "";
  }

  const value = actual[intentKey] ?? actual["label"] ?? actual["classification"];

  return typeof value === "string" ? value : "";
}

function readConfidence(actual: unknown, confidenceKey: string): number | undefined {
  if (!isRecord(actual)) {
    return undefined;
  }

  const value =
    actual[confidenceKey]
    ?? actual["confidence"]
    ?? actual["intentConfidence"]
    ?? actual["intent_confidence"];

  return typeof value === "number" ? value : undefined;
}

export function scoreIntentClassification(
  output: unknown,
  expectedIntent: string,
  options: IntentClassificationOptions = {},
): ScorerResult {
  const parsed = parseStructuredOutput(output);
  const intentKey = options.intentKey ?? "intent";
  const confidenceKey = options.confidenceKey ?? "confidence";
  const actualIntent = readIntent(parsed.value, intentKey);
  const exactMatch = normalizeText(actualIntent) === normalizeText(expectedIntent);
  const containedMatch = includesText(actualIntent, expectedIntent)
    || (typeof parsed.value === "string" && includesText(parsed.value, expectedIntent));
  const intentScore = exactMatch ? 1 : containedMatch ? 0.8 : 0;
  const confidence = readConfidence(parsed.value, confidenceKey);
  const confidenceScore =
    options.minConfidence === undefined || confidence === undefined
      ? 1
      : confidence >= options.minConfidence
        ? 1
        : confidence / options.minConfidence;
  const score = average([intentScore, confidenceScore]);

  return makeResult(
    score,
    intentScore > 0 && confidenceScore === 1
      ? "Intent classification matches expectations."
      : "Intent classification does not match expectations.",
    { expectedIntent, actualIntent, confidence, minConfidence: options.minConfidence },
    options.threshold,
  );
}

export function scoreStructuredOutput(
  output: unknown,
  spec: StructuredOutputSpec,
): ScorerResult {
  const checks: ScorerResult[] = [];

  if (spec.schema) {
    checks.push(scoreSchemaValidity(output, spec.schema));
  }

  if (spec.expectedFields) {
    checks.push(scoreFieldAccuracy(output, spec.expectedFields));
  }

  if (spec.expectedMissingFields) {
    checks.push(scoreMissingFieldBehavior(output, spec.expectedMissingFields));
  }

  if (spec.expectedIntent) {
    checks.push(
      spec.minIntentConfidence === undefined
        ? scoreIntentClassification(output, spec.expectedIntent)
        : scoreIntentClassification(output, spec.expectedIntent, {
            minConfidence: spec.minIntentConfidence,
          }),
    );
  }

  const score = average(checks.map((check) => check.score));
  const failed = checks.filter((check) => !check.passed);

  return makeResult(
    score,
    failed.length === 0
      ? "All configured structured-output checks passed."
      : `${failed.length} structured-output check(s) failed.`,
    { checks },
    1,
  );
}

export function createSchemaValidityScorer<TInput, TOutput, TExpected>(opts: {
  schema: (input: ScoreInput<TInput, TOutput, TExpected>) => ZodType;
  output?: (input: ScoreInput<TInput, TOutput, TExpected>) => unknown;
  options?: SchemaValidityOptions;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "schema_validity",
    description: "Checks that structured output satisfies the selected schema.",
    scorer: (input) =>
      scoreSchemaValidity(
        opts.output ? opts.output(input) : input.output,
        opts.schema(input),
        opts.options,
      ),
  });
}

export function createStructuredOutputScorer<TInput, TOutput, TExpected>(opts: {
  spec: (input: ScoreInput<TInput, TOutput, TExpected>) => StructuredOutputSpec;
  output?: (input: ScoreInput<TInput, TOutput, TExpected>) => unknown;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "structured_output",
    description: "Runs deterministic schema, field, missing-field, and intent checks.",
    scorer: (input) =>
      scoreStructuredOutput(opts.output ? opts.output(input) : input.output, opts.spec(input)),
  });
}
