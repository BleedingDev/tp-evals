import {
  createTrace,
  type CapabilityRunOptions,
  type MockVariant,
  type TravelSummaryInput,
  type TravelSummaryOutput,
} from "./types.js";

type TravelCase =
  | "ferry-window"
  | "rain-warning"
  | "luggage-unsupported"
  | "shuttle-insufficient"
  | "unknown";

const sentenceSplit = (summary: string): string[] => {
  return summary
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
};

const detectTravelCase = (input: TravelSummaryInput): TravelCase => {
  const sourceText = input.sourceText.toLowerCase();

  if (sourceText.includes("the ferry departs north harbor")) {
    return "ferry-window";
  }

  if (sourceText.includes("the ridge path opens")) {
    return "rain-warning";
  }

  if (sourceText.includes("lockers are available near the lobby")) {
    return "luggage-unsupported";
  }

  if (sourceText.includes("a morning shuttle may run")) {
    return "shuttle-insufficient";
  }

  return "unknown";
};

const makeOutput = (
  variant: MockVariant,
  summary: string,
  insufficientSource: boolean,
  warningsIncluded: readonly string[] = [],
  omittedWarnings: readonly string[] = [],
  unsupportedClaims: readonly string[] = [],
  failureModes: readonly string[] = [],
): TravelSummaryOutput => ({
  capability: "travel_summary",
  variant,
  summary,
  sentences: sentenceSplit(summary),
  insufficientSource,
  warningsIncluded,
  omittedWarnings,
  unsupportedClaims,
  trace: createTrace("travel_summary", variant, failureModes),
});

const improvedSummary = (input: TravelSummaryInput): TravelSummaryOutput => {
  switch (detectTravelCase(input)) {
    case "ferry-window":
      return makeOutput(
        "improved",
        "The ferry leaves North Harbor at 09:30, and boarding closes 10 minutes earlier. Travelers can use either a printed or mobile day pass, and large wheeled bags must be checked at the dock desk.",
        false,
      );
    case "rain-warning":
      return makeOutput(
        "improved",
        "The ridge path is open from 07:00 to 16:00. The lower lookout stays open in light rain, but the upper lookout may close without notice if wind increases, and food stalls near the lower gate accept cards only.",
        false,
        ["upper lookout may close without notice if wind increases"],
      );
    case "luggage-unsupported":
      return makeOutput(
        "improved",
        "The supplied text does not say whether oversized luggage can be brought into the gallery. It only says the entrance is beside the west stairwell, tickets should be ready for a visual check, and lockers are near the lobby without size details.",
        true,
        ["supplied text does not answer the oversized luggage policy"],
      );
    case "shuttle-insufficient":
      return makeOutput(
        "improved",
        "The supplied text only says a morning shuttle may run if weather permits and that final details will be posted at the information board; it does not provide exact timing or cost.",
        true,
        ["morning shuttle may run if weather permits"],
      );
    case "unknown":
      return makeOutput(
        "improved",
        "The supplied text does not provide enough specific travel information to answer beyond the facts it states.",
        true,
        ["source is insufficient for the requested summary"],
      );
  }
};

const baselineSummary = (input: TravelSummaryInput): TravelSummaryOutput => {
  switch (detectTravelCase(input)) {
    case "rain-warning":
      return makeOutput(
        "baseline",
        "The ridge path is open from 07:00 to 16:00, the lower lookout stays open during light rain, and food stalls near the lower gate accept cards only.",
        false,
        [],
        ["upper lookout may close without notice if wind increases"],
        [],
        ["omitted-warning"],
      );
    case "luggage-unsupported":
      return makeOutput(
        "baseline",
        "The note does not list full luggage rules, but visitors can use lockers near the lobby and should keep tickets ready for a visual check at the west stairwell entrance.",
        true,
        ["luggage policy is not fully listed"],
        [],
        ["visitors can use lockers for oversized luggage"],
        ["unsupported-claim"],
      );
    default: {
      const improved = improvedSummary(input);
      return {
        ...improved,
        variant: "baseline",
        trace: createTrace("travel_summary", "baseline"),
      };
    }
  }
};

const flawedSummary = (input: TravelSummaryInput): TravelSummaryOutput => {
  switch (detectTravelCase(input)) {
    case "ferry-window":
      return makeOutput(
        "flawed",
        "The ferry leaves North Harbor at 09:30, runs throughout the morning, and travelers need a booking identifier before boarding.",
        false,
        [],
        [],
        ["The ferry runs throughout the morning.", "A booking identifier is required."],
        ["unsupported-claim", "omitted-required-fact"],
      );
    case "rain-warning":
      return makeOutput(
        "flawed",
        "The ridge path is open from 07:00 to 16:00, but the upper lookout is closed all day, and food stalls accept cash and cards.",
        false,
        [],
        ["upper lookout may close without notice if wind increases"],
        ["The upper lookout is closed all day.", "Cash is accepted at the food stalls."],
        ["unsupported-claim", "warning-exaggerated"],
      );
    case "luggage-unsupported":
      return makeOutput(
        "flawed",
        "Oversized luggage is allowed in the gallery, and large lockers are available near the lobby after the west stairwell ticket check.",
        false,
        [],
        ["supplied text does not answer the oversized luggage policy"],
        ["Oversized luggage is allowed.", "Locker size limits are listed."],
        ["unsupported-claim", "insufficient-source-ignored"],
      );
    case "shuttle-insufficient":
      return makeOutput(
        "flawed",
        "The morning shuttle is confirmed, runs every hour, and is free if weather permits.",
        false,
        [],
        ["exact timing is not supplied", "cost is not supplied"],
        [
          "The shuttle is confirmed.",
          "The shuttle runs every hour.",
          "The shuttle is free.",
        ],
        ["unsupported-claim", "insufficient-source-ignored"],
      );
    case "unknown":
      return makeOutput(
        "flawed",
        "Travelers should check the normal schedule and arrive early.",
        false,
        [],
        ["source is insufficient for the requested summary"],
        ["A normal schedule exists.", "Arriving early is required."],
        ["unsupported-claim", "insufficient-source-ignored"],
      );
  }
};

export const summarizeTravelInfo = (
  input: TravelSummaryInput,
  options: CapabilityRunOptions = {},
): TravelSummaryOutput => {
  const variant = options.variant ?? "baseline";

  if (variant === "flawed") {
    return flawedSummary(input);
  }

  if (variant === "improved") {
    return improvedSummary(input);
  }

  return baselineSummary(input);
};

export const travelSummaryVariants = {
  baseline: baselineSummary,
  flawed: flawedSummary,
  improved: improvedSummary,
} as const satisfies Record<
  MockVariant,
  (input: TravelSummaryInput) => TravelSummaryOutput
>;
