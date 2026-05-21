import {
  average,
  createEvaliteScorer,
  escapeRegExp,
  findMissingTerms,
  findPresentTerms,
  makeResult,
  normalizeText,
  normalizeWhitespace,
  safeJsonString,
  type ScoreInput,
  type ScorerResult,
  type TextMatchOptions,
  type ThresholdOptions,
} from "./common";

export type OutputSelector<TInput, TOutput, TExpected> = (
  input: ScoreInput<TInput, TOutput, TExpected>,
) => string;

export interface PlaceholderOptions extends ThresholdOptions {
  allowExtraPlaceholders?: boolean;
  placeholderPattern?: RegExp;
}

export interface TagOptions extends ThresholdOptions {
  sourceText?: string;
  requiredTags?: readonly string[];
  allowExtraTags?: boolean;
}

export interface ForbiddenPhraseOptions
  extends ThresholdOptions,
    TextMatchOptions {}

export interface LengthRatioOptions extends ThresholdOptions {
  minRatio?: number;
  maxRatio?: number;
  unit?: "words" | "characters";
}

export interface GlossaryOptions extends ThresholdOptions {
  penalizeSourceTermLeak?: boolean;
}

export interface OutputLanguageOptions extends ThresholdOptions {
  expectedText?: string;
}

export interface TextGuardrailSpec {
  placeholders?: readonly string[];
  sourceText?: string;
  requiredTags?: readonly string[];
  forbiddenPhrases?: readonly string[];
  referenceText?: string;
  lengthRatio?: LengthRatioOptions;
  glossary?: Readonly<Record<string, string>>;
  expectedLanguage?: string;
}

const DEFAULT_PLACEHOLDER_PATTERN =
  /\{\{\s*[\w.-]+\s*\}\}|\{[\w.-]+\}|%\w+%|\$\{[^}]+\}/gu;

const TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/gu;

const LANGUAGE_MARKERS: Record<string, string[]> = {
  de: [
    "der",
    "die",
    "das",
    "den",
    "dem",
    "und",
    "ist",
    "mit",
    "nur",
    "verwenden",
    "modus",
    "nach",
    "vor",
    "sie",
  ],
  en: [
    "the",
    "and",
    "or",
    "is",
    "are",
    "can",
    "should",
    "must",
    "only",
    "before",
    "after",
    "opens",
    "closed",
  ],
  es: [
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "guardar",
    "cancelar",
    "suscripcion",
    "pase",
    "valido",
    "hasta",
    "viernes",
    "hola",
    "tienes",
    "filtros",
    "guardados",
    "toca",
    "panel",
    "lateral",
    "permanece",
    "fijado",
    "despues",
    "reiniciar",
  ],
  fr: [
    "le",
    "la",
    "les",
    "des",
    "un",
    "une",
    "et",
    "est",
    "avant",
    "apres",
    "avertissement",
    "redemarrez",
    "retirer",
    "ouvrir",
    "parametres",
  ],
};

function defaultOutputSelector<TInput, TOutput, TExpected>(
  input: ScoreInput<TInput, TOutput, TExpected>,
): string {
  return safeJsonString(input.output);
}

function languageCode(language: string): string {
  return normalizeText(language).split(/[-_\s]/u)[0] ?? normalizeText(language);
}

function extractPlaceholders(text: string, pattern = DEFAULT_PLACEHOLDER_PATTERN): string[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);

  return [...text.matchAll(globalPattern)].map((match) => match[0]);
}

