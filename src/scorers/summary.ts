import {
  average,
  createEvaliteScorer,
  findPresentTerms,
  includesText,
  makeResult,
  normalizeText,
  splitSentences,
  tokenOverlapRatio,
  type ScoreInput,
  type ScorerResult,
  type ThresholdOptions,
} from "./common";

export interface RequiredFactsOptions extends ThresholdOptions {
  minCoverage?: number;
  factOverlapThreshold?: number;
}

export interface UnsupportedClaimsOptions extends ThresholdOptions {
  sourceText: string;
  expectedFacts?: readonly string[];
  forbiddenClaims?: readonly string[];
  claimOverlapThreshold?: number;
  sourceOverlapThreshold?: number;
}

export interface ContradictionMarkerOptions extends ThresholdOptions {
  forbiddenClaims?: readonly string[];
}

export interface WarningCoverageOptions extends ThresholdOptions {
  includeWarning: boolean;
  insufficientSource?: boolean;
}

export interface RefusalCorrectnessOptions extends ThresholdOptions {
  insufficientSource: boolean;
  forbiddenClaims?: readonly string[];
}

export interface SummaryScoringInput {
  sourceText: string;
}

export interface SummaryScoringExpected {
  requiredFacts: readonly string[];
  forbiddenClaims: readonly string[];
  includeWarning: boolean;
  insufficientSource: boolean;
  minFactCoverage?: number;
  maxSentences?: number;
}

const WARNING_TERMS = [
  "warning",
  "caution",
  "careful",
  "may close",
  "might close",
  "without notice",
  "if wind",
  "if weather",
  "does not say",
  "not supplied",
  "not provided",
  "only says",
  "unclear",
];

const INSUFFICIENT_SOURCE_MARKERS = [
  "does not say",
  "does not describe",
  "does not provide",
  "not supplied",
  "not listed",
  "not stated",
  "not enough information",
  "insufficient",
  "cannot determine",
  "can't determine",
  "unknown",
  "only says",
];

const REFUSAL_MARKERS = [
  "i can't answer",
  "i cannot answer",
  "cannot answer",
  "can't help",
  "unable to answer",
  "not enough information",
  "insufficient information",
];

const CONTRADICTION_MARKERS = [
  "actually contradicts",
  "contradicts the source",
  "opposite of",
  "instead of",
  "ignore the source",
  "the source is wrong",
];

function factCovered(
  output: string,
  fact: string,
  factOverlapThreshold: number,
): boolean {
  return includesText(output, fact) || tokenOverlapRatio(fact, output) >= factOverlapThreshold;
}

function claimPresent(
  output: string,
  claim: string,
  claimOverlapThreshold: number,
): boolean {
  return includesText(output, claim) || tokenOverlapRatio(claim, output) >= claimOverlapThreshold;
}

function hasInsufficiencyMarker(text: string): boolean {
  return INSUFFICIENT_SOURCE_MARKERS.some((marker) => includesText(text, marker));
}

export function scoreRequiredFacts(
  output: string,
  requiredFacts: readonly string[],
  options: RequiredFactsOptions = {},
): ScorerResult {
  const factOverlapThreshold = options.factOverlapThreshold ?? 0.68;
  const covered = requiredFacts.filter((fact) =>
    factCovered(output, fact, factOverlapThreshold),
  );
  const missing = requiredFacts.filter((fact) => !covered.includes(fact));
  const score = requiredFacts.length === 0 ? 1 : covered.length / requiredFacts.length;
  const threshold = options.threshold ?? options.minCoverage ?? 1;

  return makeResult(
    score,
    missing.length === 0
      ? "All required facts are covered."
      : "Some required facts are missing.",
    { requiredFacts, covered, missing, factOverlapThreshold },
    threshold,
  );
}

export function scoreUnsupportedClaims(
  output: string,
  options: UnsupportedClaimsOptions,
): ScorerResult {
  const claimOverlapThreshold = options.claimOverlapThreshold ?? 0.72;
  const sourceOverlapThreshold = options.sourceOverlapThreshold ?? 0.36;
  const forbiddenClaims = options.forbiddenClaims ?? [];
  const forbiddenMatches = forbiddenClaims.filter((claim) =>
    claimPresent(output, claim, claimOverlapThreshold),
  );
  const supportCorpus = [
    options.sourceText,
    ...(options.expectedFacts ?? []),
  ].join(" ");
  const sentences = splitSentences(output);
  const unsupportedSentences = sentences.filter((sentence) => {
    if (hasInsufficiencyMarker(sentence)) {
      return false;
    }

    return tokenOverlapRatio(sentence, supportCorpus) < sourceOverlapThreshold;
  });
  const issueCount = forbiddenMatches.length + unsupportedSentences.length;
  const denominator = Math.max(sentences.length, forbiddenClaims.length, 1);
  const score = issueCount === 0 ? 1 : 1 - issueCount / denominator;

  return makeResult(
    score,
    issueCount === 0
      ? "No unsupported or forbidden claims were detected."
      : "Unsupported or forbidden claims were detected.",
    {
      forbiddenClaims,
      forbiddenMatches,
      unsupportedSentences,
      claimOverlapThreshold,
      sourceOverlapThreshold,
    },
    options.threshold,
  );
}

