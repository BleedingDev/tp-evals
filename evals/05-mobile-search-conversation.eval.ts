import { evalite } from "evalite";

import type { MobileSearchOutput } from "../src/apps/index.js";
import {
  MobileSearchRecordSchema,
  type MobileSearchRecord,
} from "../src/datasets/index.js";
import {
  createJudgeScorer,
  createStructuredOutputScorer,
  scoreFieldAccuracy,
  scoreIntentClassification,
  scoreMissingFieldBehavior,
} from "../src/scorers/index.js";
import { runMobileSearch } from "../src/variants/index.js";

import {
  loadLabData,
  resultFromChecks,
  workshopColumns,
} from "./lab-utils.js";

evalite<MobileSearchRecord, MobileSearchOutput, MobileSearchRecord["expected"]>(
  "Lab 05 - Mobile Search Conversation",
  {
    data: () =>
      loadLabData(
        "data/evals/mobile-search-conversation.jsonl",
        MobileSearchRecordSchema,
      ),
    task: (record) => runMobileSearch(record.input, { variant: "baseline" }),
    scorers: [
      createStructuredOutputScorer({
        spec: ({ expected }) => ({
          expectedIntent: expected.intent,
          expectedFields: expected.requiredSlots,
          expectedMissingFields: expected.missingSlots,
          minIntentConfidence: expected.minIntentConfidence,
        }),
      }),
      {
        name: "conversation_state",
        description: "Breaks out intent, carried slots, and missing-slot behavior.",
        scorer: ({ output, expected }) =>
          resultFromChecks(
            [
              scoreIntentClassification(output, expected.intent, {
                minConfidence: expected.minIntentConfidence,
              }),
              scoreFieldAccuracy(output, expected.requiredSlots),
              scoreMissingFieldBehavior(output, expected.missingSlots),
            ],
            "Conversation state was used correctly.",
            0.7,
          ),
      },
      createJudgeScorer({
        rubric: () => "structuredIntent",
        threshold: 0.68,
      }),
    ],
    columns: workshopColumns,
  },
);
