import { evalite } from "evalite";
import { z } from "zod";

import type { MobileSearchOutput } from "../src/apps/index.ts";
import {
  MobileSearchRecordSchema,
  type MobileSearchRecord,
} from "../src/datasets/index.ts";
import {
  createStructuredOutputScorer,
  createEvaliteScorer,
  makeResult,
} from "../src/scorers/index.ts";
import { runMobileSearch } from "../src/variants/index.ts";

import { loadLabData, workshopColumns } from "./lab-utils.ts";

const MobileSearchOutputSchema = z.object({
  capability: z.literal("mobile_search"),
  variant: z.string(),
  intent: z.string(),
  slots: z.record(z.string(), z.unknown()),
  missingSlots: z.array(z.string()),
  ambiguity: z.string(),
  confidence: z.number(),
  followUpQuestions: z.array(z.string()),
  inventedSlots: z.array(z.string()),
});

evalite<MobileSearchRecord, MobileSearchOutput, MobileSearchRecord["expected"]>(
  "Lab 04 - Mobile Search Intent",
  {
    data: () =>
      loadLabData("data/evals/mobile-search-intents.jsonl", MobileSearchRecordSchema),
    task: (record) =>
      runMobileSearch(record.input, {
        variant: record.caseType === "failing" ? "baseline" : "improved",
      }),
    scorers: [
      createStructuredOutputScorer({
        spec: ({ expected }) => ({
          schema: MobileSearchOutputSchema,
          expectedIntent: expected.intent,
          expectedFields: expected.requiredSlots,
          expectedMissingFields: expected.missingSlots,
          minIntentConfidence: expected.minIntentConfidence,
        }),
      }),
      createEvaliteScorer({
        name: "disallowed_slots",
        description: "Checks that the evaluated output does not invent blocked slots.",
        scorer: ({ output, expected }) => {
          const present = expected.disallowedSlots.filter(
            (slot) => output.slots[slot] !== undefined || output.inventedSlots.includes(slot),
          );

          return makeResult(
            present.length === 0 ? 1 : 0,
            present.length === 0
              ? "No disallowed slots were produced."
              : "Disallowed slots were produced.",
            { disallowedSlots: expected.disallowedSlots, present },
            1,
          );
        },
      }),
    ],
    columns: workshopColumns,
  },
);
