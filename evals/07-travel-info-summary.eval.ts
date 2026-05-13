import { evalite } from "evalite";

import type { TravelSummaryOutput } from "../src/apps/index.js";
import {
  TravelSummaryRecordSchema,
  type TravelSummaryRecord,
} from "../src/datasets/index.js";
import {
  createJudgeScorer,
  createSummaryScorer,
} from "../src/scorers/index.js";
import { runTravelSummaryVariant } from "../src/variants/index.js";

import { loadLabData, summaryText, workshopColumns } from "./lab-utils.js";

evalite<TravelSummaryRecord, TravelSummaryOutput, TravelSummaryRecord["expected"]>(
  "Lab 07 - Travel Info Summary",
  {
    data: () =>
      loadLabData("data/evals/travel-info-summary.jsonl", TravelSummaryRecordSchema),
    task: (record) =>
      runTravelSummaryVariant(record.input, {
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