export function scorePlaceholders(
  output: string,
  placeholders: readonly string[],
  options: PlaceholderOptions = {},
): ScorerResult {
  const expected = [...new Set(placeholders)];
  const outputPlaceholders = extractPlaceholders(output, options.placeholderPattern);
  const outputPlaceholderSet = new Set(outputPlaceholders);
  const found = expected.filter((placeholder) => output.includes(placeholder));
  const missing = expected.filter((placeholder) => !output.includes(placeholder));
  const expectedSet = new Set(expected);
  const unexpected = outputPlaceholders.filter(
    (placeholder) => !expectedSet.has(placeholder),
  );
  const preservationScore = expected.length === 0 ? 1 : found.length / expected.length;
  const extraPenalty =
    unexpected.length === 0 || options.allowExtraPlaceholders
      ? 0
      : unexpected.length / Math.max(expected.length, outputPlaceholderSet.size, 1);
  const score = expected.length === 0 && unexpected.length > 0
    ? 0
    : preservationScore - extraPenalty;

  return makeResult(
    score,
    missing.length === 0 && (unexpected.length === 0 || options.allowExtraPlaceholders)
      ? "All required placeholders are preserved."
      : "Placeholder preservation failed.",
    { expected, found, missing, unexpected },
    options.threshold,
  );
}

function extractTags(text: string): string[] {
  return [...text.matchAll(TAG_PATTERN)].map((match) => match[0]);
}

function tagName(tag: string): string {
  return tag
    .replace(/^<\s*\/?\s*/u, "")
    .replace(/\s.*$/u, "")
    .replace(/\/?>$/u, "")
    .toLocaleLowerCase("en-US");
}

function isClosingTag(tag: string): boolean {
  return /^<\s*\//u.test(tag);
}

function isSelfClosingTag(tag: string): boolean {
  return /\/\s*>$/u.test(tag) || /^<\s*(br|hr|img|input|meta|link)\b/iu.test(tag);
}

function tagBalanceIssues(tags: readonly string[]): string[] {
  const stack: string[] = [];
  const issues: string[] = [];

  for (const tag of tags) {
    if (isSelfClosingTag(tag)) {
      continue;
    }

    const name = tagName(tag);

    if (!isClosingTag(tag)) {
      stack.push(name);
      continue;
    }

    const previous = stack.pop();

    if (previous !== name) {
      issues.push(`Expected closing tag for ${previous ?? "<none>"} but saw ${tag}.`);
    }
  }

  for (const unclosed of stack.reverse()) {
    issues.push(`Missing closing tag for ${unclosed}.`);
  }

  return issues;
}

export function scoreTags(
  output: string,
  options: TagOptions = {},
): ScorerResult {
  const requiredTags = options.requiredTags
    ?? (options.sourceText ? extractTags(options.sourceText) : []);
  const outputTags = extractTags(output);
  const missing = requiredTags.filter((tag) => !output.includes(tag));
  const requiredSet = new Set(requiredTags);
  const unexpected = outputTags.filter((tag) => !requiredSet.has(tag));
  const balanceIssues = tagBalanceIssues(outputTags);
  const preservationScore =
    requiredTags.length === 0 ? 1 : (requiredTags.length - missing.length) / requiredTags.length;
  const balanceScore = balanceIssues.length === 0 ? 1 : 0;
  const extraScore = unexpected.length === 0 || options.allowExtraTags ? 1 : 0;
  const score = average([preservationScore, balanceScore, extraScore]);

  return makeResult(
    score,
    missing.length === 0 && balanceIssues.length === 0
      ? "Required tags are present and balanced."
      : "Tag preservation or balance failed.",
    { requiredTags, outputTags, missing, unexpected, balanceIssues },
    options.threshold,
  );
}

export function scoreForbiddenPhrases(
  output: string,
  forbiddenPhrases: readonly string[],
  options: ForbiddenPhraseOptions = {},
): ScorerResult {
  const source = options.caseSensitive ? output : normalizeText(output);
  const matches = forbiddenPhrases.filter((phrase) => {
    const target = options.caseSensitive ? phrase : normalizeText(phrase);
    const leftBoundary = target.startsWith("{") ? "(?<!\\{)" : "";
    const rightBoundary = target.endsWith("}") ? "(?!\\})" : "";
    const wholeWordBoundary = options.wholeWord ? "\\b" : "";
    const pattern = `${wholeWordBoundary}${leftBoundary}${escapeRegExp(target)}${rightBoundary}${wholeWordBoundary}`;

    return new RegExp(pattern, "u").test(source);
  });
  const score = matches.length === 0 ? 1 : 0;

  return makeResult(
    score,
    matches.length === 0
      ? "No forbidden phrases were found."
      : "Forbidden phrases were found in the output.",
    { forbiddenPhrases, matches },
    options.threshold,
  );
}

