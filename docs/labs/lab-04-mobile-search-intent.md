# Lab 04: Mobile Search Intent

## Kontext

Testujete single-turn mobile search intent extraction. Uživatel napíše krátkou větu v mobilní aplikaci a model má vrátit strukturovaný výstup: `intent`, `slots`, `missingSlots`, `ambiguity`, `confidence` a seznam nechtěně vymyšlených polí.

Pro QA je riziko dvojí: model může podextrahovat důležité flight slots, nebo naopak vymyslet origin, airline, fare cap či datum, které uživatel neřekl. Slot je konkrétní hodnota vytažená z dotazu, například `origin`, `destination`, `departureDate`, `passengers` nebo `maxPrice`.

## Cíl

Ověřit, že structured-output scorer postihuje intent, required slots, missing slots, disallowed slots a threshold pro confidence tak, aby výstup šel použít jako automatizační gate.

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

Tabulku čtěte takto:

- `intent` je očekávaný intent > intent, který vrátil model. Zkratky: `ask` = `ask_clarification`, `find` = `find_item`, `open` = `open_result`.
- `conf` je skutečná confidence / minimální confidence z datasetu.
- `slots` je počet správně vyplněných required slots + stav `missingSlots`.
- `next` říká první věc, kterou má QA řešit: intent, confidence, invented, missing, slots, policy, nebo pass.

1. Je `intent` správný pro další app action?
2. Jsou `requiredSlots` skutečně řečené uživatelem?
3. Jsou `missingSlots` blokující, nebo jen užitečné pro refinement?
4. Obsahují `disallowedSlots` pole, která by model mohl nebezpečně vymyslet?
5. Odpovídá `minIntentConfidence` riziku daného případu?

Pak navrhněte jednu úzkou změnu v datasetu: například přidejte `airline` do `disallowedSlots`, zpřesněte `missingSlots`, nebo upravte confidence threshold u ambiguous věty. Po změně znovu spusťte lab a sledujte, jestli scorer popisuje přesně ten problém, který jste chtěli zachytit.

## Gate / ověření

- `pnpm run lab:04` doběhne.
- Structured output odpovídá schématu a neobsahuje vymyšlené zakázané slots.
- Ambiguous případ buď žádá o upřesnění, nebo má jasně obhájené nízké riziko.
- Confidence threshold není nastavený jen tak, aby případ prošel.

## QA rozhodnutí

Rozhodněte, jestli by daný intent extraction výstup mohl bezpečně spustit akci v aplikaci, nebo musí skončit v clarification flow.

Release blocker je hlavně vymyšlený slot, špatná akce, nebo příliš sebejistý output u nejednoznačného vstupu.
