import { evalite } from "evalite";

import {
  TranslationRecordSchema,
  type TranslationRecord,
} from "../src/datasets/index.js";
import { runTranslation } from "../src/variants/index.js";
import {
  createForbiddenPhraseScorer,
  createTextGuardrailScorer,
  scoreGlossaryTerms,
  scorePlaceholders,
  scoreTags,
} from "../src/scorers/index.js";
import type { TranslationOutput } from "../src/apps/index.js";

import {
  loadLabData,
  outputText,
  resultFromChecks,
  workshopColumns,
} from "./lab-utils.js";

evalite<TranslationRecord, TranslationOutput, TranslationRecord["expected"]>(
  "Lab 02 - Translation Guardrails",
  {
    data: () =>
      loadLabData("data/evals/translations-edge-cases.jsonl", TranslationRecordSchema),
    task: (record) =>
      runTranslation(record.input, {
        variant: record.caseType === "failing" ? "flawed" : "baseline",
      }),
    scorers: [
      createTextGuardrailScorer({
        output: outputText,
        spec: ({ input, expected }) => ({
          placeholders: input.input.placeholders ?? expected.mustPreserve,
          sourceText: input.input.sourceText,
          requiredTags: expected.mustPreserve.filter((value) => value.startsWith("<")),
          forbiddenPhrases: expected.forbiddenPatterns,
          expectedLanguage: input.input.targetLanguage,
          ...(expected.glossary === undefined ? {} : { glossary: expected.glossary }),
        }),
      }),
      createForbiddenPhraseScorer({
        output: outputText,
        forbiddenPhrases: ({ expected }) => expected.forbiddenPatterns,
      }),
      {
        name: "protected_fragment_breakdown",
        description: "Shows which protected fragments failed independently.",
        scorer: ({ input, output, expected }) => {
          const checks = [
            scorePlaceholders(output.text, input.input.placeholders ?? []),
            scoreTags(output.text, { sourceText: input.input.sourceText }),
            scoreGlossaryTerms(output.text, expected.glossary ?? {}),
          ];

          return resultFromChecks(
            checks,
            "Protected fragments, tags, and glossary terms are acceptable.",
            0.75,
          );
        },
      },
    ],
    columns: workshopColumns,
  },
);
