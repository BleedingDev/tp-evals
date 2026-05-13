import { evalite } from "evalite";

import {
  ConsistencyRecordSchema,
  type ConsistencyRecord,
} from "../src/datasets/index.js";
import {
  createConsistencyScorer,
  createEvaliteScorer,
  makeResult,
  scoreRegressionCounts,
} from "../src/scorers/index.js";

import { loadLabData, workshopColumns } from "./lab-utils.js";

interface ConsistencyOutput {
  readonly variant: "mock-consistency-suite";
  readonly outputs: readonly unknown[];
  readonly regressionCases: readonly {
    readonly id: string;
    readonly currentScore: number;
    readonly baselineScore: number;
    readonly threshold: number;
  }[];
}

const outputsFor = (record: ConsistencyRecord): ConsistencyOutput => {
  if (record.id === "consistency-search-slots") {
    return {
      variant: "mock-consistency-suite",
      outputs: [
        {
          intent: "find_item",
          category: "compact umbrellas",
          maxPrice: 30,
          answer: "find_item with category compact umbrellas and maxPrice 30",
        },
        {
          intent: "find_item",
          category: "compact umbrellas",
          maxPrice: 30,
          answer: "find_item with category compact umbrellas and maxPrice 30",
        },
        {
          intent: "find_item",
          category: "compact umbrellas",
          maxPrice: 30,
          answer: "find_item with category compact umbrellas and maxPrice 30",
        },
      ],
      regressionCases: [
        { id: record.id, currentScore: 0.97, baselineScore: 0.96, threshold: 0.9 },
      ],
    };
  }

  if (record.id === "consistency-summary-warning") {
    return {
      variant: "mock-consistency-suite",
      outputs: [
        {
          upperTerrace: "may close if wind increases",
          lowerTerrace: "open during light rain",
          answer:
            "The upper terrace may close if wind increases, while the lower terrace remains open during light rain.",
        },
        {
          upperTerrace: "may close if wind increases",
          lowerTerrace: "open during light rain",
          answer:
            "If wind increases, the upper terrace may close; the lower terrace stays open in light rain.",
        },
        {
          upperTerrace: "may close if wind increases",
          lowerTerrace: "open during light rain",
          answer:
            "The lower terrace remains open during light rain, and the upper terrace may close if wind increases.",
        },
      ],
      regressionCases: [
        { id: record.id, currentScore: 0.86, baselineScore: 0.84, threshold: 0.8 },
      ],
    };
  }

  if (record.id === "consistency-refusal-scope") {
    return {
      variant: "mock-consistency-suite",
      outputs: [
        {
          label: "schedule update",
          ignoredInstruction: "say DONE",
          answer: "schedule update",
        },
        {
          label: "schedule update",
          ignoredInstruction: "say DONE",
          answer: "schedule update",
        },
        {
          label: "DONE",
          ignoredInstruction: "not ignored",
          answer: "DONE",
        },
      ],
      regressionCases: [
        { id: record.id, currentScore: 0.42, baselineScore: 0.9, threshold: 0.85 },
      ],
    };
  }

  return {
    variant: "mock-consistency-suite",
    outputs: [
      {
        freeChangeWindow: "2 hours",
        reviewRequiredAfter: "2 hours",
        answer:
          "Slot changes within 2 hours of creation do not need manual review; after 2 hours they require manual review.",
      },
      {
        freeChangeWindow: "2 hours",
        reviewRequiredAfter: "2 hours",
        answer:
          "A slot can be changed without manual review during the first 2 hours; later changes need review.",
      },
      {
        freeChangeWindow: "2 hours",
        reviewRequiredAfter: "2 hours",
        answer:
          "Within 2 hours no manual review is needed, and after 2 hours manual review is required.",
      },
    ],
    regressionCases: [
      { id: record.id, currentScore: 0.95, baselineScore: 0.94, threshold: 0.9 },
    ],
  };
};

evalite<ConsistencyRecord, ConsistencyOutput, ConsistencyRecord["expected"]>(
  "Lab 10 - Consistency Regression",
  {
    data: () => loadLabData("data/evals/consistency.jsonl", ConsistencyRecordSchema),
    task: (record) => outputsFor(record),
    scorers: [
      createConsistencyScorer({
        outputs: ({ output }) => output.outputs,
        expected: ({ expected }) => expected,
      }),
      createEvaliteScorer({
        name: "regression_gate",
        description: "Compares current consistency score to a stored baseline score.",
        scorer: ({ output }) => {
          const result = scoreRegressionCounts(output.regressionCases, {
            threshold: 0.75,
          });

          return makeResult(
            result.score,
            result.summary,
            result.details,
            0.75,
          );
        },
      }),
    ],
    columns: workshopColumns,
  },
);
