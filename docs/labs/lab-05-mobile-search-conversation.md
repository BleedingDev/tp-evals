# Lab 05: Mobile Search Conversation

## Kontext

Tento lab testuje follow-up příkazy v mobilním flight-search flow. Poslední věta často nestačí sama o sobě: „only under 550“, „compare the first two“ nebo „show me the nonstop one“ vyžadují conversation history. Model musí správně přenést route, dates a visible results, ale nesmí si domyslet jednoznačnost, která v historii není.

Ordinal reference znamená odkaz pořadím, například „first two flights“, „third option“ nebo „the second result“. U flight search je to rizikové, protože model nesmí otevřít nebo porovnat špatný výsledek jen proto, že věta zní jasně.

## Cíl

Ověřit, že eval rozlišuje slots převzaté z historie, slots z aktuální utterance, missing slots a clarification behavior pro nejednoznačné reference.

## Soubory

- `evals/05-mobile-search-conversation.eval.ts`
- `data/evals/mobile-search-conversation.jsonl`
- `src/apps/mobile-search.ts`
- `src/scorers/structured-output.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:05
```

### Úkol Lab 05

1. Vyberte jeden `pass` case a jeden case, kde `next` není `pass`.
2. U každého napište krátkou trace: co přišlo z historie a co z aktuální věty.
3. Označte slots převzaté z historie, nové slots z utterance a chybějící slots.
4. Rozhodněte, jestli aplikace může pokračovat akcí, nebo se musí doptat.
5. U ambiguous case zkuste upravit historii tak, aby reference byla jednoznačná, a spusťte lab znovu.

### Jak číst výstup

Otevřete `data/evals/mobile-search-conversation.jsonl`. Pro vybrané řádky vytvořte krátkou trace tabulku:

Evalite tabulku čtěte takto:

- `intent` čtěte jako `expected->actual`: vlevo je očekávání z datasetu, vpravo výstup modelu.
- `slots` je počet správně přenesených required slots + stav `missingSlots`.
- `state` je skóre scoreru `conversation_state`.
- `next` říká první QA problém: intent, confidence, missing, slots, state, policy, nebo pass.

1. Expected `intent`.
2. `slots`, které pochází z `conversation`.
3. `slots`, které pochází z aktuální `utterance`.
4. `missingSlots`, které brání bezpečné app akci.
5. Jestli má model odpovědět akcí, nebo clarification otázkou.

Příklad:

- history: `Result 1 departs 09:15 with one stop. Result 2 departs 13:40 nonstop.`
- utterance: `compare the first two`
- expected intent: `compare_options`
- expected slots: `resultPositions: ["1", "2"]`

Potom udělejte jeden řízený experiment: u ambiguous případu změňte assistant history tak, aby reference byla jednoznačná, nebo naopak z jednoznačného případu udělejte ambiguous. Re-run ukáže, jestli se změní intent, carried slots a missing-slot behavior.

## Gate / ověření

- `pnpm run lab:05` doběhne.
- U každého případu umíte vysvětlit, odkud pochází každý slot.
- Scorer `conversation_state` odděleně ukazuje intent, carried slots a missing-slot behavior.
- Clarification případ nevypadá jako běžná search action.

## QA rozhodnutí

Rozhodněte, jestli conversation state extraction může spustit navazující UI akci bez lidského zásahu.

Za blocker považujte zejména špatně přenesený route/date context, ignorovanou nejednoznačnost nebo vymyšlený `resultId`.
