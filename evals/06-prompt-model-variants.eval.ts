import { evalite } from "evalite";

import type { TranslationOutput } from "../src/apps/index.ts";
import {
  TranslationRecordSchema,
  type TranslationRecord,
} from "../src/datasets/index.ts";
import {
  createJudgeScorer,
  createTextGuardrailScorer,
} from "../src/scorers/index.ts";
import {
  getVariant,
  runTranslation,
  type VariantId,
} from "../src/variants/index.ts";

import { loadLabData, outputText, workshopColumns } from "./lab-utils.ts";

const variants: Array<{ name: string; input: VariantId }> = [
  { name: "plain-ui-translation", input: "translation.flawed" },
  { name: "guardrailed-translation", input: "translation.improved" },
];

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
    columns: workshopColumns,
  },
);
