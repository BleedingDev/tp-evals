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
import {
  getVariant,
  runTranslation,
  type VariantId,
} from "../src/variants/index.js";

import { loadLabData, outputText, workshopColumns } from "./lab-utils.js";

const variants: Array<{ name: string; input: VariantId }> = [
  { name: "plain-ui-translation", input: "translation.baseline" },
  { name: "guardrailed-translation", input: "translation.improved" },
];

evalite.each(variants)<TranslationRecord, TranslationOutput, TranslationRecord["expected"]>(
  "Lab 06 - Prompt And Model-Like Variants",
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
        description: "Reports the prompt/model-like variant under test.",
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
