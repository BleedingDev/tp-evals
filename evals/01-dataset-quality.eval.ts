import { readFile } from "node:fs/promises";

import { evalite } from "evalite";

import {
  INTENTIONALLY_BROKEN_DATASET,
  parseJsonl,
} from "../src/datasets/jsonl";
import {
  createEvaliteScorer,
  isRecord,
  makeResult,
} from "../src/scorers/common";

interface DatasetQualityInput {
  readonly id: string;
  readonly lineNumber: number;
  readonly sampleRecord: unknown;
}

interface DatasetQualityExpected {
  readonly issueTypes: readonly string[];
  readonly fixChecklist: readonly string[];
  readonly minCompletenessScore: number;
}

interface DatasetQualityOutput {
  readonly detectedIssueTypes: readonly string[];
  readonly repairChecklist: readonly string[];
  readonly anonymizedAfterRepair: boolean;
  readonly completenessScore: number;
  readonly variant: "dataset-repair-audit";
}

const expectedById = new Map<string, DatasetQualityExpected>([
  [
    "broken-empty-labels",
    {
      issueTypes: ["labels", "expectedBehavior"],
      fixChecklist: ["add labels", "add expectedBehavior"],
      minCompletenessScore: 0.55,
    },
  ],
  [
    "broken-anonymization-flags",
    {
      issueTypes: [
        "source.anonymized",
        "source.containsSensitiveData",
        "risk",
        "expected.minQualityScore",
      ],
      fixChecklist: [
        "set anonymized true",
        "set containsSensitiveData false",
        "use allowed risk level",
        "set minQualityScore between 0 and 1",
      ],
      minCompletenessScore: 0.8,
    },
  ],
  [
    "broken-capability-typo",
    {
      issueTypes: ["capability"],
      fixChecklist: ["use shared capability enum"],
      minCompletenessScore: 0.7,
    },
  ],
  [
    "broken-empty-edit-targets",
    {
      issueTypes: [
        "metadata.participantEditTargets",
        "expected.minIntentConfidence",
      ],
      fixChecklist: [
        "add participant edit target",
        "set minIntentConfidence between 0 and 1",
      ],
      minCompletenessScore: 0.7,
    },
  ],
]);

const readString = (
  value: Record<string, unknown>,
  key: string,
): string | undefined => {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
};

const inspectRecord = (sampleRecord: unknown): DatasetQualityOutput => {
  const issues: string[] = [];
  const checklist: string[] = [];

  if (!isRecord(sampleRecord)) {
    return {
      detectedIssueTypes: ["record"],
      repairChecklist: ["make each JSONL line an object"],
      anonymizedAfterRepair: false,
      completenessScore: 0,
      variant: "dataset-repair-audit",
    };
  }

  const labels = sampleRecord["labels"];
  if (!Array.isArray(labels) || labels.length === 0) {
    issues.push("labels");
    checklist.push("add labels");
  }

  if (readString(sampleRecord, "expectedBehavior") === undefined) {
    issues.push("expectedBehavior");
    checklist.push("add expectedBehavior");
  }

  const source = sampleRecord["source"];
  if (isRecord(source)) {
    if (source["anonymized"] !== true) {
      issues.push("source.anonymized");
      checklist.push("set anonymized true");
    }

    if (source["containsSensitiveData"] !== false) {
      issues.push("source.containsSensitiveData");
      checklist.push("set containsSensitiveData false");
    }
  }

  if (!["low", "medium", "high"].includes(readString(sampleRecord, "risk") ?? "")) {
    issues.push("risk");
    checklist.push("use allowed risk level");
  }

  if (
    ![
      "translation",
      "mobile_search",
      "travel_summary",
      "prompt_injection",
      "consistency",
      "dataset_quality",
    ].includes(readString(sampleRecord, "capability") ?? "")
  ) {
    issues.push("capability");
    checklist.push("use shared capability enum");
  }

  const metadata = sampleRecord["metadata"];
  if (isRecord(metadata)) {
    const targets = metadata["participantEditTargets"];
    if (!Array.isArray(targets) || targets.length === 0) {
      issues.push("metadata.participantEditTargets");
      checklist.push("add participant edit target");
    }
  }

  const expected = sampleRecord["expected"];
  if (isRecord(expected)) {
    const minQualityScore = expected["minQualityScore"];
    if (
      typeof minQualityScore === "number" &&
      (minQualityScore < 0 || minQualityScore > 1)
    ) {
      issues.push("expected.minQualityScore");
      checklist.push("set minQualityScore between 0 and 1");
    }

    const minIntentConfidence = expected["minIntentConfidence"];
    if (
      typeof minIntentConfidence === "number" &&
      (minIntentConfidence < 0 || minIntentConfidence > 1)
    ) {
      issues.push("expected.minIntentConfidence");
      checklist.push("set minIntentConfidence between 0 and 1");
    }
  }

  return {
    detectedIssueTypes: issues,
    repairChecklist: [...new Set(checklist)],
    anonymizedAfterRepair: !issues.some((issue) => issue.startsWith("source.")),
    completenessScore: issues.length === 0 ? 1 : Math.max(0.25, 1 - issues.length / 6),
    variant: "dataset-repair-audit",
  };
};

const loadBrokenData = async () => {
  const text = await readFile(INTENTIONALLY_BROKEN_DATASET, "utf8");
  const parsed = parseJsonl(text, INTENTIONALLY_BROKEN_DATASET);

  return parsed.records.map((record) => {
    const value = isRecord(record.value) ? record.value : {};
    const id = readString(value, "id") ?? `line-${record.lineNumber}`;
    const expected = expectedById.get(id);

    if (expected === undefined) {
      throw new Error(`Missing lab expectation for ${id}.`);
    }

    return {
      input: {
        id,
        lineNumber: record.lineNumber,
        sampleRecord: record.value,
      },
      expected,
    };
  });
};

evalite<DatasetQualityInput, DatasetQualityOutput, DatasetQualityExpected>(
  "Lab 01 - Dataset Quality Repair",
  {
    data: loadBrokenData,
    task: (input) => inspectRecord(input.sampleRecord),
    scorers: [
      createEvaliteScorer({
        name: "detected_repair_issues",
        description: "Checks that the repair exercise finds the intended broken fields.",
        scorer: ({ output, expected }) => {
          const detected = new Set(output.detectedIssueTypes);
          const matched = expected.issueTypes.filter((issue) => detected.has(issue));
          const unexpected = output.detectedIssueTypes.filter(
            (issue) => !expected.issueTypes.includes(issue),
          );
          const score = matched.length / expected.issueTypes.length;

          return makeResult(
            score,
            unexpected.length === 0 && score === 1
              ? "Expected dataset repair issues were detected."
              : "Dataset repair issue detection needs review.",
            { matched, missing: expected.issueTypes.filter((issue) => !detected.has(issue)), unexpected },
            0.9,
          );
        },
      }),
      createEvaliteScorer({
        name: "repair_checklist",
        description: "Checks that the participant-facing repair checklist is small.",
        scorer: ({ output, expected }) => {
          const covered = expected.fixChecklist.filter((item) =>
            output.repairChecklist.includes(item),
          );

          return makeResult(
            covered.length / expected.fixChecklist.length,
            "Repair checklist coverage for this broken row.",
            { covered, repairChecklist: output.repairChecklist },
            0.8,
          );
        },
      }),
    ],
  },
);
