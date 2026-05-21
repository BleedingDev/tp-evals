import {
  createTrace,
  type CapabilityRunOptions,
  type MobileSearchAmbiguity,
  type MobileSearchInput,
  type MobileSearchIntent,
  type MobileSearchOutput,
  type MockVariant,
  type SlotMap,
} from "./types.ts";

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

const flightSlotsFromHistory = (input: MobileSearchInput): SlotMap => {
  const content = firstUserHistory(input);
  if (content === undefined) {
    return {};
  }

  const slots: SlotMap = {};
  const route = /from\s+(.+?)\s+to\s+(.+?)(?:\s+(?:departing|on|for)\b|$)/iu.exec(
    content,
  );
  const departure = /(?:departing|on)\s+(\d{4}-\d{2}-\d{2})/iu.exec(content);
  const returnDate = /returning\s+(\d{4}-\d{2}-\d{2})/iu.exec(content);
  const passengers = /for\s+(\d+)\s+(?:passengers?|travelers?|adults?)/iu.exec(
    content,
  );

  if (route?.[1] !== undefined) {
    slots["origin"] = route[1].trim();
  }

  if (route?.[2] !== undefined) {
    slots["destination"] = route[2].trim();
  }

  if (departure?.[1] !== undefined) {
    slots["departureDate"] = departure[1];
  }

  if (returnDate?.[1] !== undefined) {
    slots["returnDate"] = returnDate[1];
  }

  if (passengers?.[1] !== undefined) {
    slots["passengers"] = Number(passengers[1]);
  }

  return slots;
};

