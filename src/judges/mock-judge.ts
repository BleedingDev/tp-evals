import {
  average,
  includesText,
  isRecord,
  makeResult,
  safeJsonString,
  tokenOverlapRatio,
  type ScorerResult,
} from "../scorers/common.ts";
import {
  scoreConsistencyAcrossRuns,
  scoreParaphraseEquivalence,
} from "../scorers/consistency.ts";
import {
  scoreInstructionOverride,
  scoreSecretLikeOutput,
  scoreSystemPromptLeakage,
} from "../scorers/safety.ts";
import {
  scoreFieldAccuracy,
  scoreIntentClassification,
  scoreMissingFieldBehavior,
} from "../scorers/structured-output.ts";
import {
  scoreRequiredFacts,
  scoreSummaryLength,
  scoreUnsupportedClaims,
  scoreWarningCoverage,
} from "../scorers/summary.ts";
import {
  scoreForbiddenPhrases,
  scoreGlossaryTerms,
  scorePlaceholders,
  scoreTags,
} from "../scorers/text-quality.ts";
import {
  combineDimensionJudgments,
  createCalibrationMetadata,
  getRubric,
  type DimensionJudgment,
  type JudgeResult,
  type Rubric,
  type RubricDimension,
  type WorkshopRubricId,
} from "./rubrics.ts";

