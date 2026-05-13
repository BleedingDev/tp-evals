import { z } from "zod";

export const CapabilitySchema = z.enum([
  "translation",
  "mobile_search",
  "travel_summary",
  "prompt_injection",
  "consistency",
  "dataset_quality",
]);

export const CaseTypeSchema = z.enum(["passing", "failing", "borderline"]);
export const RiskLevelSchema = z.enum(["low", "medium", "high"]);
export const ParticipantEditTargetSchema = z.enum([
  "input",
  "expected",
  "metadata",
  "labels",
  "thresholds",
]);

export const SourceInfoSchema = z
  .object({
    origin: z.enum(["synthetic", "workshop-authored"]),
    anonymized: z.literal(true),
    containsSensitiveData: z.literal(false),
    notes: z.string().min(1),
  })
  .strict();

export const WorkshopMetadataSchema = z
  .object({
    difficulty: z.enum(["intro", "practice", "challenge"]),
    participantEditTargets: z.array(ParticipantEditTargetSchema).min(1),
    reviewHint: z.string().min(1).optional(),
  })
  .strict();

const commonFields = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  source: SourceInfoSchema,
  risk: RiskLevelSchema,
  labels: z.array(z.string().min(1)).min(1),
  caseType: CaseTypeSchema,
  expectedBehavior: z.string().min(1),
  metadata: WorkshopMetadataSchema,
};

const SlotValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

export const TranslationInputSchema = z
  .object({
    sourceLanguage: z.string().min(2),
    targetLanguage: z.string().min(2),
    sourceText: z.string().min(1),
    context: z.string().min(1),
    placeholders: z.array(z.string()).optional(),
    protectedTerms: z.array(z.string()).optional(),
  })
  .strict();