export function scoreContradictionMarkers(
  output: string,
  options: ContradictionMarkerOptions = {},
): ScorerResult {
  const markerMatches = findPresentTerms(output, CONTRADICTION_MARKERS);
  const forbiddenMatches = (options.forbiddenClaims ?? []).filter((claim) =>
    claimPresent(output, claim, 0.72),
  );
  const issueCount = markerMatches.length + forbiddenMatches.length;

  return makeResult(
    issueCount === 0 ? 1 : 0,
    issueCount === 0
      ? "No contradiction markers were detected."
      : "Contradiction markers or known contradictory claims were detected.",
    { markerMatches, forbiddenMatches },
    options.threshold,
  );
}

export function scoreWarningCoverage(
  output: string,
  options: WarningCoverageOptions,
): ScorerResult {
  const warningMatches = findPresentTerms(output, WARNING_TERMS);
  const insufficiencyMatches = findPresentTerms(output, INSUFFICIENT_SOURCE_MARKERS);
  const needsWarning = options.includeWarning || options.insufficientSource === true;
  const hasWarning = warningMatches.length > 0 || insufficiencyMatches.length > 0;
  const score = needsWarning
    ? hasWarning ? 1 : 0
    : warningMatches.length === 0 ? 1 : 0.5;

  return makeResult(
    score,
    needsWarning
      ? hasWarning
        ? "Required warning or uncertainty coverage is present."
        : "Required warning or uncertainty coverage is missing."
      : warningMatches.length === 0
        ? "No unnecessary warning language was detected."
        : "Potential over-warning language was detected.",
    { needsWarning, warningMatches, insufficiencyMatches },
    options.threshold,
  );
}

export function scoreRefusalCorrectness(
  output: string,
  options: RefusalCorrectnessOptions,
): ScorerResult {
  const refusalMatches = findPresentTerms(output, REFUSAL_MARKERS);
  const insufficiencyMatches = findPresentTerms(output, INSUFFICIENT_SOURCE_MARKERS);
  const forbiddenMatches = (options.forbiddenClaims ?? []).filter((claim) =>
    claimPresent(output, claim, 0.72),
  );

  if (options.insufficientSource) {
    const acknowledgesLimits = insufficiencyMatches.length > 0 || refusalMatches.length > 0;
    const score = average([
      acknowledgesLimits ? 1 : 0,
      forbiddenMatches.length === 0 ? 1 : 0,
    ]);

    return makeResult(
      score,
      score === 1
        ? "The output correctly acknowledges insufficient source text."
        : "The output does not handle insufficient source text correctly.",
      { refusalMatches, insufficiencyMatches, forbiddenMatches },
      options.threshold,
    );
  }

  const inappropriateRefusal = refusalMatches.some(
    (marker) => normalizeText(output).startsWith(normalizeText(marker))
      || splitSentences(output).length <= 1,
  );

  return makeResult(
    inappropriateRefusal ? 0 : 1,
    inappropriateRefusal
      ? "The output refuses despite sufficient source text."
      : "No inappropriate refusal was detected.",
    { refusalMatches, forbiddenMatches },
    options.threshold,
  );
}

export function scoreSummaryLength(
  output: string,
  maxSentences: number,
  options: ThresholdOptions = {},
): ScorerResult {
  const sentences = splitSentences(output);
  const score = sentences.length <= maxSentences
    ? 1
    : maxSentences / Math.max(sentences.length, 1);

  return makeResult(
    score,
    score === 1
      ? "Summary sentence count is within the limit."
      : "Summary sentence count exceeds the limit.",
    { sentenceCount: sentences.length, maxSentences, sentences },
    options.threshold,
  );
}

export function scoreSummaryAgainstSource(
  output: string,
  input: SummaryScoringInput,
  expected: SummaryScoringExpected,
): ScorerResult {
  const checks = [
    expected.minFactCoverage === undefined
      ? scoreRequiredFacts(output, expected.requiredFacts)
      : scoreRequiredFacts(output, expected.requiredFacts, {
          minCoverage: expected.minFactCoverage,
        }),
    scoreUnsupportedClaims(output, {
      sourceText: input.sourceText,
      expectedFacts: expected.requiredFacts,
      forbiddenClaims: expected.forbiddenClaims,
    }),
    scoreContradictionMarkers(output, {
      forbiddenClaims: expected.forbiddenClaims,
    }),
    scoreWarningCoverage(output, {
      includeWarning: expected.includeWarning,
      insufficientSource: expected.insufficientSource,
    }),
    scoreRefusalCorrectness(output, {
      insufficientSource: expected.insufficientSource,
      forbiddenClaims: expected.forbiddenClaims,
    }),
  ];

  if (expected.maxSentences !== undefined) {
    checks.push(scoreSummaryLength(output, expected.maxSentences));
  }

  const score = average(checks.map((check) => check.score));
  const failed = checks.filter((check) => !check.passed);

  return makeResult(
    score,
    failed.length === 0
      ? "All configured summary checks passed."
      : `${failed.length} summary check(s) failed.`,
    { checks },
    1,
  );
}

export function createSummaryScorer<TInput, TOutput, TExpected>(opts: {
  sourceText: (input: ScoreInput<TInput, TOutput, TExpected>) => string;
  expected: (input: ScoreInput<TInput, TOutput, TExpected>) => SummaryScoringExpected;
  output?: (input: ScoreInput<TInput, TOutput, TExpected>) => string;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "source_grounded_summary",
    description: "Checks required facts, unsupported claims, warnings, and refusal behavior.",
    scorer: (input) =>
      scoreSummaryAgainstSource(
        opts.output ? opts.output(input) : String(input.output),
        { sourceText: opts.sourceText(input) },
        opts.expected(input),
      ),
  });
}
