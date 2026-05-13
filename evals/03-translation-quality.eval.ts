import { evalite } from "evalite";

import type { TranslationOutput } from "../src/apps/index.js";
import {
  TranslationRecordSchema,
  type TranslationRecord,
} from "../src/datasets/index.js";
import {
  createJudgeScorer,
  createTextGuardrailScorer,
} from "../src/scorers/index.js";
import { runTranslationVariant } from "../src/variants/index.js";

import { loadLabData, outputText, workshopColumns } from "./lab-utils.js";

evalite<TranslationRecord, TranslationOutput, TranslationRecord["expected"]>(
  "Lab 03 - Translation Quality Judge",
  {
    data: async () => [
      ...(await loadLabData("data/evals/translations-basic.jsonl", TranslationRecordSchema)),
      ...(await loadLabData("data/evals/translations-edge-cases.jsonl", TranslationRecordSchema)),
    ],
    task: (record) =>
      runTranslationVariant(record.input, {
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
    columns: workshopColumns,
  },
);
