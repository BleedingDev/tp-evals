import { evalite } from "evalite";

import type { TravelSummaryOutput } from "../src/apps/types";
import {
  TravelSummaryRecordSchema,
  type TravelSummaryRecord,
} from "../src/datasets/schemas";
import { createJudgeScorer } from "../src/scorers/judge";
import { createSummaryScorer } from "../src/scorers/summary";
import { runTravelSummary } from "../src/variants/run-variants";

import { loadLabData, summaryText, workshopColumns } from "./lab-utils";

evalite<TravelSummaryRecord, TravelSummaryOutput, TravelSummaryRecord["expected"]>(
  "Lab 07 - Travel Info Summary",
  {
    data: () =>
      loadLabData("data/evals/travel-info-summary.jsonl", TravelSummaryRecordSchema),
    task: (record) =>
      runTravelSummary(record.input, {
        variant: record.caseType === "failing" ? "flawed" : "improved",
      }),
    scorers: [
      createSummaryScorer({
        output: summaryText,
        sourceText: ({ input }) => input.input.sourceText,
        expected: ({ expected }) => expected,
      }),
      createJudgeScorer({
        rubric: () => "summary",
        output: ({ output }) => output.summary,
        threshold: 0.72,
      }),
    ],
    columns: workshopColumns,
  },
);
