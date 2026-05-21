# Evalite QA Workshop Agent Instructions

This is an advanced QA workshop for evaluating AI behavior with Evalite,
synthetic datasets, and live AI proxy calls.

Rules:

- Work only with the current checkout. Do not inspect other git refs, tags,
  or hidden answer materials unless the user explicitly asks.
- Keep changes within the active lab or instruction scope. Do not broaden a lab
  into framework, product, or infrastructure work.
- Use synthetic workshop data only. Do not introduce production, customer,
  private, or personally identifiable data.
- Do not add, print, commit, or infer secrets. Local `.env` values are for the
  participant's machine only.
- Prefer small, reviewable edits to prompts, expectations, labels, thresholds,
  scorers, and synthetic cases.
- Keep AI proxy as the live default unless the user explicitly asks for a
  different provider or mock mode.
- Run the narrowest useful gate after edits. Use `pnpm run data:check` after
  dataset changes, the relevant `pnpm run lab:NN` after lab changes,
  `pnpm run live:check` for live model path changes, and `pnpm run verify`
  before considering broad workshop changes complete.
- If a requested step depends on missing workshop context, ask the instructor or
  user instead of searching for hidden answers.
