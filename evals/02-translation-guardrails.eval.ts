import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import {
  TranslationRecordSchema,
  type TranslationRecord,
} from "../src/datasets/schemas";
import { runTranslation } from "../src/variants/run-variants";
import {
  createForbiddenPhraseScorer,
  createTextGuardrailScorer,
  scoreGlossaryTerms,
  scorePlaceholders,
  scoreTags,
} from "../src/scorers/text-quality";
import type { TranslationOutput } from "../src/apps/types";

import {
  compactCaseId,
  formatScore,
  loadLabData,
  namedScore,
  outputText,
  resultFromChecks,
} from "./lab-utils";

type GuardrailColumnInput = Evalite.ColumnInput<
  TranslationRecord,
  TranslationOutput,
  TranslationRecord["expected"]
>;

function shortCaseId(id: string): string {
  return compactCaseId(id, "translation-edge-")
    .replace("placeholders-es", "ph-es")
    .replace("tags-fr", "tags")
    .replace("drawer-es", "drawer")
    .replace("mode-de", "mode");
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

function guardrailNext(opts: GuardrailColumnInput): string {
  const guard = namedScore(opts.scores, "text_guardrails");
  const forbidden = namedScore(opts.scores, "forbidden_phrases");

  if (typeof guard === "number" && guard < 0.7) {
    return "hard fail";
  }

  if (typeof forbidden === "number" && forbidden < 1) {
    return "forbidden";
  }

  if (opts.input.caseType === "borderline") {
    return "review";
  }

  return "pass";
}

function guardrailColumns(
  opts: GuardrailColumnInput,
): Evalite.RenderedColumn[] {
  return [
    { label: "case", value: shortCaseId(opts.input.id) },
    { label: "type", value: shortCaseType(opts.input.caseType) },
    { label: "guard", value: formatScore(namedScore(opts.scores, "text_guardrails")) },
    { label: "forbid", value: formatScore(namedScore(opts.scores, "forbidden_phrases")) },
    { label: "next", value: guardrailNext(opts) },
  ];
}

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
    columns: guardrailColumns,
  },
);
