import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import type { TravelSummaryOutput } from "../src/apps/types";
import {
  TravelSummaryRecordSchema,
  type TravelSummaryRecord,
} from "../src/datasets/schemas";
import { createJudgeScorer } from "../src/scorers/judge";
import { createSummaryScorer } from "../src/scorers/summary";
import { runTravelSummary } from "../src/variants/run-variants";

import {
  compactCaseId,
  formatScore,
  loadLabData,
  namedScore,
  requireExpected,
  summaryText,
} from "./lab-utils";

type SummaryColumnInput = Evalite.ColumnInput<
  TravelSummaryRecord,
  TravelSummaryOutput,
  TravelSummaryRecord["expected"]
>;

function summaryFocus(opts: SummaryColumnInput): string {
  const expected = requireExpected(opts.input.id, opts.expected);

  if (expected.insufficientSource) {
    return "limits";
  }

  if (expected.includeWarning) {
    return "warning";
  }

  return "facts";
}

function summaryNext(opts: SummaryColumnInput): string {
  const source = namedScore(opts.scores, "source_grounded_summary");
  const judge = namedScore(opts.scores, "rubric_judge");

  if (typeof source === "number" && source < 0.72) {
    return "source";
  }

  if (typeof judge === "number" && judge < 0.72) {
    return "quality";
  }

  if (opts.input.caseType === "borderline") {
    return "policy";
  }

  return "pass";
}

function summaryColumns(opts: SummaryColumnInput): Evalite.RenderedColumn[] {
  return [
    {
      label: "case",
      value: compactCaseId(opts.input.id, "travel-summary-")
        .replace("luggage-unsupported", "luggage")
        .replace("shuttle-insufficient", "shuttle")
        .replace("rain-warning", "rain")
        .replace("ferry-window", "ferry"),
    },
    { label: "focus", value: summaryFocus(opts) },
    { label: "source", value: formatScore(namedScore(opts.scores, "source_grounded_summary")) },
    { label: "judge", value: formatScore(namedScore(opts.scores, "rubric_judge")) },
    { label: "next", value: summaryNext(opts) },
  ];
}

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
    columns: summaryColumns,
  },
);
