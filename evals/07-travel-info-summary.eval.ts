import { evalite } from "evalite";

import type { TravelSummaryOutput } from "../src/apps/index.ts";
import {
  TravelSummaryRecordSchema,
  type TravelSummaryRecord,
} from "../src/datasets/index.ts";
import {
  createJudgeScorer,
  createSummaryScorer,
} from "../src/scorers/index.ts";
import { runTravelSummary } from "../src/variants/index.ts";

import { loadLabData, summaryText, workshopColumns } from "./lab-utils.ts";

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
