# Lab 03: Translation Quality Judge

## Kontext

V Labu 02 jste řešili tvrdé guardrails. Tady porovnáváte tyto kontroly s `judge` hodnocením, které má zachytit význam, plynulost a vhodnost překladu. Silný QA tým musí umět rozlišit, kdy stačí rule-based scorer a kdy je potřeba LLM as a Judge.

## Cíl

Vybrat passing, borderline a failing překladový případ, porovnat rule-based signály s judge score a rozhodnout, jestli je nastavený threshold použitelný pro release gate.

## Runtime a kontrakt

- Runtime: live generation + judge.
- Stabilní lab contract: [Lab 03](../facilitator/lab-contracts.md#lab-03---translation-quality-judge).
- Drift může vzniknout ve výstupu modelu i v judge hodnocení, proto rozhodujte podle case detailu.

## Soubory

- `evals/03-translation-quality.eval.ts`
- `data/evals/translations-basic.jsonl`
- `data/evals/translations-edge-cases.jsonl`
- `src/judges/rubrics.ts`

## Úkol

Spusťte lab:

```sh
pnpm run lab:03
```

Vyberte tři případy:

1. Jeden passing případ, kde by měly projít guardrails i judge.
2. Jeden borderline případ, kde je otázka spíš QA policy než syntaxe.
3. Jeden failing případ, kde by nízké judge score mělo být očekávané.

Tabulku čtěte jako triage:

- `guardrails` říká, jestli zůstaly zachované placeholders, tagy, kódy, forbidden phrases a glossary.
- `judge` říká, jestli překlad dává významově a produktově smysl podle kritérií.
- `next` říká, kam se má QA dívat dál: `hard fail`, `quality`, `policy`, nebo `pass`.

U každého vybraného případu porovnejte `idealText`, `mustPreserve`, `forbiddenPatterns`, `glossary` a `minQualityScore` s Evalite výstupem. Pak si přečtěte kritéria pro `translation` a určete, která dimenze rozhoduje o kvalitě víc než exact match.

Kde přesně hledat:

1. Otevřete `.evalite/results/lab-03.json` a podle `case` najděte detail outputu a `scores`.
2. Stejné case ID najděte v `data/evals/translations-basic.jsonl` nebo `data/evals/translations-edge-cases.jsonl`.
3. V datasetu čtěte hlavně `expected.idealText`, `expected.mustPreserve`, `expected.forbiddenPatterns`, `expected.glossary` a `expected.minQualityScore`.
4. Kritéria judge najdete v `src/judges/rubrics.ts` pod translation kritérii.

Doporučené anchors:

- `translation-basic-cancel-es`: guardrails mohou projít, ale judge chytí otočený význam.
- `translation-edge-tags-fr`: strukturální hard fail; chybí tagy a chráněný kód.
- `translation-edge-drawer-es`: policy review nad glossary termínem.

Navrhněte jednu malou změnu: buď upravte threshold tak, aby odpovídal riziku, nebo doplňte expectation note, která vysvětluje borderline rozhodnutí. Cílem není donutit všechny případy projít. Cílem je mít eval, který generuje užitečné QA rozhodnutí.

## Kontrolní otázky

- Co je hard fail bez debaty a co má řešit judge?
- Které kritérium rozhodlo o nízkém judge score?
- Měníte threshold kvůli riziku, nebo jen kvůli zelenému výsledku?

## Gate / ověření

- `pnpm run lab:03` doběhne.
- U každého ze tří případů víte, jestli selhání pochází z guardrail, judge, nebo špatně nastavené expectation.
- Threshold umíte obhájit podle rizika, ne podle toho, jestli chcete zelený výstup.
- Borderline případ zůstane reviewovatelný a nezmizí v průměru.

## QA rozhodnutí

Rozhodněte, jestli by translation suite měla být automatický release gate, review dashboard, nebo kalibrační sada pro další prompt/model varianty.

Do rozhodnutí zahrňte, které chyby jsou objektivní strukturální fail a které potřebují judge nebo lidský review.
