# Lab 11: Agentic Eval Authoring

## Kontext

V tomto labu používáte coding agenta k vytvoření nového eval case a malé eval-code kontroly. Agent může navrhnout dataset a kód, ale QA vlastní očekávané chování, risk level, threshold a release rozhodnutí.

Důležité: začněte krátkým primárním assignmentem níže. Fallback prompt v `docs/agent-prompts/lab-11-agentic-eval-authoring.md` použijte až ve chvíli, kdy potřebujete delší zadání nebo se zaseknete.

## Cíl

Zadat agentovi ohraničený QA engineering úkol, nechat ho přidat jeden syntetický Lab 11 case a jednu malou review kontrolu, a potom jeho diff nezávisle zreviewovat.

## Runtime a kontrakt

- Runtime: live generation + judge.
- Stabilní lab contract: [Lab 11](../facilitator/lab-contracts.md#lab-11---agentic-eval-authoring).
- Agent urychluje authoring, ale QA drží risk, metadata a rozhodnutí.

## Soubory

- `docs/agent-prompts/lab-11-agentic-eval-authoring.md`
- `evals/11-agentic-eval-authoring.eval.ts`
- `data/evals/agent-authored-summary.jsonl`
- `src/scorers/summary.ts`
- `src/judges/rubrics.ts`

## Úkol

Nejdřív spusťte existující lab:

```sh
pnpm run lab:11
```

Tabulku čtěte takto:

- `source` a `judge` ověřují kvalitu agentem připraveného summary case.
- `review` ověřuje metadata: `agent-authored` label, review hint, edit targets a notes.
- `next` říká první QA problém: metadata, source, quality, review, nebo pass.
- Pokud `source` spadne a `judge` projde, věřte nejdřív source scoreru: judge může přehlédnout missing-source risk.

Potom dejte Cline, GitHub Copilot Chat nebo jinému coding agentovi tento krátký primární assignment. Je záměrně konkrétní, aby agent nemusel hádat scope:

```text
V Lab 11 přidej přesně jeden syntetický travel-summary eval case pro riziko missing source information.

Povolené soubory:
- data/evals/agent-authored-summary.jsonl
- evals/11-agentic-eval-authoring.eval.ts

Úkol:
- Přidej jeden JSONL řádek se syntetickými smyšlenými údaji. Nepoužívej reálná zákaznická, booking, airport ani route data.
- JSONL shape musí odpovídat existujícím řádkům.
- Case má ověřit, že summary nepřidává informaci, která ve sourceText chybí.
- Přidej jednu malou metadata/review kontrolu v evals/11-agentic-eval-authoring.eval.ts, která pomůže reviewerovi poznat tento risk.
- Spusť pnpm run data:check a pnpm run lab:11.
- V reportu uveď changed files, pokrytý risk, přidaný check a QA decision: release blocker, review signal, nebo weak case.
```

Pokud chcete napsat vlastní variantu, držte stejný scope:

1. Vyberte jedno riziko: unsupported claims, missing source information, warning handling, length/clarity regression, nebo high-risk case skrytý průměrem.
2. Povolte agentovi jen ty soubory, které opravdu potřebuje pro Lab 11.
3. Vyžádejte přesně jeden nový syntetický JSONL case v `data/evals/agent-authored-summary.jsonl`.
4. Vyžádejte přesně jednu malou review kontrolu, scorer nebo metadata assertion v `evals/11-agentic-eval-authoring.eval.ts`.
5. Zakažte reálná zákaznická, cestovní, booking, airport nebo route data.
6. Řekněte agentovi, že JSONL shape musí odpovídat existujícím řádkům.
7. Vyžádejte gate příkazy `pnpm run data:check` a `pnpm run lab:11`.
8. Vyžádejte závěrečný report: changed files, covered risk, přidaný check a QA rozhodnutí.

Teprve pokud se zaseknete, použijte fallback prompt:

```sh
docs/agent-prompts/lab-11-agentic-eval-authoring.md
```

Po agentově změně diff nepřebírejte slepě. Zreviewujte:

1. Je case syntetický a share-safe?
2. Je `expectedBehavior` srozumitelný pro dalšího testera?
3. Jsou `requiredFacts` a `forbiddenClaims` konkrétní?
4. Odpovídá `risk` business dopadu?
5. Je nový eval-code check skutečně užitečný, nebo jen kosmetický?
6. Vysvětluje scorer output výsledek?

Nakonec spusťte:

```sh
pnpm run data:check
pnpm run lab:11
```

## Kontrolní otázky

- Přidal agent přesně jeden syntetický case a nejvýš jednu malou review kontrolu?
- Je expected behavior testovatelné bez domýšlení?
- Umíte agentův diff obhájit jako QA evidence, nebo je to weak case?

## Gate / ověření

- `pnpm run data:check` projde.
- `pnpm run lab:11` projde nebo selže očekávaným, vysvětlitelným způsobem.
- Agent změnil jen Lab 11 dataset/eval scope.
- Nový case má `agent-authored` label, review metadata a jasné notes.
- Nový check zvyšuje review kvalitu, ne jen počet assertion.

## QA rozhodnutí

Rozhodněte, jestli agentem přidaný case je:

- release blocker,
- review signal,
- nebo weak case, který se má přepsat.

QA rozhodnutí napište vlastními slovy. Agentův report je evidence, ne autorita.
