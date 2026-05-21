import { evalite } from "evalite";

import type { TravelSummaryOutput } from "../src/apps/index.ts";
import {
  TravelSummaryRecordSchema,
  type TravelSummaryRecord,
} from "../src/datasets/index.ts";
import {
  createEvaliteScorer,
  createJudgeScorer,
  createSummaryScorer,
  makeResult,
} from "../src/scorers/index.ts";
import { runTravelSummary } from "../src/variants/index.ts";

import { loadLabData, summaryText, workshopColumns } from "./lab-utils.ts";

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
    columns: workshopColumns,
  },
);
