import { readFile } from "node:fs/promises";
import type { ZodType } from "zod";

import { DatasetRecordSchema, type DatasetRecord } from "./schemas";

export const DATASET_ROOT = "data/evals";

export const INTENTIONALLY_BROKEN_DATASET =
  "data/evals/dataset-quality-broken.jsonl";

export const REQUIRED_DATASET_FILES = [
  INTENTIONALLY_BROKEN_DATASET,
  "data/evals/translations-basic.jsonl",
  "data/evals/translations-edge-cases.jsonl",
  "data/evals/mobile-search-intents.jsonl",
  "data/evals/mobile-search-conversation.jsonl",
  "data/evals/travel-info-summary.jsonl",
  "data/evals/prompt-injection.jsonl",
  "data/evals/consistency.jsonl",
] as const;

export type RequiredDatasetFile = (typeof REQUIRED_DATASET_FILES)[number];

export interface JsonlRecord<T = unknown> {
  lineNumber: number;
  value: T;
  raw: string;
}

export interface DatasetValidationIssue {
  filePath: string;
  lineNumber: number;
  code: "json_parse" | "schema";
  message: string;
  path?: string[];
}

export interface ParsedJsonl {
  records: Array<JsonlRecord<unknown>>;
  issues: DatasetValidationIssue[];
}

export interface LoadedDataset<T> {
  filePath: string;
  records: T[];
  issues: DatasetValidationIssue[];
  totalJsonRecords: number;
}

export function parseJsonl(text: string, filePath = "<memory>"): ParsedJsonl {
  const records: Array<JsonlRecord<unknown>> = [];
  const issues: DatasetValidationIssue[] = [];
  const lines = text.split(/\r?\n/);

  for (const [index, raw] of lines.entries()) {
    const lineNumber = index + 1;

    if (raw.trim().length === 0) {
      continue;
    }

    try {
      records.push({
        lineNumber,
        raw,
        value: JSON.parse(raw) as unknown,
      });
    } catch (error) {
      issues.push({
        filePath,
        lineNumber,
        code: "json_parse",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { records, issues };
}

export function validateJsonlRecords<T>(
  parsed: ParsedJsonl,
  schema: ZodType<T>,
  filePath = "<memory>",
): LoadedDataset<T> {
  const records: T[] = [];
  const issues = [...parsed.issues];

  for (const record of parsed.records) {
    const result = schema.safeParse(record.value);

    if (result.success) {
      records.push(result.data);
      continue;
    }

    for (const issue of result.error.issues) {
      issues.push({
        filePath,
        lineNumber: record.lineNumber,
        code: "schema",
        message: issue.message,
        path: issue.path.map(String),
      });
    }
  }

  return {
    filePath,
    records,
    issues,
    totalJsonRecords: parsed.records.length,
  };
}

export async function loadJsonlFile(
  filePath: string,
): Promise<LoadedDataset<DatasetRecord>>;
export async function loadJsonlFile<T>(
  filePath: string,
  schema: ZodType<T>,
): Promise<LoadedDataset<T>>;
export async function loadJsonlFile<T>(
  filePath: string,
  schema?: ZodType<T>,
): Promise<LoadedDataset<T> | LoadedDataset<DatasetRecord>> {
  const text = await readFile(filePath, "utf8");
  const parsed = parseJsonl(text, filePath);

  if (schema) {
    return validateJsonlRecords(parsed, schema, filePath);
  }

  return validateJsonlRecords(parsed, DatasetRecordSchema, filePath);
}

export function formatDatasetIssue(issue: DatasetValidationIssue): string {
  const path = issue.path && issue.path.length > 0 ? ` ${issue.path.join(".")}` : "";
  return `${issue.filePath}:${issue.lineNumber} ${issue.code}${path} - ${issue.message}`;
}
