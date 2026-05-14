# Evalite QA Workshop Instructions

You are working in the current workshop checkout.

Rules:

- Do not inspect other git refs, tags, or hidden answer materials unless the
  user explicitly asks.
- Keep every change inside the current prompt or lab scope.
- Use only synthetic workshop data. Do not add production data, customer data,
  personal data, or secrets.
- Treat `.env` and `OPENROUTER_API_KEY` as local-only secrets. Never print or
  commit them.
- The default live path is OpenRouter with the model configured in `.env`.
  Preserve that default unless the prompt says otherwise.
- For TypeScript or eval changes, run the appropriate gate before finishing:
  `pnpm run typecheck`, `pnpm run data:check`, the relevant `pnpm run lab:NN`,
  `pnpm run live:check`, or `pnpm run verify` for broad changes.
- Do not solve future labs or reveal hidden outcomes. If the task is ambiguous,
  ask for the next workshop instruction.
