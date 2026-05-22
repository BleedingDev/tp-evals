# Lab 04: Mobile Search Intent

## Kontext

Testujete single-turn mobile search intent extraction. Uživatel napíše krátkou větu v mobilní aplikaci a model má vrátit strukturovaný výstup: `intent`, `slots`, `missingSlots`, `ambiguity`, `confidence` a seznam nechtěně vymyšlených polí.

Pro QA je riziko dvojí: model může podextrahovat důležité flight slots, nebo naopak vymyslet origin, airline, fare cap či datum, které uživatel neřekl. Slot je konkrétní hodnota vytažená z dotazu, například `origin`, `destination`, `departureDate`, `passengers` nebo `maxPrice`.

## Cíl

Ověřit, že structured-output scorer postihuje intent, required slots, missing slots, disallowed slots a threshold pro confidence tak, aby výstup šel použít jako automatizační gate.

## Runtime a kontrakt

- Runtime: live generation + deterministic scorers.
- Stabilní lab contract: [Lab 04](../facilitator/lab-contracts.md#lab-04---mobile-search-intent).
- Scorer je deterministický, ale live model může vrátit jiné `missingSlots`, `confidence` nebo `intent`.

## Soubory

- `evals/04-mobile-search-intent.eval.ts`
- `data/evals/mobile-search-intents.jsonl`
- `src/providers/live-model.ts`
- `src/scorers/structured-output.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:04
```

Vyberte jeden přímý search případ a jeden ambiguous případ. U každého ručně porovnejte dataset `expected` s model output v Evalite:

Kde přesně hledat:

1. Otevřete `.evalite/results/lab-04.json` a vyberte case, kde `next` není `pass`.
2. Stejné case ID najděte v `data/evals/mobile-search-intents.jsonl`.
3. V datasetu čtěte `input.utterance`, `expected.intent`, `expected.requiredSlots`, `expected.missingSlots`, `expected.disallowedSlots` a `expected.minIntentConfidence`.
4. V result exportu porovnejte model output a `scores` pro stejný case.

Tabulku čtěte takto:

- `intent` čtěte jako `expected->actual`: vlevo je očekávání z datasetu, vpravo výstup modelu. Zkratky: `ask` = `ask_clarification`, `find` = `find_item`, `open` = `open_result`.
- `conf` je skutečná confidence / minimální confidence z datasetu.
- `slots` je počet správně vyplněných required slots + stav `missingSlots`.
- `next` říká první věc, kterou má QA řešit: intent, invented, missing, slots, confidence, policy, nebo pass.
- Missing fields a špatné slots mají prioritu před confidence. Nízká confidence je důležitá, ale až po kontrole, zda výstup vůbec obsahuje správná pole.

1. Je `intent` správný pro další app action?
2. Jsou `requiredSlots` skutečně řečené uživatelem?
3. Jsou `missingSlots` blokující, nebo jen užitečné pro refinement?
4. Obsahují `disallowedSlots` pole, která by model mohl nebezpečně vymyslet?
5. Odpovídá `minIntentConfidence` riziku daného případu?

Pak navrhněte jednu úzkou změnu v datasetu: například přidejte `airline` do `disallowedSlots`, zpřesněte `missingSlots`, nebo upravte confidence threshold u ambiguous věty. Po změně znovu spusťte lab a sledujte, jestli scorer popisuje přesně ten problém, který jste chtěli zachytit.

## Kontrolní otázky

- Je `intent` vlevo i vpravo stejný, tedy `expected->actual`?
- Které slots uživatel opravdu řekl a které by si model jen domyslel?
- Je problém v chybějícím poli, vymyšlené hodnotě, nebo jen v confidence?

## Gate / ověření

- `pnpm run lab:04` doběhne.
- Structured output odpovídá schématu a neobsahuje vymyšlené zakázané slots.
- Ambiguous případ buď žádá o upřesnění, nebo má jasně obhájené nízké riziko.
- Confidence threshold není nastavený jen tak, aby případ prošel.

## QA rozhodnutí

Rozhodněte, jestli by daný intent extraction výstup mohl bezpečně spustit akci v aplikaci, nebo musí skončit v clarification flow.

Release blocker je hlavně vymyšlený slot, špatná akce, nebo příliš sebejistý output u nejednoznačného vstupu.
