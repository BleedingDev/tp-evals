import {
  extractMobileSearchIntent,
  mobileSearchVariants,
  summarizeTravelInfo,
  translate,
  translationVariants,
  travelSummaryVariants,
  type AnyCapabilityInput,
  type AnyCapabilityOutput,
  type CapabilityApp,
  type MockVariant,
  type MobileSearchInput,
  type MobileSearchOutput,
  type RuntimeMode,
  type TranslationInput,
  type TranslationOutput,
  type TravelSummaryInput,
  type TravelSummaryOutput,
} from "../apps/index.js";
import { loadWorkshopEnv } from "../env.js";
import { createOpenRouterProvider } from "../providers/openrouter.js";

export type VariantId =
  | "translation.baseline"
  | "translation.flawed"
  | "translation.improved"
  | "mobile_search.baseline"
  | "mobile_search.flawed"
  | "mobile_search.improved"
  | "travel_summary.baseline"
  | "travel_summary.flawed"
  | "travel_summary.improved";

export interface VariantDefinition<I extends AnyCapabilityInput, O extends AnyCapabilityOutput> {
  readonly id: VariantId;
  readonly capability: CapabilityApp;
  readonly variant: MockVariant;
  readonly mode: "mock";
  readonly modelName: string;
  readonly promptName: string;
  readonly description: string;
  readonly run: (input: I) => O;
}

export type AnyVariantDefinition =
  | VariantDefinition<TranslationInput, TranslationOutput>
  | VariantDefinition<MobileSearchInput, MobileSearchOutput>
  | VariantDefinition<TravelSummaryInput, TravelSummaryOutput>;

export interface RunVariantOptions {
  readonly mode?: RuntimeMode;
  readonly variant?: MockVariant;
  readonly variantId?: VariantId;
}

export interface LiveProvider {
  readonly translate?: (
    input: TranslationInput,
    options: RunVariantOptions,
  ) => Promise<TranslationOutput> | TranslationOutput;
  readonly extractMobileSearchIntent?:
    | ((
      input: MobileSearchInput,
      options: RunVariantOptions,
    ) => Promise<MobileSearchOutput> | MobileSearchOutput)
    | undefined;
  readonly summarizeTravelInfo?:
    | ((
      input: TravelSummaryInput,
      options: RunVariantOptions,
    ) => Promise<TravelSummaryOutput> | TravelSummaryOutput)
    | undefined;
}

const definitions = [
  {
    id: "translation.baseline",
    capability: "translation",
    variant: "baseline",
    mode: "mock",
    modelName: "mock-translation-stable",
    promptName: "plain-ui-translation",
    description:
      "A deterministic translation mock with a few realistic terminology misses.",
    run: translationVariants.baseline,
  },
  {
    id: "translation.flawed",
    capability: "translation",
    variant: "flawed",
    mode: "mock",
    modelName: "mock-translation-loose",
    promptName: "under-specified-translation",
    description:
      "A deterministic translation mock that breaks placeholders, tags, protected terms, and explanation discipline.",
    run: translationVariants.flawed,
  },
  {
    id: "translation.improved",
    capability: "translation",
    variant: "improved",
    mode: "mock",
    modelName: "mock-translation-guarded",
    promptName: "guardrailed-translation",
    description:
      "A deterministic translation mock that preserves supplied structure and glossary terms.",
    run: translationVariants.improved,
  },
  {
    id: "mobile_search.baseline",
    capability: "mobile_search",
    variant: "baseline",
    mode: "mock",
    modelName: "mock-intent-stable",
    promptName: "plain-mobile-intent",
    description:
      "A deterministic mobile-search mock that handles direct requests but misses some ambiguity and history cases.",
    run: mobileSearchVariants.baseline,
  },
  {
    id: "mobile_search.flawed",
    capability: "mobile_search",
    variant: "flawed",
    mode: "mock",
    modelName: "mock-intent-loose",
    promptName: "under-specified-mobile-intent",
    description:
      "A deterministic mobile-search mock that invents slots, changes intent, and ignores conversation history.",
    run: mobileSearchVariants.flawed,
  },
  {
    id: "mobile_search.improved",
    capability: "mobile_search",
    variant: "improved",
    mode: "mock",
    modelName: "mock-intent-guarded",
    promptName: "guardrailed-mobile-intent",
    description:
      "A deterministic mobile-search mock that returns structured intents and clarification questions.",
    run: mobileSearchVariants.improved,
  },
  {
    id: "travel_summary.baseline",
    capability: "travel_summary",
    variant: "baseline",
    mode: "mock",
    modelName: "mock-summary-stable",
    promptName: "plain-source-summary",
    description:
      "A deterministic travel-summary mock that usually follows the source but misses selected warnings.",
    run: travelSummaryVariants.baseline,
  },
  {
    id: "travel_summary.flawed",
    capability: "travel_summary",
    variant: "flawed",
    mode: "mock",
    modelName: "mock-summary-loose",
    promptName: "under-specified-source-summary",
    description:
      "A deterministic travel-summary mock that adds unsupported claims and ignores insufficient source text.",
    run: travelSummaryVariants.flawed,
  },
  {
    id: "travel_summary.improved",
    capability: "travel_summary",
    variant: "improved",
    mode: "mock",
    modelName: "mock-summary-guarded",
    promptName: "guardrailed-source-summary",
    description:
      "A deterministic travel-summary mock that summarizes only supplied text and preserves source uncertainty.",
    run: travelSummaryVariants.improved,
  },
] as const satisfies readonly AnyVariantDefinition[];

