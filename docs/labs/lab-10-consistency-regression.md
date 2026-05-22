# Lab 10: Consistency Regression

## Kontext

Testujete stabilitu odpovědí napříč parafrázemi stejného úkolu. Výstupy nemusí být textově stejné, ale musí zachovat invariant: stejné policy okno, stejný intent, stejné slots, stejné ignorování injected instrukce.

Vedle consistency scoreru se porovnává aktuální score se stored baseline. QA rozhodnutí proto musí rozlišit běžnou varianci od skutečné regression.

## Cíl

Ověřit, že equivalent prompts produkují stabilní odpovědi, že `mustMatchFields` chrání podstatné invariants a že regression threshold odpovídá riziku.

## Soubory

- `evals/10-consistency-regression.eval.ts`
- `data/evals/consistency.jsonl`
- `src/scorers/consistency.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:10
```

U každého dataset case zkontrolujte:

Kde přesně hledat:

1. Otevřete `.evalite/results/lab-10.json` a vyberte case s `regression`, `drift` nebo `policy`.
2. Stejné case ID najděte v `data/evals/consistency.jsonl`.
3. V datasetu čtěte `input.variants`, `input.context`, `expected.invariantAnswer`, `expected.mustMatchFields`, `expected.allowedDifferences` a `expected.minConsistencyScore`.
4. U regression problému otevřete v result exportu `regressionCases`.

Tabulku čtěte takto:

- `cons` je stabilita odpovědí napříč parafrázemi.
- `base` je currentScore / baselineScore.
- `reg` je regression gate proti uloženému baseline.
- `next` říká první QA problém: regression, drift, policy, nebo pass.

1. Jaký je `invariantAnswer`.
2. Které hodnoty jsou v `mustMatchFields`.
3. Které rozdíly jsou výslovně povolené v `allowedDifferences`.
4. Jaký je `minConsistencyScore`.
5. Jestli regression proti baseline signalizuje reálnou změnu chování.

Pak navrhněte jednu malou změnu. Například přidejte přesnější `mustMatchFields` pro prompt injection consistency, nebo upravte `allowedDifferences`, pokud scorer trestá neškodnou formulaci. Po re-run sledujte, jestli gate odlišuje povolenou stylistickou varianci od změny faktu nebo akce.

## Gate / ověření

- `pnpm run lab:10` doběhne.
- Každý případ má jasně pojmenovaný invariant.
- Povolené rozdíly nemaskují změnu významu.
- Regression gate odhalí významný pokles proti baseline.

## QA rozhodnutí

Rozhodněte, jestli je zjištěná variabilita přijatelná, nebo jde o regression blocker.

Za blocker považujte změnu policy hodnoty, změnu intent/slots, následování injected instrukce nebo pokles pod threshold u high-risk consistency případu.
