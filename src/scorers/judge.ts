import { judgeWithOptionalLive, type LiveJudgeOptions } from "../judges/live-judge";
import { mockJudge } from "../judges/mock-judge";
import type { Rubric, WorkshopRubricId } from "../judges/rubrics";
import {
  createEvaliteScorer,
  makeResult,
  type ScoreInput,
  type ScorerResult,
} from "./common";

export interface JudgeScoringRequest {
  rubric?: Rubric | WorkshopRubricId;
  input?: unknown;
  output: unknown;
  expected?: unknown;
  threshold?: number;
  live?: LiveJudgeOptions;
}

export async function scoreWithJudge(
  request: JudgeScoringRequest,
): Promise<ScorerResult> {
  const result = await judgeWithOptionalLive(request);

  return makeResult(
    result.score,
    result.summary,
    {
      dimensions: result.dimensions,
      calibration: result.calibration,
      raw: result.raw,
    },
    request.threshold ?? 0.8,
  );
}

export function scoreWithMockJudge(request: JudgeScoringRequest): ScorerResult {
  const result = mockJudge(request);

  return makeResult(
    result.score,
    result.summary,
    {
      dimensions: result.dimensions,
      calibration: result.calibration,
    },
    request.threshold ?? 0.8,
  );
}

export function createJudgeScorer<TInput, TOutput, TExpected>(opts: {
  rubric: (input: ScoreInput<TInput, TOutput, TExpected>) => Rubric | WorkshopRubricId;
  input?: (input: ScoreInput<TInput, TOutput, TExpected>) => unknown;
  output?: (input: ScoreInput<TInput, TOutput, TExpected>) => unknown;
  expected?: (input: ScoreInput<TInput, TOutput, TExpected>) => unknown;
  threshold?: number;
  live?: LiveJudgeOptions;
}) {
  return createEvaliteScorer<TInput, TOutput, TExpected>({
    name: "rubric_judge",
    description: "Scores output with the workshop rubric judge.",
    scorer: async (input) => {
      const request: JudgeScoringRequest = {
        rubric: opts.rubric(input),
        output: opts.output ? opts.output(input) : input.output,
      };

      if (opts.input) {
        request.input = opts.input(input);
      } else {
        request.input = input.input;
      }

      if (opts.expected) {
        request.expected = opts.expected(input);
      } else {
        request.expected = input.expected;
      }

      if (opts.threshold !== undefined) {
        request.threshold = opts.threshold;
      }

      if (opts.live) {
        request.live = opts.live;
      }

      return scoreWithJudge(request);
    },
  });
}