const definitionsById = new Map<VariantId, AnyVariantDefinition>(
  definitions.map((definition) => [definition.id, definition]),
);

const defaultVariantIds = {
  translation: "translation.baseline",
  mobile_search: "mobile_search.baseline",
  travel_summary: "travel_summary.baseline",
} as const satisfies Record<CapabilityApp, VariantId>;

let liveProvider: LiveProvider | undefined;

loadWorkshopEnv();
liveProvider = createOpenRouterProvider();

export const registerLiveProvider = (provider: LiveProvider): void => {
  liveProvider = provider;
};

export const resolveRuntimeMode = (requested?: RuntimeMode): RuntimeMode => {
  if (requested !== undefined) {
    return requested;
  }

  return process.env["WORKSHOP_MODE"] === "mock" ? "mock" : "live";
};

export const listVariants = (capability?: CapabilityApp): readonly AnyVariantDefinition[] => {
  if (capability === undefined) {
    return definitions;
  }

  return definitions.filter((definition) => definition.capability === capability);
};

export const getDefaultVariantId = (capability: CapabilityApp): VariantId =>
  defaultVariantIds[capability];

export const getVariant = (id: VariantId): AnyVariantDefinition => {
  const definition = definitionsById.get(id);

  if (definition === undefined) {
    throw new Error(`Unknown variant: ${id}`);
  }

  return definition;
};

const variantFromId = (
  capability: CapabilityApp,
  id: VariantId | undefined,
): MockVariant | undefined => {
  if (id === undefined) {
    return undefined;
  }

  const definition = getVariant(id);
  if (definition.capability !== capability) {
    throw new Error(`Variant ${id} cannot run capability ${capability}.`);
  }

  return definition.variant;
};

const requireLiveProvider = (): LiveProvider => {
  if (liveProvider === undefined) {
    throw new Error(
      "Live mode requires a registered provider. The default provider uses OPENROUTER_API_KEY.",
    );
  }

  return liveProvider;
};

export const runTranslationVariant = (
  input: TranslationInput,
  options: RunVariantOptions = {},
): TranslationOutput => {
  const variant = options.variant ?? variantFromId("translation", options.variantId);
  return translate(input, variant === undefined ? {} : { variant });
};

export const runMobileSearchVariant = (
  input: MobileSearchInput,
  options: RunVariantOptions = {},
): MobileSearchOutput => {
  const variant =
    options.variant ?? variantFromId("mobile_search", options.variantId);
  return extractMobileSearchIntent(
    input,
    variant === undefined ? {} : { variant },
  );
};

export const runTravelSummaryVariant = (
  input: TravelSummaryInput,
  options: RunVariantOptions = {},
): TravelSummaryOutput => {
  const variant =
    options.variant ?? variantFromId("travel_summary", options.variantId);
  return summarizeTravelInfo(input, variant === undefined ? {} : { variant });
};

export async function runCapability(
  capability: "translation",
  input: TranslationInput,
  options?: RunVariantOptions,
): Promise<TranslationOutput>;
export async function runCapability(
  capability: "mobile_search",
  input: MobileSearchInput,
  options?: RunVariantOptions,
): Promise<MobileSearchOutput>;
export async function runCapability(
  capability: "travel_summary",
  input: TravelSummaryInput,
  options?: RunVariantOptions,
): Promise<TravelSummaryOutput>;
export async function runCapability(
  capability: CapabilityApp,
  input: AnyCapabilityInput,
  options: RunVariantOptions = {},
): Promise<AnyCapabilityOutput> {
  const mode = resolveRuntimeMode(options.mode);

  if (mode === "live") {
    const provider = requireLiveProvider();

    if (capability === "translation" && provider.translate !== undefined) {
      return await provider.translate(input as TranslationInput, options);
    }

    if (
      capability === "mobile_search" &&
      provider.extractMobileSearchIntent !== undefined
    ) {
      return await provider.extractMobileSearchIntent(input as MobileSearchInput, options);
    }

    if (
      capability === "travel_summary" &&
      provider.summarizeTravelInfo !== undefined
    ) {
      return await provider.summarizeTravelInfo(input as TravelSummaryInput, options);
    }

    throw new Error(`No live provider registered for ${capability}.`);
  }

  if (capability === "translation") {
    return runTranslationVariant(input as TranslationInput, options);
  }

  if (capability === "mobile_search") {
    return runMobileSearchVariant(input as MobileSearchInput, options);
  }

  return runTravelSummaryVariant(input as TravelSummaryInput, options);
}

export const runTranslation = (
  input: TranslationInput,
  options: RunVariantOptions = {},
): Promise<TranslationOutput> => runCapability("translation", input, options);

export const runMobileSearch = (
  input: MobileSearchInput,
  options: RunVariantOptions = {},
): Promise<MobileSearchOutput> => runCapability("mobile_search", input, options);

export const runTravelSummary = (
  input: TravelSummaryInput,
  options: RunVariantOptions = {},
): Promise<TravelSummaryOutput> => runCapability("travel_summary", input, options);

export { defaultVariantIds, definitions as variantRegistry };
