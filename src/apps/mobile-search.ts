import {
  createTrace,
  type CapabilityRunOptions,
  type MobileSearchAmbiguity,
  type MobileSearchInput,
  type MobileSearchIntent,
  type MobileSearchOutput,
  type MockVariant,
  type SlotMap,
} from "./types.js";

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/gu, " ");

const makeOutput = (
  variant: MockVariant,
  intent: MobileSearchIntent,
  slots: SlotMap,
  missingSlots: readonly string[],
  ambiguity: MobileSearchAmbiguity,
  confidence: number,
  failureModes: readonly string[] = [],
  inventedSlots: readonly string[] = [],
  followUpQuestion?: string,
): MobileSearchOutput => {
  const followUpQuestions =
    followUpQuestion === undefined ? [] : [followUpQuestion];

  return {
    capability: "mobile_search",
    variant,
    intent,
    slots,
    missingSlots,
    ambiguity,
    confidence,
    followUpQuestions,
    inventedSlots,
    ...(followUpQuestion === undefined ? {} : { followUpQuestion }),
    trace: createTrace("mobile_search", variant, failureModes),
  };
};

const firstUserHistory = (input: MobileSearchInput): string | undefined => {
  return input.conversation?.find((turn) => turn.role === "user")?.content;
};

const categoryFromHistory = (input: MobileSearchInput): string | undefined => {
  const content = firstUserHistory(input);
  if (content === undefined) {
    return undefined;
  }

  const match = /(?:find|show me|search for)\s+(.+)$/iu.exec(content.trim());
  const category = match?.[1]?.trim();
  return category && category.length > 0 ? category : undefined;
};

const improvedMobileSearch = (input: MobileSearchInput): MobileSearchOutput => {
  const utterance = normalize(input.utterance);
  const historyCategory = categoryFromHistory(input);

  if (utterance === "show hiking socks under 40 with breathable fabric") {
    return makeOutput(
      "improved",
      "find_item",
      { category: "hiking socks", maxPrice: 40, material: "breathable fabric" },
      [],
      "none",
      0.93,
    );
  }

  if (utterance === "i need something light for tomorrow") {
    return makeOutput(
      "improved",
      "ask_clarification",
      { timeframe: "tomorrow" },
      ["category", "use_case"],
      "high",
      0.68,
      [],
      [],
      "What type of item are you looking for?",
    );
  }

  if (utterance === "find waterproof bags") {
    return makeOutput(
      "improved",
      "find_item",
      { category: "bags", feature: "waterproof" },
      ["size", "price"],
      "low",
      0.84,
    );
  }

  if (utterance === "open the third one") {
    return makeOutput(
      "improved",
      "ask_clarification",
      { ordinal: 3 },
      ["result_list"],
      "high",
      0.72,
      [],
      [],
      "Which result list should I use?",
    );
  }

  if (utterance === "only under 25") {
    return makeOutput(
      "improved",
      "filter_results",
      {
        category: historyCategory ?? "current results",
        maxPrice: 25,
      },
      historyCategory === undefined ? ["category"] : [],
      historyCategory === undefined ? "high" : "none",
      historyCategory === undefined ? 0.7 : 0.9,
    );
  }

  if (utterance === "compare the first two") {
    return makeOutput(
      "improved",
      "compare_options",
      {
        resultPositions: ["1", "2"],
        category: historyCategory ?? "current results",
      },
      historyCategory === undefined ? ["result_list"] : [],
      historyCategory === undefined ? "high" : "low",
      historyCategory === undefined ? 0.7 : 0.86,
    );
  }

  if (utterance === "show me the blue one") {
    return makeOutput(
      "improved",
      "ask_clarification",
      {
        color: "blue",
        category: historyCategory ?? "current results",
      },
      ["unique_result"],
      "high",
      0.74,
      [],
      [],
      "Do you mean the small blue result or the large blue result?",
    );
  }

  if (utterance === "put cheapest first") {
    return makeOutput(
      "improved",
      "sort_results",
      {
        sortBy: "price",
        sortDirection: "ascending",
        category: historyCategory ?? "current results",
      },
      historyCategory === undefined ? ["result_list"] : [],
      historyCategory === undefined ? "high" : "none",
      historyCategory === undefined ? 0.72 : 0.91,
    );
  }

  return makeOutput(
    "improved",
    "unknown",
    {},
    ["intent"],
    "high",
    0.35,
    [],
    [],
    "What would you like to search for?",
  );
};

