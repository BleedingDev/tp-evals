import { evalite } from "evalite";
import type { Evalite } from "evalite/types";
import { z } from "zod";

import type { MobileSearchOutput } from "../src/apps/types";
import {
  MobileSearchRecordSchema,
  type MobileSearchRecord,
} from "../src/datasets/schemas";
import {
  createEvaliteScorer,
  makeResult,
} from "../src/scorers/common";
import { createStructuredOutputScorer } from "../src/scorers/structured-output";
import { runMobileSearch } from "../src/variants/run-variants";

import { loadLabData } from "./lab-utils";

type MobileSearchColumnInput = Evalite.ColumnInput<
  MobileSearchRecord,
  MobileSearchOutput,
  MobileSearchRecord["expected"]
>;

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

function shortCaseId(id: string): string {
  return id
    .replace(/^mobile-intent-/u, "")
    .replace("roundtrip-budget", "roundtrip")
    .replace("denver-missing-origin-date", "denver")
    .replace("oneway-missing-refinements", "oneway")
    .replace("open-third-no-context", "open-third");
}

function shortIntent(intent: string): string {
  if (intent === "ask_clarification") {
    return "ask";
  }

  if (intent === "find_item") {
    return "find";
  }

  if (intent === "open_result") {
    return "open";
  }

  return intent;
}

function expectedOf(opts: MobileSearchColumnInput): MobileSearchRecord["expected"] {
  if (opts.expected === undefined) {
    throw new Error(`Missing expected data for ${opts.input.id}.`);
  }

  return opts.expected;
}

function matchingRequiredSlots(opts: MobileSearchColumnInput): number {
  const expected = expectedOf(opts);

  return Object.entries(expected.requiredSlots).filter(
    ([key, expectedValue]) => opts.output.slots[key] === expectedValue,
  ).length;
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

function presentDisallowedSlots(opts: MobileSearchColumnInput): string[] {
  const expected = expectedOf(opts);

  return expected.disallowedSlots.filter(
    (slot) => opts.output.slots[slot] !== undefined || opts.output.inventedSlots.includes(slot),
  );
}

function nextAction(opts: MobileSearchColumnInput): string {
  const expected = expectedOf(opts);

  if (opts.output.intent !== expected.intent) {
    return "intent";
  }

  if (presentDisallowedSlots(opts).length > 0) {
    return "invented";
  }

  if (!sameStringSet(opts.output.missingSlots, expected.missingSlots)) {
    return "missing";
  }

  if (matchingRequiredSlots(opts) < Object.keys(expected.requiredSlots).length) {
    return "slots";
  }

  if (opts.output.confidence < expected.minIntentConfidence) {
    return "confidence";
  }

  if (opts.input.caseType === "borderline") {
    return "policy";
  }

  return "pass";
}

function mobileSearchIntentColumns(
  opts: MobileSearchColumnInput,
): Evalite.RenderedColumn[] {
  const expected = expectedOf(opts);
  const requiredSlotCount = Object.keys(expected.requiredSlots).length;
  const missingStatus = sameStringSet(opts.output.missingSlots, expected.missingSlots)
    ? "ok"
    : "diff";

  return [
    { label: "case", value: shortCaseId(opts.input.id) },
    {
      label: "intent",
      value: `${shortIntent(expected.intent)}->${shortIntent(opts.output.intent)}`,
    },
    {
      label: "conf",
      value: `${opts.output.confidence.toFixed(2)}/${expected.minIntentConfidence.toFixed(2)}`,
    },
    {
      label: "slots",
      value: `${matchingRequiredSlots(opts)}/${requiredSlotCount} ${missingStatus}`,
    },
    { label: "next", value: nextAction(opts) },
  ];
}

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
    columns: mobileSearchIntentColumns,
  },
);
