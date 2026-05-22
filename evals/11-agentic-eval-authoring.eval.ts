import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import type { TravelSummaryOutput } from "../src/apps/types";
import {
  TravelSummaryRecordSchema,
  type TravelSummaryRecord,
} from "../src/datasets/schemas";
import {
  createEvaliteScorer,
  makeResult,
} from "../src/scorers/common";
import { createJudgeScorer } from "../src/scorers/judge";
import { createSummaryScorer } from "../src/scorers/summary";
import { runTravelSummary } from "../src/variants/run-variants";

import {
  compactCaseId,
  formatScore,
  loadLabData,
  namedScore,
  summaryText,
} from "./lab-utils";

type AgentAuthoringColumnInput = Evalite.ColumnInput<
  TravelSummaryRecord,
  TravelSummaryOutput,
  TravelSummaryRecord["expected"]
>;

function agentAuthoringNext(opts: AgentAuthoringColumnInput): string {
  const source = namedScore(opts.scores, "source_grounded_summary");
  const judge = namedScore(opts.scores, "rubric_judge");
  const review = namedScore(opts.scores, "dataset_authoring_review");

  if (typeof review === "number" && review < 1) {
    return "metadata";
  }

  if (typeof source === "number" && source < 0.72) {
    return "source";
  }

  if (typeof judge === "number" && judge < 0.72) {
    return "quality";
  }

  if (opts.input.caseType === "borderline") {
    return "review";
  }

  return "pass";
}

function agentAuthoringColumns(
  opts: AgentAuthoringColumnInput,
): Evalite.RenderedColumn[] {
  return [
    {
      label: "case",
      value: compactCaseId(opts.input.id, "agent-summary-")
        .replace("missing-fee-policy", "fee-policy")
        .replace("transfer-warning", "transfer"),
    },
    { label: "source", value: formatScore(namedScore(opts.scores, "source_grounded_summary")) },
    { label: "judge", value: formatScore(namedScore(opts.scores, "rubric_judge")) },
    { label: "review", value: formatScore(namedScore(opts.scores, "dataset_authoring_review")) },
    { label: "next", value: agentAuthoringNext(opts) },
  ];
}

evalite<TravelSummaryRecord, TravelSummaryOutput, TravelSummaryRecord["expected"]>(
  "Lab 11 - Agentic Eval Authoring",
  {
    data: () =>
      loadLabData("data/evals/agent-authored-summary.jsonl", TravelSummaryRecordSchema),
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
      createEvaliteScorer({
        name: "dataset_authoring_review",
        description: "Checks that agent-authored cases carry reviewable QA metadata.",
        scorer: ({ input }) => {
          const hasAgentLabel = input.labels.includes("agent-authored");
          const hasReviewHint = input.metadata.reviewHint !== undefined;
          const hasEditTargets = input.metadata.participantEditTargets.length > 0;
          const hasNotes = input.expected.notes.length > 0;
          const score = [hasAgentLabel, hasReviewHint, hasEditTargets, hasNotes]
            .filter(Boolean).length / 4;

          return makeResult(
            score,
            score === 1
              ? "Dataset case is reviewable and workshop-safe."
              : "Dataset case is missing review metadata.",
            {
              hasAgentLabel,
              hasReviewHint,
              hasEditTargets,
              hasNotes,
            },
            1,
          );
        },
      }),
    ],
    columns: agentAuthoringColumns,
  },
);