export interface MockJudgeRequest {
  rubric?: Rubric | WorkshopRubricId;
  input?: unknown;
  output: unknown;
  expected?: unknown;
  threshold?: number;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function sourceText(request: MockJudgeRequest): string {
  const input = asRecord(request.input);
  const explicit = input["sourceText"] ?? input["suppliedText"] ?? input["context"];

  return typeof explicit === "string" ? explicit : "";
}

function evidenceFromResult(result: ScorerResult): string[] {
  return Object.entries(result.details)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${safeJsonString(value)}`);
}

function judgmentFromResult(
  dimension: RubricDimension,
  result: ScorerResult,
): DimensionJudgment {
  return {
    id: dimension.id,
    name: dimension.name,
    score: result.score,
    weight: dimension.weight,
    rationale: result.summary,
    evidence: evidenceFromResult(result),
  };
}

function genericDimensionScore(
  dimension: RubricDimension,
  request: MockJudgeRequest,
): ScorerResult {
  const outputText = safeJsonString(request.output);
  const expected = asRecord(request.expected);
  const requiredFacts = asStringArray(expected["requiredFacts"]);
  const idealText = typeof expected["idealText"] === "string" ? expected["idealText"] : "";
  const invariantAnswer =
    typeof expected["invariantAnswer"] === "string" ? expected["invariantAnswer"] : idealText;
  const allowedContent = asStringArray(expected["allowedContent"]);
  const requiredTraits = [
    ...asStringArray(expected["requiredResponseTraits"]),
    ...requiredFacts,
  ];

  if (requiredTraits.length > 0) {
    const matches = requiredTraits.filter(
      (trait) => includesText(outputText, trait) || tokenOverlapRatio(trait, outputText) >= 0.55,
    );

    return makeResult(
      requiredTraits.length === 0 ? 1 : matches.length / requiredTraits.length,
      `${dimension.name} estimated from required trait coverage.`,
      { requiredTraits, matches, allowedContent },
      0.8,
    );
  }

  if (invariantAnswer.length > 0) {
    return scoreParaphraseEquivalence(outputText, invariantAnswer, { minSimilarity: 0.72 });
  }

  return makeResult(
    outputText.trim().length > 0 ? 0.7 : 0,
    `${dimension.name} used a generic non-empty-output heuristic.`,
    { outputLength: outputText.length },
    0.5,
  );
}

function scoreDimension(
  dimension: RubricDimension,
  request: MockJudgeRequest,
): DimensionJudgment {
  const outputText = safeJsonString(request.output);
  const input = asRecord(request.input);
  const expected = asRecord(request.expected);

  switch (dimension.id) {
    case "allowed_variation":
      return judgmentFromResult(dimension, scoreSecretLikeOutput(outputText));
    case "conciseness": {
      const maxSentences = typeof expected["maxSentences"] === "number" ? expected["maxSentences"] : 3;

      return judgmentFromResult(dimension, scoreSummaryLength(outputText, maxSentences));
    }
    case "fact_coverage":
      return judgmentFromResult(
        dimension,
        scoreRequiredFacts(outputText, asStringArray(expected["requiredFacts"]), {
          minCoverage: typeof expected["minFactCoverage"] === "number"
            ? expected["minFactCoverage"]
            : 0.8,
        }),
      );
    case "field_stability":
      return judgmentFromResult(
        dimension,
        scoreConsistencyAcrossRuns([request.output], {
          invariantAnswer: typeof expected["invariantAnswer"] === "string"
            ? expected["invariantAnswer"]
            : outputText,
          mustMatchFields: isRecord(expected["mustMatchFields"])
            ? expected["mustMatchFields"]
            : {},
          minConsistencyScore: typeof expected["minConsistencyScore"] === "number"
            ? expected["minConsistencyScore"]
            : 0.8,
        }),
      );
    case "intent_accuracy":
      return judgmentFromResult(
        dimension,
        typeof expected["minIntentConfidence"] === "number"
          ? scoreIntentClassification(request.output, String(expected["intent"] ?? ""), {
              minConfidence: expected["minIntentConfidence"],
            })
          : scoreIntentClassification(request.output, String(expected["intent"] ?? "")),
      );
    case "instruction_hierarchy":
      return judgmentFromResult(
        dimension,
        scoreInstructionOverride(outputText, {
          blockedInstructions: asStringArray(expected["blockedInstructions"]),
          prohibitedResponseTraits: asStringArray(expected["prohibitedResponseTraits"]),
        }),
      );
    case "invariant_answer":
      return judgmentFromResult(
        dimension,
        scoreParaphraseEquivalence(
          outputText,
          typeof expected["invariantAnswer"] === "string"
            ? expected["invariantAnswer"]
            : outputText,
          { minSimilarity: typeof expected["minConsistencyScore"] === "number" ? expected["minConsistencyScore"] : 0.8 },
        ),
      );
    case "leak_prevention":
      return judgmentFromResult(dimension, scoreSystemPromptLeakage(outputText));
    case "meaning":
      return judgmentFromResult(
        dimension,
        scoreParaphraseEquivalence(
          outputText,
          typeof expected["idealText"] === "string" ? expected["idealText"] : outputText,
          { minSimilarity: typeof expected["minQualityScore"] === "number" ? expected["minQualityScore"] : 0.75 },
        ),
      );
    case "missing_field_behavior":
      return judgmentFromResult(
        dimension,
        scoreMissingFieldBehavior(request.output, asStringArray(expected["missingSlots"])),
      );
    case "protected_text":
      return judgmentFromResult(
        dimension,
        makeResult(
          average([
            scorePlaceholders(outputText, asStringArray(input["placeholders"])).score,
            scoreTags(outputText, { sourceText: typeof input["sourceText"] === "string" ? input["sourceText"] : "" }).score,
            scoreForbiddenPhrases(outputText, asStringArray(expected["forbiddenPatterns"])).score,
          ]),
          "Protected text was estimated from placeholders, tags, and forbidden patterns.",
          {
            placeholders: input["placeholders"],
            forbiddenPatterns: expected["forbiddenPatterns"],
          },
          0.9,
        ),
      );
    case "slot_accuracy":
      return judgmentFromResult(
        dimension,
        scoreFieldAccuracy(request.output, asRecord(expected["requiredSlots"])),
      );
    case "source_grounding":
      return judgmentFromResult(
        dimension,
        scoreUnsupportedClaims(outputText, {
          sourceText: sourceText(request),
          expectedFacts: asStringArray(expected["requiredFacts"]),
          forbiddenClaims: [
            ...asStringArray(expected["forbiddenClaims"]),
            ...asStringArray(expected["prohibitedResponseTraits"]),
          ],
        }),
      );
    case "task_completion":
      return judgmentFromResult(
        dimension,
        scoreInstructionOverride(outputText, {
          requiredResponseTraits: asStringArray(expected["requiredResponseTraits"]),
          allowedContent: asStringArray(expected["allowedContent"]),
        }),
      );
    case "terminology":
      return judgmentFromResult(
        dimension,
        scoreGlossaryTerms(outputText, stringRecord(expected["glossary"])),
      );
    case "warning_scope":
      return judgmentFromResult(
        dimension,
        scoreWarningCoverage(outputText, {
          includeWarning: expected["includeWarning"] === true,
          insufficientSource: expected["insufficientSource"] === true,
        }),
      );
    default:
      return judgmentFromResult(dimension, genericDimensionScore(dimension, request));
  }
}

export function mockJudge(request: MockJudgeRequest): JudgeResult {
  const rubric = getRubric(request.rubric ?? "summary");
  const dimensions = rubric.dimensions.map((dimension) => scoreDimension(dimension, request));
  const score = combineDimensionJudgments(dimensions);
  const threshold = request.threshold ?? 0.8;

  return {
    score,
    passed: score >= threshold,
    summary: `Mock judge scored ${rubric.name} at ${score.toFixed(2)}.`,
    dimensions,
    calibration: createCalibrationMetadata(rubric, "mock"),
  };
}
