import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import type { MobileSearchOutput } from "../src/apps/types";
import {
  MobileSearchRecordSchema,
  type MobileSearchRecord,
} from "../src/datasets/schemas";
import { createJudgeScorer } from "../src/scorers/judge";
import {
  createStructuredOutputScorer,
  scoreFieldAccuracy,
  scoreIntentClassification,
  scoreMissingFieldBehavior,
} from "../src/scorers/structured-output";
import { runMobileSearch } from "../src/variants/run-variants";

import {
  compactCaseId,
  formatScore,
  loadLabData,
  namedScore,
  resultFromChecks,
  requireExpected,
  sameStringSet,
} from "./lab-utils";

type ConversationColumnInput = Evalite.ColumnInput<
  MobileSearchRecord,
  MobileSearchOutput,
  MobileSearchRecord["expected"]
>;

function shortIntent(intent: string): string {
  if (intent === "ask_clarification") {
    return "ask";
  }

  if (intent === "filter_results") {
    return "flt";
  }

  if (intent === "compare_options") {
    return "cmp";
  }

  if (intent === "sort_results") {
    return "sort";
  }

  if (intent === "open_result") {
    return "open";
  }

  return intent;
}

function requiredSlotMatches(opts: ConversationColumnInput): number {
  const expected = requireExpected(opts.input.id, opts.expected);

  return Object.entries(expected.requiredSlots).filter(
    ([key, expectedValue]) =>
      JSON.stringify(opts.output.slots[key]) === JSON.stringify(expectedValue),
  ).length;
}

function conversationNext(opts: ConversationColumnInput): string {
  const expected = requireExpected(opts.input.id, opts.expected);
  const structured = namedScore(opts.scores, "structured_output");
  const state = namedScore(opts.scores, "conversation_state");

  if (opts.output.intent !== expected.intent) {
    return "intent";
  }

  if (opts.output.confidence < expected.minIntentConfidence) {
    return "confidence";
  }

  if (!sameStringSet(opts.output.missingSlots, expected.missingSlots)) {
    return "missing";
  }

  if (requiredSlotMatches(opts) < Object.keys(expected.requiredSlots).length) {
    return "slots";
  }

  if (typeof structured === "number" && structured < 0.7) {
    return "schema";
  }

  if (typeof state === "number" && state < 0.7) {
    return "state";
  }

  if (opts.input.caseType === "borderline") {
    return "policy";
  }

  return "pass";
}

function conversationColumns(
  opts: ConversationColumnInput,
): Evalite.RenderedColumn[] {
  const expected = requireExpected(opts.input.id, opts.expected);
  const requiredCount = Object.keys(expected.requiredSlots).length;
  const missingStatus = sameStringSet(opts.output.missingSlots, expected.missingSlots)
    ? "ok"
    : "diff";

  return [
    {
      label: "case",
      value: compactCaseId(opts.input.id, "mobile-convo-")
        .replace("compare-first-two-flights", "compare-1-2")
        .replace("nonstop-ambiguous", "nonstop")
        .replace("sort-duration", "sort")
        .replace("filter-fare", "fare"),
    },
    {
      label: "intent",
      value: `${shortIntent(expected.intent)}->${shortIntent(opts.output.intent)}`,
    },
    { label: "slots", value: `${requiredSlotMatches(opts)}/${requiredCount} ${missingStatus}` },
    { label: "state", value: formatScore(namedScore(opts.scores, "conversation_state")) },
    { label: "next", value: conversationNext(opts) },
  ];
}

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
    columns: conversationColumns,
  },
);
