import type {
  MobileSearchRecord,
  TranslationRecord,
  TravelSummaryRecord,
} from "../datasets/index.js";

export type CapabilityApp = "translation" | "mobile_search" | "travel_summary";
export type MockVariant = "baseline" | "flawed" | "improved";
export type OutputVariant = MockVariant | "live";
export type RuntimeMode = "mock" | "live";

export type TranslationInput = TranslationRecord["input"];
export type MobileSearchInput = MobileSearchRecord["input"];
export type TravelSummaryInput = TravelSummaryRecord["input"];

export type MobileSearchIntent = MobileSearchRecord["expected"]["intent"];
export type MobileSearchAmbiguity = MobileSearchRecord["expected"]["ambiguity"];
export type SlotValue = string | number | boolean | string[];
export type SlotMap = Record<string, SlotValue>;

export interface CapabilityTrace {
  readonly capability: CapabilityApp;
  readonly variant: OutputVariant;
  readonly mode: RuntimeMode;
  readonly failureModes: readonly string[];
  readonly modelName?: string;
  readonly promptName?: string;
}

export interface TranslationOutput {
  readonly capability: "translation";
  readonly variant: OutputVariant;
  readonly text: string;
  readonly preservedFragments: readonly string[];
  readonly changedFragments: readonly string[];
  readonly addedExplanation: boolean;
  readonly trace: CapabilityTrace;
}

export interface MobileSearchOutput {
  readonly capability: "mobile_search";
  readonly variant: OutputVariant;
  readonly intent: MobileSearchIntent;
  readonly slots: SlotMap;
  readonly missingSlots: readonly string[];
  readonly ambiguity: MobileSearchAmbiguity;
  readonly confidence: number;
  readonly followUpQuestions: readonly string[];
  readonly inventedSlots: readonly string[];
  readonly followUpQuestion?: string;
  readonly trace: CapabilityTrace;
}

export interface TravelSummaryOutput {
  readonly capability: "travel_summary";
  readonly variant: OutputVariant;
  readonly summary: string;
  readonly sentences: readonly string[];
  readonly insufficientSource: boolean;
  readonly warningsIncluded: readonly string[];
  readonly omittedWarnings: readonly string[];
  readonly unsupportedClaims: readonly string[];
  readonly trace: CapabilityTrace;
}

export type AnyCapabilityInput =
  | TranslationInput
  | MobileSearchInput
  | TravelSummaryInput;

export type AnyCapabilityOutput =
  | TranslationOutput
  | MobileSearchOutput
  | TravelSummaryOutput;

export interface CapabilityRunOptions {
  readonly variant?: MockVariant;
}

export const createTrace = (
  capability: CapabilityApp,
  variant: OutputVariant,
  failureModes: readonly string[] = [],
  metadata: {
    readonly mode?: RuntimeMode;
    readonly modelName?: string;
    readonly promptName?: string;
  } = {},
): CapabilityTrace => ({
  capability,
  variant,
  mode: metadata.mode ?? "mock",
  failureModes,
  ...(metadata.modelName === undefined ? {} : { modelName: metadata.modelName }),
  ...(metadata.promptName === undefined ? {} : { promptName: metadata.promptName }),
});