function measuredLength(text: string, unit: "words" | "characters"): number {
  if (unit === "characters") {
    return normalizeWhitespace(text).length;
  }

  return normalizeWhitespace(text).split(/\s+/u).filter(Boolean).length;
}

export function scoreLengthRatio(
  output: string,
  referenceText: string,
  options: LengthRatioOptions = {},
): ScorerResult {
  const minRatio = options.minRatio ?? 0.5;
  const maxRatio = options.maxRatio ?? 1.8;
  const unit = options.unit ?? "words";
  const outputLength = measuredLength(output, unit);
  const referenceLength = measuredLength(referenceText, unit);
  const ratio = referenceLength === 0 ? 1 : outputLength / referenceLength;
  const score = ratio < minRatio
    ? ratio / minRatio
    : ratio > maxRatio
      ? maxRatio / ratio
      : 1;

  return makeResult(
    score,
    score === 1
      ? "Output length is within the expected ratio."
      : "Output length is outside the expected ratio.",
    { unit, outputLength, referenceLength, ratio, minRatio, maxRatio },
    options.threshold,
  );
}

export function scoreGlossaryTerms(
  output: string,
  glossary: Readonly<Record<string, string>>,
  options: GlossaryOptions = {},
): ScorerResult {
  const entries = Object.entries(glossary);
  const expectedTerms = entries.map(([, expectedTerm]) => expectedTerm);
  const missing = findMissingTerms(output, expectedTerms);
  const sourceLeaks = options.penalizeSourceTermLeak
    ? entries
        .filter(([sourceTerm, expectedTerm]) => normalizeText(sourceTerm) !== normalizeText(expectedTerm))
        .map(([sourceTerm]) => sourceTerm)
        .filter((sourceTerm) => normalizeText(output).includes(normalizeText(sourceTerm)))
    : [];
  const termScore = entries.length === 0 ? 1 : (entries.length - missing.length) / entries.length;
  const leakPenalty = sourceLeaks.length / Math.max(entries.length, 1);
  const score = termScore - leakPenalty;

  return makeResult(
    score,
    missing.length === 0 && sourceLeaks.length === 0
      ? "Glossary terms are present."
      : "Glossary term coverage failed.",
    { glossary, expectedTerms, missing, sourceLeaks },
    options.threshold,
  );
}

function languageMarkerScores(text: string): Record<string, number> {
  const normalized = normalizeText(text);
  const tokens = new Set(normalized.match(/[a-z]+/gu) ?? []);
  const scores: Record<string, number> = {};

  for (const [language, markers] of Object.entries(LANGUAGE_MARKERS)) {
    const matches = markers.filter((marker) => tokens.has(marker)).length;
    scores[language] = markers.length === 0 ? 0 : matches / markers.length;
  }

  if (/[ñ¿¡]/iu.test(text)) {
    scores["es"] = (scores["es"] ?? 0) + 0.2;
  }

  if (/[çœàâêèéëîïôûùüÿ]/iu.test(text)) {
    scores["fr"] = (scores["fr"] ?? 0) + 0.2;
  }

  if (/[äöüß]/iu.test(text)) {
    scores["de"] = (scores["de"] ?? 0) + 0.2;
  }

  return scores;
}

