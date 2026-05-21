import { clampScore } from "../scorers/common.ts";
import { loadWorkshopEnv } from "../env.ts";
import {
  getLiveProviderName,
  isLiveModelConfigured,
  judgeWithLiveModel,
} from "../providers/live-model.ts";
import {
  combineDimensionJudgments,
  createCalibrationMetadata,
  getRubric,
  type DimensionJudgment,
  type JudgeResult,
  type Rubric,
  type WorkshopRubricId,
} from "./rubrics.ts";
import { mockJudge, type MockJudgeRequest } from "./mock-judge.ts";

loadWorkshopEnv();

export interface LiveJudgeOptions {
  enabled?: boolean;
  endpoint?: string;
  timeoutMs?: number;
  fallbackToMock?: boolean;
}

interface LiveJudgeDimensionResponse {
  id: string;
  score: number;
  name?: string;
  rationale?: string;
  evidence?: readonly string[];
}

interface LiveJudgeResponse {
  score?: number;
  summary?: string;
  dimensions?: readonly LiveJudgeDimensionResponse[];
  raw?: unknown;
}

export interface OptionalLiveJudgeRequest extends MockJudgeRequest {
  rubric?: Rubric | WorkshopRubricId;
  live?: LiveJudgeOptions;
}

function liveJudgeEnabled(options: LiveJudgeOptions = {}): boolean {
  if (options.enabled !== undefined) {
    return options.enabled;
  }

  return process.env["TP_EVALS_LIVE_JUDGE"] === "1"
    || process.env["TP_EVALS_LIVE_JUDGE"] === "true"
    || process.env["LIVE_LLM_ENABLED"] === "true"
    || process.env["WORKSHOP_MODE"] === "live";
}

function liveJudgeEndpoint(options: LiveJudgeOptions = {}): string {
  return options.endpoint ?? process.env["TP_EVALS_LIVE_JUDGE_ENDPOINT"] ?? "";
}

function responseRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseLiveJudgeResponse(value: unknown): LiveJudgeResponse {
  const record = responseRecord(value);
  const rawDimensions = Array.isArray(record["dimensions"]) ? record["dimensions"] : [];
  const dimensions = rawDimensions
    .map((dimension) => responseRecord(dimension))
    .filter((dimension) => typeof dimension["id"] === "string" && typeof dimension["score"] === "number")
    .map((dimension) => {
      const parsed: LiveJudgeDimensionResponse = {
        id: String(dimension["id"]),
        score: Number(dimension["score"]),
      };

      if (typeof dimension["name"] === "string") {
        parsed.name = dimension["name"];
      }

      if (typeof dimension["rationale"] === "string") {
        parsed.rationale = dimension["rationale"];
      }

      if (Array.isArray(dimension["evidence"])) {
        parsed.evidence = dimension["evidence"].map(String);
      }

      return parsed;
    });
  const parsed: LiveJudgeResponse = { raw: value };

  if (typeof record["score"] === "number") {
    parsed.score = record["score"];
  }

  if (typeof record["summary"] === "string") {
    parsed.summary = record["summary"];
  }

  if (dimensions.length > 0) {
    parsed.dimensions = dimensions;
  }

  return parsed;
}

async function postLiveJudge(
  request: OptionalLiveJudgeRequest,
  rubric: Rubric,
  endpoint: string,
  timeoutMs: number,
): Promise<LiveJudgeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        rubric,
        input: request.input,
        output: request.output,
        expected: request.expected,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Live judge endpoint returned ${response.status}.`);
    }

    return parseLiveJudgeResponse(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

function resultFromLiveResponse(
  response: LiveJudgeResponse,
  rubric: Rubric,
  threshold: number,
): JudgeResult {
  const liveDimensions = response.dimensions ?? [];
  const dimensions: DimensionJudgment[] = rubric.dimensions.map((dimension) => {
    const liveDimension = liveDimensions.find((item) => item.id === dimension.id);

    return {
      id: dimension.id,
      name: liveDimension?.name ?? dimension.name,
      score: clampScore(liveDimension?.score ?? 0),
      weight: dimension.weight,
      rationale: liveDimension?.rationale ?? "Live judge did not provide a rationale.",
      evidence: liveDimension?.evidence ?? [],
    };
  });
  const score = response.score === undefined
    ? combineDimensionJudgments(dimensions)
    : clampScore(response.score);

  return {
    score,
    passed: score >= threshold,
    summary: response.summary ?? `Live judge scored ${rubric.name} at ${score.toFixed(2)}.`,
    dimensions,
    calibration: createCalibrationMetadata(rubric, "live"),
    raw: response.raw,
  };
}

export async function judgeWithOptionalLive(
  request: OptionalLiveJudgeRequest,
): Promise<JudgeResult> {
  const live = request.live ?? {};
  const rubric = getRubric(request.rubric ?? "summary");
  const threshold = request.threshold ?? 0.8;
  const fallbackToMock = live.fallbackToMock ?? true;

  if (!liveJudgeEnabled(live)) {
    return {
      ...mockJudge(request),
      raw: { liveJudge: "disabled" },
    };
  }

  const endpoint = liveJudgeEndpoint(live);

  if (endpoint.length === 0) {
    if (!isLiveModelConfigured()) {
      return {
        ...mockJudge(request),
        raw: { liveJudge: "missing_live_provider_key" },
      };
    }

    try {
      const response = await judgeWithLiveModel(request, rubric);

      return resultFromLiveResponse(response, rubric, threshold);
    } catch (error) {
      if (!fallbackToMock) {
        throw error;
      }

      return {
        ...mockJudge(request),
        raw: {
          liveJudge: "fallback_to_mock",
          provider: getLiveProviderName(),
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  try {
    const response = await postLiveJudge(
      request,
      rubric,
      endpoint,
      live.timeoutMs ?? 10_000,
    );

    return resultFromLiveResponse(response, rubric, threshold);
  } catch (error) {
    if (!fallbackToMock) {
      throw error;
    }

    return {
      ...mockJudge(request),
      raw: {
        liveJudge: "fallback_to_mock",
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