const improvedMobileSearch = (input: MobileSearchInput): MobileSearchOutput => {
  const utterance = normalize(input.utterance);
  const historyFlightSlots = flightSlotsFromHistory(input);
  const hasFlightContext =
    historyFlightSlots["origin"] !== undefined &&
    historyFlightSlots["destination"] !== undefined;

  if (
    utterance ===
    "find flights from sfo to tokyo on 2026-06-12 returning 2026-06-20 for 2 adults in economy nonstop under 900"
  ) {
    return makeOutput(
      "improved",
      "find_item",
      {
        origin: "SFO",
        destination: "Tokyo",
        departureDate: "2026-06-12",
        returnDate: "2026-06-20",
        passengers: 2,
        cabinClass: "economy",
        directOnly: true,
        maxPrice: 900,
      },
      [],
      "none",
      0.94,
    );
  }

  if (utterance === "i need a flight to denver friday morning") {
    return makeOutput(
      "improved",
      "ask_clarification",
      { destination: "Denver" },
      ["origin", "departureDate"],
      "high",
      0.68,
      [],
      [],
      "Where are you flying from, and which Friday should I use?",
    );
  }

  if (
    utterance ===
    "show morning flights from austin to seattle on 2026-07-08 for 1 passenger"
  ) {
    return makeOutput(
      "improved",
      "find_item",
      {
        origin: "Austin",
        destination: "Seattle",
        departureDate: "2026-07-08",
        passengers: 1,
      },
      ["returnDate", "cabinClass"],
      "low",
      0.86,
    );
  }

  if (utterance === "open the third one") {
    return makeOutput(
      "improved",
      "ask_clarification",
      { resultPositions: ["3"] },
      ["result_list"],
      "high",
      0.72,
      [],
      [],
      "Which result list should I use?",
    );
  }

  if (utterance === "only under 550") {
    return makeOutput(
      "improved",
      "filter_results",
      {
        ...historyFlightSlots,
        maxPrice: 550,
      },
      hasFlightContext ? [] : ["result_list"],
      hasFlightContext ? "none" : "high",
      hasFlightContext ? 0.91 : 0.7,
    );
  }

  if (utterance === "compare the first two") {
    return makeOutput(
      "improved",
      "compare_options",
      {
        ...historyFlightSlots,
        resultPositions: ["1", "2"],
      },
      hasFlightContext ? [] : ["result_list"],
      hasFlightContext ? "low" : "high",
      hasFlightContext ? 0.86 : 0.7,
    );
  }

  if (utterance === "show me the nonstop one") {
    return makeOutput(
      "improved",
      "ask_clarification",
      {
        ...historyFlightSlots,
        directOnly: true,
        resultPositions: ["1", "3"],
      },
      ["unique_result"],
      "high",
      0.74,
      [],
      [],
      "Do you mean the 7:10 AM nonstop or the 5:45 PM nonstop?",
    );
  }

  if (utterance === "put shortest flights first") {
    return makeOutput(
      "improved",
      "sort_results",
      {
        ...historyFlightSlots,
        sortBy: "duration",
        sortDirection: "ascending",
      },
      hasFlightContext ? [] : ["result_list"],
      hasFlightContext ? "none" : "high",
      hasFlightContext ? 0.91 : 0.72,
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
    "What flight would you like to search for?",
  );
};

const baselineMobileSearch = (input: MobileSearchInput): MobileSearchOutput => {
  const utterance = normalize(input.utterance);

  if (utterance === "i need a flight to denver friday morning") {
    return makeOutput(
      "baseline",
      "find_item",
      { destination: "Denver", departureDate: "2026-05-15" },
      [],
      "low",
      0.58,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["departureDate"],
    );
  }

  if (utterance === "open the third one") {
    return makeOutput(
      "baseline",
      "open_result",
      { resultPositions: ["3"], resultId: "flight-option-3" },
      [],
      "low",
      0.6,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["resultId"],
    );
  }

  if (utterance === "only under 550") {
    return makeOutput(
      "baseline",
      "filter_results",
      { maxPrice: 550 },
      ["origin", "destination"],
      "high",
      0.76,
      ["conversation-history-ignored"],
    );
  }

  if (utterance === "show me the nonstop one") {
    return makeOutput(
      "baseline",
      "open_result",
      { directOnly: true, resultId: "flight-option-1" },
      [],
      "low",
      0.62,
      ["ambiguous-reference-opened", "invented-field"],
      ["resultId"],
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

  if (
    utterance ===
    "find flights from sfo to tokyo on 2026-06-12 returning 2026-06-20 for 2 adults in economy nonstop under 900"
  ) {
    return makeOutput(
      "flawed",
      "find_item",
      {
        origin: "SFO",
        destination: "Tokyo",
        departureDate: "2026-06-12",
        passengers: 2,
        airline: "invented-airline",
      },
      ["returnDate", "cabinClass"],
      "none",
      0.81,
      ["invented-field", "missing-slot"],
      ["airline"],
    );
  }

  if (utterance === "i need a flight to denver friday morning") {
    return makeOutput(
      "flawed",
      "find_item",
      { origin: "current location", destination: "Denver", departureDate: "2026-05-15" },
      [],
      "low",
      0.64,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["origin", "departureDate"],
    );
  }

  if (
    utterance ===
    "show morning flights from austin to seattle on 2026-07-08 for 1 passenger"
  ) {
    return makeOutput(
      "flawed",
      "find_item",
      {
        origin: "Austin",
        destination: "Seattle",
        departureDate: "2026-07-08",
        passengers: 1,
        cabinClass: "business",
      },
      [],
      "none",
      0.86,
      ["invented-field", "missing-refinement-slots"],
      ["cabinClass"],
    );
  }

  if (utterance === "open the third one") {
    return makeOutput(
      "flawed",
      "open_result",
      { resultPositions: ["3"], resultId: "flight-option-3" },
      [],
      "none",
      0.77,
      ["invented-field", "changed-intent", "missing-follow-up-question"],
      ["resultId"],
    );
  }

  if (utterance === "only under 550") {
    return makeOutput(
      "flawed",
      "find_item",
      { destination: "anywhere", maxPrice: 550 },
      [],
      "low",
      0.65,
      ["conversation-history-ignored", "changed-intent", "invented-field"],
      ["destination"],
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

  if (utterance === "show me the nonstop one") {
    return makeOutput(
      "flawed",
      "open_result",
      { directOnly: true, resultId: "flight-option-1" },
      [],
      "none",
      0.69,
      ["ambiguous-reference-opened", "invented-field"],
      ["resultId"],
    );
  }

  if (utterance === "put shortest flights first") {
    return makeOutput(
      "flawed",
      "filter_results",
      { sortBy: "duration", maxPrice: 550 },
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
    { destination: "popular destinations" },
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