export function scoreOutputLanguageHeuristic(
  output: string,
  expectedLanguage: string,
  options: OutputLanguageOptions = {},
): ScorerResult {
  const expectedCode = languageCode(expectedLanguage);
  const markerScores = languageMarkerScores(output);
  const expectedMarkerScore = markerScores[expectedCode] ?? 0;
  const strongestLanguage = Object.entries(markerScores).sort((left, right) => right[1] - left[1])[0];
  const expectedTextSimilarity = options.expectedText
    ? normalizeText(output).includes(normalizeText(options.expectedText))
      ? 1
      : 0
    : 0;
  const score = Math.max(
    expectedMarkerScore > 0 && strongestLanguage?.[0] === expectedCode ? 1 : expectedMarkerScore * 2,
    expectedTextSimilarity,
  );

  return makeResult(
    score,
    score >= (options.threshold ?? 0.5)
      ? "Output language heuristic matches the expected language."
      : "Output language heuristic is weak for the expected language.",
    {
      expectedLanguage,
      expectedCode,
      strongestLanguage: strongestLanguage?.[0] ?? "unknown",
      markerScores,
    },
    options.threshold ?? 0.5,
  );
}

export function scoreTextGuardrails(
  output: string,
  spec: TextGuardrailSpec,
): ScorerResult {
  const checks: ScorerResult[] = [];

  if (spec.placeholders) {
    checks.push(scorePlaceholders(output, spec.placeholders));
  }

  if (spec.sourceText || spec.requiredTags) {
    const tagOptions: TagOptions = {};

    if (spec.sourceText !== undefined) {
      tagOptions.sourceText = spec.sourceText;
    }

    if (spec.requiredTags !== undefined) {
      tagOptions.requiredTags = spec.requiredTags;
    }

    checks.push(scoreTags(output, tagOptions));
  }

  if (spec.forbiddenPhrases) {
    checks.push(scoreForbiddenPhrases(output, spec.forbiddenPhrases));
  }

  if (spec.referenceText) {
    checks.push(scoreLengthRatio(output, spec.referenceText, spec.lengthRatio));
  }

  if (spec.glossary) {
    checks.push(scoreGlossaryTerms(output, spec.glossary));
  }

  if (spec.expectedLanguage) {
    checks.push(scoreOutputLanguageHeuristic(output, spec.expectedLanguage));
  }

  const score = average(checks.map((check) => check.score));
  const failed = checks.filter((check) => !check.passed);

  return makeResult(
    score,
    failed.length === 0
      ? "All configured text guardrails passed."
      : `${failed.length} text guardrail check(s) failed.`,
    { checks },
    1,
  );
}

export function createPlaceholderScorer<TInput, TOutput, TExpected>(opts: {
  placeholders: (input: ScoreInput<TInput, TOutput, TExpected>) => readonly string[];
  output?: OutputSelector<TInput, TOutput, TExpected>;
  options?: PlaceholderOptions;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "placeholder_preservation",
    description: "Checks that required placeholders are preserved exactly.",
    scorer: (input) =>
      scorePlaceholders(
        (opts.output ?? defaultOutputSelector)(input),
        opts.placeholders(input),
        opts.options,
      ),
  });
}

export function createForbiddenPhraseScorer<TInput, TOutput, TExpected>(opts: {
  forbiddenPhrases: (input: ScoreInput<TInput, TOutput, TExpected>) => readonly string[];
  output?: OutputSelector<TInput, TOutput, TExpected>;
  options?: ForbiddenPhraseOptions;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "forbidden_phrases",
    description: "Checks that blocked phrases do not appear in the output.",
    scorer: (input) =>
      scoreForbiddenPhrases(
        (opts.output ?? defaultOutputSelector)(input),
        opts.forbiddenPhrases(input),
        opts.options,
      ),
  });
}

export function createTextGuardrailScorer<TInput, TOutput, TExpected>(opts: {
  spec: (input: ScoreInput<TInput, TOutput, TExpected>) => TextGuardrailSpec;
  output?: OutputSelector<TInput, TOutput, TExpected>;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "text_guardrails",
    description: "Runs deterministic text guardrails for preservation, terminology, and length.",
    scorer: (input) =>
      scoreTextGuardrails((opts.output ?? defaultOutputSelector)(input), opts.spec(input)),
  });
}
