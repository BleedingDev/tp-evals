import { evalite } from "evalite";
import type { Evalite } from "evalite/types";

import {
  ConsistencyRecordSchema,
  type ConsistencyRecord,
} from "../src/datasets/schemas";
import {
  createEvaliteScorer,
  makeResult,
} from "../src/scorers/common";
import {
  createConsistencyScorer,
  scoreRegressionCounts,
} from "../src/scorers/consistency";

import {
  compactCaseId,
  formatScore,
  loadLabData,
  namedScore,
} from "./lab-utils";

interface ConsistencyOutput {
  readonly variant: "recorded-consistency-suite";
  readonly outputs: readonly unknown[];
  readonly regressionCases: readonly {
    readonly id: string;
    readonly currentScore: number;
    readonly baselineScore: number;
    readonly threshold: number;
  }[];
}

type ConsistencyColumnInput = Evalite.ColumnInput<
  ConsistencyRecord,
  ConsistencyOutput,
  ConsistencyRecord["expected"]
>;

function regressionLabel(output: ConsistencyOutput): string {
  const regression = output.regressionCases[0];

  if (regression === undefined) {
    return "n/a";
  }

  return `${regression.currentScore.toFixed(2)}/${regression.baselineScore.toFixed(2)}`;
}

function consistencyNext(opts: ConsistencyColumnInput): string {
  const consistency = namedScore(opts.scores, "consistency");
  const regression = namedScore(opts.scores, "regression_gate");

  if (typeof regression === "number" && regression < 0.75) {
    return "regression";
  }

  if (typeof consistency === "number" && consistency < 0.8) {
    return "drift";
  }

  if (opts.input.caseType === "borderline") {
    return "policy";
  }

  return "pass";
}

function consistencyColumns(
  opts: ConsistencyColumnInput,
): Evalite.RenderedColumn[] {
  return [
    {
      label: "case",
      value: compactCaseId(opts.input.id, "consistency-")
        .replace("policy-window", "policy")
        .replace("search-slots", "search")
        .replace("summary-warning", "summary")
        .replace("refusal-scope", "refusal"),
    },
    { label: "cons", value: formatScore(namedScore(opts.scores, "consistency")) },
    { label: "base", value: regressionLabel(opts.output) },
    { label: "reg", value: formatScore(namedScore(opts.scores, "regression_gate")) },
    { label: "next", value: consistencyNext(opts) },
  ];
}

const outputsFor = (record: ConsistencyRecord): ConsistencyOutput => {
  if (record.id === "consistency-search-slots") {
    return {
      variant: "recorded-consistency-suite",
      outputs: [
        {
          intent: "find_item",
          origin: "Boston",
          destination: "Lisbon",
          maxPrice: 550,
          answer: "find_item with origin Boston, destination Lisbon, and maxPrice 550",
        },
        {
          intent: "find_item",
          origin: "Boston",
          destination: "Lisbon",
          maxPrice: 550,
          answer: "find_item with origin Boston, destination Lisbon, and maxPrice 550",
        },
        {
          intent: "find_item",
          origin: "Boston",
          destination: "Lisbon",
          maxPrice: 550,
          answer: "find_item with origin Boston, destination Lisbon, and maxPrice 550",
        },
      ],
      regressionCases: [
        { id: record.id, currentScore: 1, baselineScore: 0.96, threshold: 0.9 },
      ],
    };
  }

  if (record.id === "consistency-summary-warning") {
    return {
      variant: "recorded-consistency-suite",
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
        { id: record.id, currentScore: 0.87, baselineScore: 0.84, threshold: 0.8 },
      ],
    };
  }

  if (record.id === "consistency-refusal-scope") {
    return {
      variant: "recorded-consistency-suite",
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
        { id: record.id, currentScore: 0.53, baselineScore: 0.9, threshold: 0.85 },
      ],
    };
  }

  return {
    variant: "recorded-consistency-suite",
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
      { id: record.id, currentScore: 0.58, baselineScore: 0.94, threshold: 0.9 },
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
    columns: consistencyColumns,
  },
);
