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

type DatasetQualityInput = string;

interface DatasetQualityExpected {
  readonly issueTypes: readonly string[];
  readonly fixChecklist: readonly string[];
  readonly minCompletenessScore: number;
}

interface DatasetQualityAudit {
  readonly rowStatus: "broken" | "invalid" | "clean";
  readonly detectedIssueTypes: readonly string[];
  readonly suggestedFixes: readonly string[];
  readonly safeToShareAfterFix: boolean;
  readonly completenessScore: number;
  readonly variant: "dataset-quality-audit";
}

type DatasetQualityOutput = string;

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

const recordById = new Map<string, unknown>();

const readString = (
  value: Record<string, unknown>,
  key: string,
): string | undefined => {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
};

const inspectRecord = (sampleRecord: unknown): DatasetQualityAudit => {
  const issues: string[] = [];
  const checklist: string[] = [];

  if (!isRecord(sampleRecord)) {
    return {
      rowStatus: "invalid",
      detectedIssueTypes: ["record"],
      suggestedFixes: ["make each JSONL line an object"],
      safeToShareAfterFix: false,
      completenessScore: 0,
      variant: "dataset-quality-audit",
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
    rowStatus: issues.length === 0 ? "clean" : "broken",
    detectedIssueTypes: issues,
    suggestedFixes: [...new Set(checklist)],
    safeToShareAfterFix: !issues.some((issue) => issue.startsWith("source.")),
    completenessScore: issues.length === 0 ? 1 : Math.max(0.25, 1 - issues.length / 6),
    variant: "dataset-quality-audit",
  };
};

const formatAuditOutput = (audit: DatasetQualityAudit): DatasetQualityOutput =>
  JSON.stringify({
    rowStatus: audit.rowStatus,
    issues: audit.detectedIssueTypes,
    fixPlan: audit.detectedIssueTypes.map((issue, index) =>
      `${issue} -> ${audit.suggestedFixes[index] ?? "review manually"}`,
    ),
    fixes: audit.suggestedFixes,
    safeAfterFix: audit.safeToShareAfterFix,
  });

const parseAuditOutput = (output: DatasetQualityOutput): DatasetQualityAudit => {
  const parsed = JSON.parse(output) as {
    rowStatus?: unknown;
    issues?: unknown;
    fixes?: unknown;
    safeAfterFix?: unknown;
  };

  return {
    rowStatus:
      parsed.rowStatus === "broken" || parsed.rowStatus === "invalid" || parsed.rowStatus === "clean"
        ? parsed.rowStatus
        : "invalid",
    detectedIssueTypes: Array.isArray(parsed.issues)
      ? parsed.issues.filter((issue): issue is string => typeof issue === "string")
      : [],
    suggestedFixes: Array.isArray(parsed.fixes)
      ? parsed.fixes.filter((fix): fix is string => typeof fix === "string")
      : [],
    safeToShareAfterFix: parsed.safeAfterFix === true,
    completenessScore: 0,
    variant: "dataset-quality-audit",
  };
};

const loadBrokenData = async () => {
  const text = await readFile(INTENTIONALLY_BROKEN_DATASET, "utf8");
  const parsed = parseJsonl(text, INTENTIONALLY_BROKEN_DATASET);
  recordById.clear();

  return parsed.records.map((record) => {
    const value = isRecord(record.value) ? record.value : {};
    const id = readString(value, "id") ?? `line-${record.lineNumber}`;
    const expected = expectedById.get(id);

    if (expected === undefined) {
      throw new Error(`Missing lab expectation for ${id}.`);
    }

    recordById.set(id, record.value);

    const input =
      `${id} | line=${record.lineNumber} | fixture=intentionally_broken | expectedIssues=${expected.issueTypes.join(",")}`;

    return {
      input,
      expected,
    };
  });
};

evalite<DatasetQualityInput, DatasetQualityOutput, DatasetQualityExpected>(
  "Lab 01 - Dataset Quality Audit",
  {
    data: loadBrokenData,
    task: (input) => {
      const id = input.split(" | ")[0];

      if (id === undefined) {
        return formatAuditOutput(inspectRecord(undefined));
      }

      return formatAuditOutput(inspectRecord(recordById.get(id)));
    },
    scorers: [
      createEvaliteScorer({
        name: "detected_dataset_issues",
        description: "Checks that the audit finds the intended broken fields.",
        scorer: ({ output, expected }) => {
          const audit = parseAuditOutput(output);
          const detected = new Set(audit.detectedIssueTypes);
          const matched = expected.issueTypes.filter((issue) => detected.has(issue));
          const unexpected = audit.detectedIssueTypes.filter(
            (issue) => !expected.issueTypes.includes(issue),
          );
          const score = matched.length / expected.issueTypes.length;

          return makeResult(
            score,
            unexpected.length === 0 && score === 1
              ? "Expected dataset issues were detected."
              : "Dataset issue detection needs review.",
            { matched, missing: expected.issueTypes.filter((issue) => !detected.has(issue)), unexpected },
            0.9,
          );
        },
      }),
      createEvaliteScorer({
        name: "suggested_fix_checklist",
        description: "Checks that the audit suggests the required minimal fixes.",
        scorer: ({ output, expected }) => {
          const audit = parseAuditOutput(output);
          const covered = expected.fixChecklist.filter((item) =>
            audit.suggestedFixes.includes(item),
          );

          return makeResult(
            covered.length / expected.fixChecklist.length,
            "Suggested fix coverage for this broken dataset row.",
            { covered, suggestedFixes: audit.suggestedFixes },
            0.8,
          );
        },
      }),
    ],
  },
);