const baselineMobileSearch = (input: MobileSearchInput): MobileSearchOutput => {
  const utterance = normalize(input.utterance);

  if (utterance === "i need something light for tomorrow") {
    return makeOutput(
      "baseline",
      "find_item",
      { category: "lightweight jackets", timeframe: "tomorrow" },
      [],
      "low",
      0.58,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["category"],
    );
  }

  if (utterance === "open the third one") {
    return makeOutput(
      "baseline",
      "open_result",
      { ordinal: 3, resultPosition: 3 },
      [],
      "low",
      0.6,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["resultPosition"],
    );
  }

  if (utterance === "only under 25") {
    return makeOutput(
      "baseline",
      "filter_results",
      { maxPrice: 25 },
      ["category"],
      "high",
      0.76,
      ["conversation-history-ignored"],
    );
  }

  if (utterance === "show me the blue one") {
    return makeOutput(
      "baseline",
      "open_result",
      { color: "blue", resultPosition: 1 },
      [],
      "low",
      0.62,
      ["ambiguous-reference-opened", "invented-field"],
      ["resultPosition"],
    );
  }

  const improved = improvedMobileSearch(input);
  return {
    ...improved,
    variant: "baseline",
    trace: createTrace("mobile_search", "baseline"),
  };
};

const flawedMobileSearch = (input: MobileSearchInput): MobileSearchOutput => {
  const utterance = normalize(input.utterance);

  if (utterance === "show hiking socks under 40 with breathable fabric") {
    return makeOutput(
      "flawed",
      "find_item",
      { category: "hiking socks", maxPrice: 40, brand: "invented-brand" },
      ["material"],
      "none",
      0.81,
      ["invented-field", "missing-slot"],
      ["brand"],
    );
  }

  if (utterance === "i need something light for tomorrow") {
    return makeOutput(
      "flawed",
      "find_item",
      { category: "light jacket", timeframe: "tomorrow", priceRange: "low" },
      [],
      "low",
      0.64,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["category", "priceRange"],
    );
  }

  if (utterance === "find waterproof bags") {
    return makeOutput(
      "flawed",
      "find_item",
      { category: "travel bags", feature: "waterproof", color: "blue" },
      [],
      "none",
      0.86,
      ["invented-field", "missing-refinement-slots"],
      ["color"],
    );
  }

  if (utterance === "open the third one") {
    return makeOutput(
      "flawed",
      "open_result",
      { ordinal: 3, resultId: "result-3", category: "current results" },
      [],
      "none",
      0.77,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["resultId", "category"],
    );
  }

  if (utterance === "only under 25") {
    return makeOutput(
      "flawed",
      "find_item",
      { category: "items", maxPrice: 25 },
      [],
      "low",
      0.65,
      ["conversation-history-ignored", "changed-intent", "invented-field"],
      ["category"],
    );
  }

  if (utterance === "compare the first two") {
    return makeOutput(
      "flawed",
      "open_result",
      { resultPosition: 1 },
      [],
      "low",
      0.58,
      ["changed-intent", "missing-slot"],
    );
  }

  if (utterance === "show me the blue one") {
    return makeOutput(
      "flawed",
      "open_result",
      { color: "blue", resultPosition: 1 },
      [],
      "none",
      0.69,
      ["ambiguous-reference-opened", "invented-field"],
      ["resultPosition"],
    );
  }

  if (utterance === "put cheapest first") {
    return makeOutput(
      "flawed",
      "filter_results",
      { sortBy: "price", maxPrice: 25 },
      [],
      "low",
      0.67,
      ["changed-intent", "invented-field", "conversation-history-ignored"],
      ["maxPrice"],
    );
  }

  return makeOutput(
    "flawed",
    "find_item",
    { category: "popular items" },
    [],
    "low",
    0.42,
    ["invented-field", "changed-intent"],
    ["category"],
  );
};

export const extractMobileSearchIntent = (
  input: MobileSearchInput,
  options: CapabilityRunOptions = {},
): MobileSearchOutput => {
  const variant = options.variant ?? "baseline";

  if (variant === "flawed") {
    return flawedMobileSearch(input);
  }

  if (variant === "improved") {
    return improvedMobileSearch(input);
  }

  return baselineMobileSearch(input);
};

export const mobileSearchVariants = {
  baseline: baselineMobileSearch,
  flawed: flawedMobileSearch,
  improved: improvedMobileSearch,
} as const satisfies Record<
  MockVariant,
  (input: MobileSearchInput) => MobileSearchOutput
>;