export const TranslationExpectedSchema = z
  .object({
    idealText: z.string().min(1),
    mustPreserve: z.array(z.string()),
    forbiddenPatterns: z.array(z.string()),
    glossary: z.record(z.string(), z.string()).optional(),
    minQualityScore: z.number().min(0).max(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export const MobileSearchInputSchema = z
  .object({
    utterance: z.string().min(1),
    locale: z.string().min(2),
    platform: z.enum(["ios", "android", "mobile-web"]),
    appScreen: z.string().min(1),
    conversation: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export const MobileSearchExpectedSchema = z
  .object({
    intent: z.enum([
      "find_item",
      "compare_options",
      "filter_results",
      "sort_results",
      "open_result",
      "ask_clarification",
      "unknown",
    ]),
    requiredSlots: z.record(z.string(), SlotValueSchema),
    missingSlots: z.array(z.string()),
    disallowedSlots: z.array(z.string()),
    ambiguity: z.enum(["none", "low", "high"]),
    clarificationQuestion: z.string().min(1).optional(),
    minIntentConfidence: z.number().min(0).max(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export const TravelSummaryInputSchema = z
  .object({
    userQuestion: z.string().min(1),
    sourceText: z.string().min(1),
    audience: z.string().min(1),
  })
  .strict();

export const TravelSummaryExpectedSchema = z
  .object({
    idealSummary: z.string().min(1),
    requiredFacts: z.array(z.string().min(1)),
    forbiddenClaims: z.array(z.string().min(1)),
    maxSentences: z.number().int().min(1).max(5),
    includeWarning: z.boolean(),
    insufficientSource: z.boolean(),
    minFactCoverage: z.number().min(0).max(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export const PromptInjectionInputSchema = z
  .object({
    userRequest: z.string().min(1),
    trustedInstruction: z.string().min(1),
    suppliedText: z.string().min(1),
    task: z.string().min(1),
  })
  .strict();

export const PromptInjectionExpectedSchema = z
  .object({
    mustIgnoreInstructionsFromSuppliedText: z.boolean(),
    blockedInstructions: z.array(z.string().min(1)),
    requiredResponseTraits: z.array(z.string().min(1)),
    prohibitedResponseTraits: z.array(z.string().min(1)),
    allowedContent: z.array(z.string().min(1)),
    minRobustnessScore: z.number().min(0).max(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export const ConsistencyInputSchema = z
  .object({
    evaluationPrompt: z.string().min(1),
    variants: z.array(z.string().min(1)).min(2),
    context: z.string().min(1),
  })
  .strict();

export const ConsistencyExpectedSchema = z
  .object({
    invariantAnswer: z.string().min(1),
    mustMatchFields: z.record(z.string(), SlotValueSchema),
    allowedDifferences: z.array(z.string().min(1)),
    maxVarianceScore: z.number().min(0).max(1),
    minConsistencyScore: z.number().min(0).max(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export const DatasetQualityInputSchema = z
  .object({
    description: z.string().min(1),
    sampleRecord: z.record(z.string(), z.unknown()),
  })
  .strict();

export const DatasetQualityExpectedSchema = z
  .object({
    issueTypes: z.array(z.string().min(1)),
    fixChecklist: z.array(z.string().min(1)),
    mustRemainAnonymized: z.boolean(),
    minCompletenessScore: z.number().min(0).max(1),
    notes: z.array(z.string().min(1)),
  })
  .strict();

export const TranslationRecordSchema = z
  .object({
    ...commonFields,
    capability: z.literal("translation"),
    input: TranslationInputSchema,
    expected: TranslationExpectedSchema,
  })
  .strict();

export const MobileSearchRecordSchema = z
  .object({
    ...commonFields,
    capability: z.literal("mobile_search"),
    input: MobileSearchInputSchema,
    expected: MobileSearchExpectedSchema,
  })
  .strict();

export const TravelSummaryRecordSchema = z
  .object({
    ...commonFields,
    capability: z.literal("travel_summary"),
    input: TravelSummaryInputSchema,
    expected: TravelSummaryExpectedSchema,
  })
  .strict();

export const PromptInjectionRecordSchema = z
  .object({
    ...commonFields,
    capability: z.literal("prompt_injection"),
    input: PromptInjectionInputSchema,
    expected: PromptInjectionExpectedSchema,
  })
  .strict();

export const ConsistencyRecordSchema = z
  .object({
    ...commonFields,
    capability: z.literal("consistency"),
    input: ConsistencyInputSchema,
    expected: ConsistencyExpectedSchema,
  })
  .strict();

export const DatasetQualityRecordSchema = z
  .object({
    ...commonFields,
    capability: z.literal("dataset_quality"),
    input: DatasetQualityInputSchema,
    expected: DatasetQualityExpectedSchema,
  })
  .strict();

export const DatasetRecordSchema = z.discriminatedUnion("capability", [
  TranslationRecordSchema,
  MobileSearchRecordSchema,
  TravelSummaryRecordSchema,
  PromptInjectionRecordSchema,
  ConsistencyRecordSchema,
  DatasetQualityRecordSchema,
]);

export type Capability = z.infer<typeof CapabilitySchema>;
export type CaseType = z.infer<typeof CaseTypeSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type ParticipantEditTarget = z.infer<typeof ParticipantEditTargetSchema>;
export type SourceInfo = z.infer<typeof SourceInfoSchema>;
export type WorkshopMetadata = z.infer<typeof WorkshopMetadataSchema>;
export type TranslationRecord = z.infer<typeof TranslationRecordSchema>;
export type MobileSearchRecord = z.infer<typeof MobileSearchRecordSchema>;
export type TravelSummaryRecord = z.infer<typeof TravelSummaryRecordSchema>;
export type PromptInjectionRecord = z.infer<typeof PromptInjectionRecordSchema>;
export type ConsistencyRecord = z.infer<typeof ConsistencyRecordSchema>;
export type DatasetQualityRecord = z.infer<typeof DatasetQualityRecordSchema>;
export type DatasetRecord = z.infer<typeof DatasetRecordSchema>;
