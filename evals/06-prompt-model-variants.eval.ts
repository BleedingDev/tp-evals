import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import type { TranslationOutput } from "../src/apps/types";
import {
  TranslationRecordSchema,
  type TranslationRecord,
} from "../src/datasets/schemas";
import { createJudgeScorer } from "../src/scorers/judge";
import { createTextGuardrailScorer } from "../src/scorers/text-quality";
import {
  getVariant,
  runTranslation,
  type VariantId,
} from "../src/variants/run-variants";

import {
  compactCaseId,
  formatScore,
  loadLabData,
  namedScore,
  outputText,
} from "./lab-utils";

const variants: Array<{ name: string; input: VariantId }> = [
  { name: "plain", input: "translation.flawed" },
  { name: "guard", input: "translation.improved" },
];

type VariantColumnInput = Evalite.ColumnInput<
  TranslationRecord,
  TranslationOutput,
  TranslationRecord["expected"]
>;

function variantNext(opts: VariantColumnInput): string {
  const guard = namedScore(opts.scores, "text_guardrails");
  const judge = namedScore(opts.scores, "rubric_judge");

  if (typeof guard === "number" && guard < 0.7) {
    return "block";
  }

  if (typeof judge === "number" && judge < 0.68) {
    return "quality";
  }

  if (opts.input.caseType === "borderline") {
    return "compare";
  }

  return "pass";
}

function variantColumns(opts: VariantColumnInput): Evalite.RenderedColumn[] {
  return [
    {
      label: "case",
      value: compactCaseId(opts.input.id, "translation-edge-")
        .replace("placeholders-es", "ph")
        .replace("tags-fr", "tags")
        .replace("drawer-es", "drawer"),
    },
    { label: "risk", value: opts.input.risk },
    { label: "guard", value: formatScore(namedScore(opts.scores, "text_guardrails")) },
    { label: "judge", value: formatScore(namedScore(opts.scores, "rubric_judge")) },
    { label: "next", value: variantNext(opts) },
  ];
}

evalite.each(variants)<TranslationRecord, TranslationOutput, TranslationRecord["expected"]>(
  "Lab 06 - Live Prompt Variants",
  {
    data: async () => {
      const records = await loadLabData(
        "data/evals/translations-edge-cases.jsonl",
        TranslationRecordSchema,
      );

      return records.filter((record) =>
        [
          "translation-edge-placeholders-es",
          "translation-edge-tags-fr",
          "translation-edge-drawer-es",
        ].includes(record.input.id),
      );
    },
    task: (record, variantId) => runTranslation(record.input, { variantId }),
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
        threshold: 0.68,
      }),
      {
        name: "variant_profile",
        description: "Reports the live prompt variant under test.",
        scorer: (_input) => ({
          score: 1,
          name: "variant_profile",
          description: "Variant metadata is attached for comparison.",
          metadata: {
            variants: variants.map((variant) => getVariant(variant.input)),
          },
        }),
      },
    ],
    columns: variantColumns,
  },
);
