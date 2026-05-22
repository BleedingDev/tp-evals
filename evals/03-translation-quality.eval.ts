import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import type { TranslationOutput } from "../src/apps/types";
import {
  TranslationRecordSchema,
  type TranslationRecord,
} from "../src/datasets/schemas";
import { createJudgeScorer } from "../src/scorers/judge";
import { createTextGuardrailScorer } from "../src/scorers/text-quality";
import { runTranslation } from "../src/variants/run-variants";

import { loadLabData, outputText } from "./lab-utils";

type TranslationColumnInput = Evalite.ColumnInput<
  TranslationRecord,
  TranslationOutput,
  TranslationRecord["expected"]
>;

function namedScore(
  opts: TranslationColumnInput,
  name: string,
): number | undefined {
  const score = opts.scores.find((candidate) => candidate.name === name)?.score;
  return typeof score === "number" ? score : undefined;
}

function formatScore(score: number | undefined): string {
  return typeof score === "number" ? score.toFixed(2) : "n/a";
}

function reviewDecision(opts: TranslationColumnInput): string {
  const guardrails = namedScore(opts, "text_guardrails");
  const judge = namedScore(opts, "rubric_judge");

  if (typeof guardrails === "number" && guardrails < 0.7) {
    return "hard fail";
  }

  if (typeof judge === "number" && judge < 0.72) {
    return "quality";
  }

  if (opts.input.caseType === "borderline") {
    return "policy";
  }

  return "pass";
}

function shortCaseId(id: string): string {
  return id
    .replace(/^translation-/u, "")
    .replace("edge-placeholders-es", "ph-es")
    .replace("basic-cancel-es", "cancel")
    .replace("basic-save-es", "save")
    .replace("basic-pass-es", "pass")
    .replace("edge-tags-fr", "tags")
    .replace("edge-drawer-es", "drawer")
    .replace("edge-mode-de", "mode");
}

function shortCaseType(type: TranslationRecord["caseType"]): string {
  if (type === "passing") {
    return "pass";
  }

  if (type === "failing") {
    return "fail";
  }

  return "border";
}

function translationQualityColumns(
  opts: TranslationColumnInput,
): Evalite.RenderedColumn[] {
  return [
    { label: "case", value: shortCaseId(opts.input.id) },
    { label: "type", value: shortCaseType(opts.input.caseType) },
    { label: "guard", value: formatScore(namedScore(opts, "text_guardrails")) },
    { label: "judge", value: formatScore(namedScore(opts, "rubric_judge")) },
    { label: "next", value: reviewDecision(opts) },
  ];
}

evalite<TranslationRecord, TranslationOutput, TranslationRecord["expected"]>(
  "Lab 03 - Translation Quality Judge",
  {
    data: async () => [
      ...(await loadLabData("data/evals/translations-basic.jsonl", TranslationRecordSchema)),
      ...(await loadLabData("data/evals/translations-edge-cases.jsonl", TranslationRecordSchema)),
    ],
    task: (record) =>
      runTranslation(record.input, {
        variant: record.caseType === "failing" ? "flawed" : "improved",
      }),
    scorers: [
      createTextGuardrailScorer({
        output: outputText,
        spec: ({ input, expected }) => ({
          placeholders: input.input.placeholders ?? expected.mustPreserve,
          sourceText: input.input.sourceText,
          forbiddenPhrases: expected.forbiddenPatterns,
          expectedLanguage: input.input.targetLanguage,
          ...(expected.glossary === undefined ? {} : { glossary: expected.glossary }),
        }),
      }),
      createJudgeScorer({
        rubric: () => "translation",
        output: ({ output }) => output.text,
        threshold: 0.72,
      }),
    ],
    columns: translationQualityColumns,
  },
);
